import { randomBytes, randomUUID } from 'node:crypto';
import type {
  BoardFrame, GameFrame, InputAction, Phase, PlayerInfo, RankingEntry, RoomState,
} from './protocol.js';
import {
  TICKS_PER_SECOND, applyAction, createTetris, flatten, tick, type TetrisAction, type TetrisState,
} from './tetris.js';

export const MAX_PLAYERS = 4; // a estrutura não depende deste número (pode chegar a 6)
export const COLORS = ['#ff4d4d', '#4da6ff', '#ffd94d', '#5ce65c', '#c77dff', '#ff9f43'];
export const COUNTDOWN_SECONDS = 3;
const EMPTY_ROOM_TTL_MS = 30_000;
const NAME_MAX = 12;

export interface AuditEntry {
  at: number;
  playerId: string;
  action: string;
  accepted: boolean;
  reason?: string;
}

interface Player {
  id: string;
  token: string;
  name: string;
  color: string;
  ready: boolean;
  connected: boolean;
  socketId: string | null;
  game: TetrisState | null;
}

export class Room {
  readonly code: string;
  readonly tvToken = randomBytes(8).toString('hex');
  phase: Phase = 'lobby';
  tvSocketId: string | null = null;
  players = new Map<string, Player>();
  audit: AuditEntry[] = [];
  /** Jogadores que iniciaram a partida atual (aparecem no ranking mesmo se desconectarem). */
  private matchPlayers: string[] = [];
  private countdownTicks = 0;
  private scoreTicks = 0;
  private scoreSig = "";
  private ranking: RankingEntry[] | null = null;
  emptySince: number | null = null;
  stateDirty = true;
  frameDirty = false;

  constructor(code: string, private maxPlayers = MAX_PLAYERS) {
    this.code = code;
  }

  // ---------- entrada / saída ----------
  join(
    name: string, socketId: string, token?: string,
  ): { ok: true; player: Player } | { ok: false; error: string } {
    const existing = token ? [...this.players.values()].find((p) => p.token === token) : undefined;
    if (existing) {
      existing.connected = true;
      existing.socketId = socketId;
      this.emptySince = null;
      this.touch();
      return { ok: true, player: existing };
    }
    if (this.phase !== 'lobby' && this.phase !== 'countdown') {
      return { ok: false, error: 'Partida em andamento. Aguarde a próxima rodada.' };
    }
    if (this.players.size >= this.maxPlayers) return { ok: false, error: 'Sala cheia.' };
    const used = new Set([...this.players.values()].map((p) => p.color));
    const color = COLORS.find((c) => !used.has(c)) ?? COLORS[0];
    const player: Player = {
      id: randomUUID().slice(0, 8),
      token: randomUUID(),
      name: sanitizeName(name),
      color,
      ready: false,
      connected: true,
      socketId,
      game: null,
    };
    this.players.set(player.id, player);
    this.cancelCountdown();
    this.emptySince = null;
    this.touch();
    return { ok: true, player };
  }

  disconnectSocket(socketId: string): void {
    if (this.tvSocketId === socketId) this.tvSocketId = null;
    for (const p of [...this.players.values()]) {
      if (p.socketId !== socketId) continue;
      p.connected = false;
      p.socketId = null;
      // No lobby o jogador simplesmente sai; durante a partida nada muda (o jogo dele segue).
      if (this.phase === 'lobby' || this.phase === 'countdown') this.players.delete(p.id);
    }
    this.cancelCountdown();
    this.touch();
    this.checkEmpty();
  }

  hasConnections(): boolean {
    return this.tvSocketId !== null || [...this.players.values()].some((p) => p.connected);
  }

  checkEmpty(now = Date.now()): void {
    if (this.hasConnections()) this.emptySince = null;
    else if (this.emptySince === null) this.emptySince = now;
  }

  isExpired(now = Date.now()): boolean {
    return this.emptySince !== null && now - this.emptySince >= EMPTY_ROOM_TTL_MS;
  }

  // ---------- lobby ----------
  setReady(playerId: string, ready: boolean): void {
    const p = this.players.get(playerId);
    if (!p || this.phase !== 'lobby') return;
    p.ready = ready;
    this.touch();
    const present = [...this.players.values()].filter((x) => x.connected);
    if (present.length > 0 && present.every((x) => x.ready)) {
      this.phase = 'countdown';
      this.countdownTicks = COUNTDOWN_SECONDS * TICKS_PER_SECOND;
    }
  }

  private cancelCountdown(): void {
    if (this.phase === 'countdown') {
      this.phase = 'lobby';
      for (const p of this.players.values()) p.ready = false;
    }
  }

  private startMatch(): void {
    this.phase = 'playing';
    this.ranking = null;
    this.matchPlayers = [...this.players.keys()];
    const base = (Date.now() & 0xffffff) >>> 0;
    this.matchPlayers.forEach((id, i) => {
      this.players.get(id)!.game = createTetris(base + i * 7919);
    });
    this.frameDirty = true;
  }

  backToLobby(): void {
    if (this.phase !== 'results') return;
    for (const p of [...this.players.values()]) {
      p.ready = false;
      p.game = null;
      if (!p.connected) this.players.delete(p.id);
    }
    this.matchPlayers = [];
    this.ranking = null;
    this.phase = 'lobby';
    this.touch();
  }

  // ---------- jogo ----------
  input(playerId: string, action: InputAction): void {
    const p = this.players.get(playerId);
    const log = (accepted: boolean, reason?: string) => {
      this.audit.push({ at: Date.now(), playerId, action, accepted, reason });
      if (this.audit.length > 500) this.audit.shift();
    };
    if (!p) return log(false, 'jogador desconhecido');
    if (this.phase === 'results') {
      if (action === 'a') this.backToLobby();
      return;
    }
    if (this.phase !== 'playing' || !p.game) return log(false, 'fora de partida');
    if (action === 'pause') return log(false, 'pausa ignorada no multiplayer');
    const before = p.game;
    const after = applyAction(before, action as TetrisAction);
    if (after === before) return log(false, 'movimento inválido');
    p.game = after;
    this.frameDirty = true;
    log(true);
  }

  /** Um tick do servidor (30/s). */
  step(): void {
    if (this.phase === 'countdown') {
      this.countdownTicks--;
      if (this.countdownTicks % TICKS_PER_SECOND === 0) this.touch();
      if (this.countdownTicks <= 0) {
        this.startMatch();
        this.touch();
      }
      return;
    }
    if (this.phase !== 'playing') return;
    let allOver = true;
    for (const id of this.matchPlayers) {
      const p = this.players.get(id)!;
      if (!p.game) continue;
      const wasOver = p.game.over;
      p.game = tick(p.game);
      if (p.game.over && !wasOver) this.touch();
      if (!p.game.over) allOver = false;
    }
    this.frameDirty = true;
    this.syncScores();
    if (allOver) this.finish();
  }

  /** Placar leve para os celulares: reenvia o estado da sala a cada ~1/3 s, só se algo mudou. */
  private syncScores(): void {
    if (++this.scoreTicks % 10 !== 0) return;
    const sig = this.matchPlayers.map((id) => this.players.get(id)?.game?.score ?? 0).join(",");
    if (sig !== this.scoreSig) {
      this.scoreSig = sig;
      this.touch();
    }
  }

  private finish(): void {
    const ordered = this.matchPlayers
      .map((id) => this.players.get(id)!)
      .sort((a, b) => b.game!.score - a.game!.score);
    this.ranking = ordered.map((p, i) => ({
      position: i + 1, playerId: p.id, name: p.name, color: p.color, score: p.game!.score,
    }));
    this.phase = 'results';
    this.touch();
  }

  // ---------- serialização ----------
  touch(): void {
    this.stateDirty = true;
  }

  state(): RoomState {
    const ids = this.phase === 'lobby' || this.phase === 'countdown'
      ? [...this.players.keys()]
      : this.matchPlayers;
    const players: PlayerInfo[] = ids
      .map((id) => this.players.get(id))
      .filter((p): p is Player => !!p)
      .map((p) => ({
        id: p.id, name: p.name, color: p.color, ready: p.ready, connected: p.connected,
        score: p.game?.score ?? 0, over: p.game?.over ?? false,
      }));
    return {
      code: this.code,
      phase: this.phase,
      maxPlayers: this.maxPlayers,
      countdown: this.phase === 'countdown' ? Math.ceil(this.countdownTicks / TICKS_PER_SECOND) : null,
      players,
      ranking: this.ranking,
    };
  }

  frame(): GameFrame {
    const boards: Record<string, BoardFrame> = {};
    for (const id of this.matchPlayers) {
      const g = this.players.get(id)?.game;
      if (!g) continue;
      boards[id] = {
        cells: flatten(g), next: g.next, score: g.score, lines: g.lines, level: g.level, over: g.over,
      };
    }
    return { boards };
  }
}

export function sanitizeName(raw: unknown): string {
  const s = String(raw ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, NAME_MAX);
  return s || 'Jogador';
}

export class RoomManager {
  rooms = new Map<string, Room>();

  create(): Room {
    let code: string;
    do code = randomCode(); while (this.rooms.has(code));
    const room = new Room(code);
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(String(code ?? '').toUpperCase());
  }

  sweep(now = Date.now()): string[] {
    const removed: string[] = [];
    for (const [code, room] of this.rooms) {
      room.checkEmpty(now);
      if (room.isExpired(now)) {
        this.rooms.delete(code);
        removed.push(code);
      }
    }
    return removed;
  }
}

// sem letras ambíguas (I, O) para facilitar digitar o código
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
function randomCode(): string {
  const bytes = randomBytes(4);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}
