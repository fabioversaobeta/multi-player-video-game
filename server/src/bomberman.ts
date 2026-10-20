// Regras do Bomberman simplificado: arena em grade com pilares e blocos destrutíveis, todos contra todos.
// Uma vida por jogador; uma bomba por vez, alcance fixo. Vence o último de pé. Estado mutável, atualizado por tick.
import { nextRandom } from './rng.js';

export const BOMB_COLS = 15;
export const BOMB_ROWS = 13;
export const FUSE_TICKS = 90; // 3 s
export const FLAME_TICKS = 15;
export const BLAST_RANGE = 2;
export const MOVE_COOLDOWN = 5; // ticks entre passos (6 casas/s)
export const MATCH_TICKS = 150 * 30; // 2min30: acabou o tempo, termina
export const BLOCK_POINTS = 10;
export const KILL_POINTS = 200;
export const WIN_POINTS = 500;
const BLOCK_CHANCE = 0.7;

export const BOMB_SPAWNS: [number, number][] = [[1, 1], [BOMB_COLS - 2, BOMB_ROWS - 2], [BOMB_COLS - 2, 1], [1, BOMB_ROWS - 2]];

// 0 = cima, 1 = direita, 2 = baixo, 3 = esquerda
export const DIRS: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export interface Bomber {
  id: string;
  x: number; y: number;
  alive: boolean;
  score: number;
  nextMove: number; // tick a partir do qual pode andar de novo
}

export interface Bomb { x: number; y: number; owner: string; fuse: number }
export interface Flame { x: number; y: number; owner: string; ttl: number }

export interface BombermanState {
  /** '#' pilar/borda · 'B' bloco destrutível · ' ' livre */
  grid: string[][];
  players: Bomber[];
  bombs: Bomb[];
  flames: Flame[];
  blocks: number;
  ticks: number;
  over: boolean;
  /** Eventos do último passo (ids de jogador), esvaziados pelo motor. */
  placed: string[];
  destroyed: string[];
  kills: string[];
  deaths: string[];
  winner: string | null;
}

const isPillar = (x: number, y: number) =>
  x === 0 || y === 0 || x === BOMB_COLS - 1 || y === BOMB_ROWS - 1 || (x % 2 === 0 && y % 2 === 0);

/** Casas ao redor dos pontos de partida ficam sempre livres. */
const nearSpawn = (x: number, y: number) =>
  BOMB_SPAWNS.some(([sx, sy]) => Math.abs(x - sx) + Math.abs(y - sy) <= 2);

export function createBomberman(ids: string[], seed: number): BombermanState {
  let rng = seed >>> 0;
  let blocks = 0;
  const grid: string[][] = [];
  for (let y = 0; y < BOMB_ROWS; y++) {
    const row: string[] = [];
    for (let x = 0; x < BOMB_COLS; x++) {
      let r: number;
      [r, rng] = nextRandom(rng);
      if (isPillar(x, y)) row.push('#');
      else if (!nearSpawn(x, y) && r < BLOCK_CHANCE) { row.push('B'); blocks++; }
      else row.push(' ');
    }
    grid.push(row);
  }
  return {
    grid, blocks, ticks: 0, over: false, bombs: [], flames: [], winner: null,
    players: ids.map((id, i) => {
      const [x, y] = BOMB_SPAWNS[i % BOMB_SPAWNS.length];
      return { id, x, y, alive: true, score: 0, nextMove: 0 };
    }),
    placed: [], destroyed: [], kills: [], deaths: [],
  };
}

const bombAt = (s: BombermanState, x: number, y: number) => s.bombs.find((b) => b.x === x && b.y === y);

/** Anda uma casa. Devolve false se o jogador não existe/está morto, está em recarga ou a casa está bloqueada. */
export function move(s: BombermanState, id: string, dir: number): boolean {
  const p = s.players.find((x) => x.id === id);
  if (!p || !p.alive || s.over || dir < 0 || dir > 3 || s.ticks < p.nextMove) return false;
  const x = p.x + DIRS[dir][0];
  const y = p.y + DIRS[dir][1];
  if (s.grid[y]?.[x] !== ' ' || bombAt(s, x, y)) return false;
  p.x = x; p.y = y;
  p.nextMove = s.ticks + MOVE_COOLDOWN;
  return true;
}

/** Planta uma bomba onde o jogador está (só uma ativa por jogador). */
export function plantBomb(s: BombermanState, id: string): boolean {
  const p = s.players.find((x) => x.id === id);
  if (!p || !p.alive || s.over) return false;
  if (s.bombs.some((b) => b.owner === id) || bombAt(s, p.x, p.y)) return false;
  s.bombs.push({ x: p.x, y: p.y, owner: id, fuse: FUSE_TICKS });
  s.placed.push(id);
  return true;
}

function addFlame(s: BombermanState, x: number, y: number, owner: string): void {
  const f = s.flames.find((q) => q.x === x && q.y === y);
  if (f) { f.ttl = FLAME_TICKS; f.owner = owner; } else s.flames.push({ x, y, owner, ttl: FLAME_TICKS });
}

/** Explode a bomba; outras bombas atingidas explodem em cadeia. */
function explode(s: BombermanState, first: Bomb): void {
  const queue = [first];
  while (queue.length) {
    const b = queue.pop()!;
    const i = s.bombs.indexOf(b);
    if (i < 0) continue;
    s.bombs.splice(i, 1);
    const owner = s.players.find((p) => p.id === b.owner);
    addFlame(s, b.x, b.y, b.owner);
    for (const [dx, dy] of DIRS) {
      for (let r = 1; r <= BLAST_RANGE; r++) {
        const x = b.x + dx * r;
        const y = b.y + dy * r;
        const c = s.grid[y][x];
        if (c === '#') break;
        addFlame(s, x, y, b.owner);
        if (c === 'B') {
          s.grid[y][x] = ' ';
          s.blocks--;
          if (owner) owner.score += BLOCK_POINTS;
          s.destroyed.push(b.owner);
          break;
        }
        const other = bombAt(s, x, y);
        if (other) queue.push(other);
      }
    }
  }
}

/** Quem está numa casa em chamas morre; quem plantou a bomba ganha pontos (menos se foi a própria). */
function burn(s: BombermanState): void {
  for (const p of s.players) {
    if (!p.alive) continue;
    const f = s.flames.find((q) => q.x === p.x && q.y === p.y);
    if (!f) continue;
    p.alive = false;
    s.deaths.push(p.id);
    const killer = s.players.find((q) => q.id === f.owner);
    if (killer && killer.id !== p.id) {
      killer.score += KILL_POINTS;
      s.kills.push(killer.id);
    }
    p.x = p.y = -1;
  }
}

export function stepBomberman(s: BombermanState): void {
  if (s.over) return;
  s.ticks++;
  s.flames = s.flames.filter((f) => --f.ttl > 0);
  for (const b of [...s.bombs]) if (--b.fuse <= 0) explode(s, b);
  burn(s);

  const alive = s.players.filter((p) => p.alive);
  const multi = s.players.length > 1;
  if ((multi ? alive.length <= 1 : alive.length === 0) || s.ticks >= MATCH_TICKS || (!multi && s.blocks === 0)) {
    s.over = true;
    if (multi && alive.length === 1) { alive[0].score += WIN_POINTS; s.winner = alive[0].id; }
  }
}

export function bombermanOver(s: BombermanState): boolean {
  return s.over;
}
