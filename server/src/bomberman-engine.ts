// Adaptador do Bomberman para a interface GameEngine.
import { BOMB_COLS, BOMB_ROWS, MATCH_TICKS, bombermanOver, createBomberman, move, plantBomb, stepBomberman, type BombermanState } from './bomberman.js';
import { TICKS_PER_SECOND, type EngineEvent, type GameEngine } from './engine.js';
import type { GameFrame, InputAction } from './protocol.js';

const ACTION_DIR: Partial<Record<InputAction, number>> = { up: 0, right: 1, down: 2, left: 3 };

export class BombermanEngine implements GameEngine {
  readonly canPause = false;
  private state: BombermanState = createBomberman([], 0);
  private events: EngineEvent[] = [];

  start(playerIds: string[], seed: number): void {
    this.state = createBomberman(playerIds, seed);
    this.events = [];
  }

  /** ▲ ▶ ▼ ◀ andam uma casa; A planta a bomba. */
  input(playerId: string, action: InputAction): boolean {
    if (action === 'a') return plantBomb(this.state, playerId);
    const dir = ACTION_DIR[action];
    return dir !== undefined && move(this.state, playerId, dir);
  }

  step(): void {
    stepBomberman(this.state);
    const s = this.state;
    for (const playerId of s.placed.splice(0)) this.events.push({ playerId, kind: 'drop', value: 1 });
    for (const playerId of new Set(s.destroyed.splice(0))) this.events.push({ playerId, kind: 'eat', value: 1 });
    for (const playerId of s.kills.splice(0)) this.events.push({ playerId, kind: 'lines', value: 1 });
    for (const playerId of s.deaths.splice(0)) this.events.push({ playerId, kind: 'crash', value: 1 });
  }

  isOver(): boolean {
    return bombermanOver(this.state);
  }

  score(playerId: string): number {
    return this.state.players.find((p) => p.id === playerId)?.score ?? 0;
  }

  playerOver(playerId: string): boolean {
    const p = this.state.players.find((x) => x.id === playerId);
    return !!p && !p.alive;
  }

  frame(): GameFrame {
    const s = this.state;
    return {
      game: 'bomberman',
      cols: BOMB_COLS,
      rows: BOMB_ROWS,
      grid: s.grid.map((r) => r.join('')),
      secondsLeft: Math.max(0, Math.ceil((MATCH_TICKS - s.ticks) / TICKS_PER_SECOND)),
      bombs: s.bombs.map((b) => ({ x: b.x, y: b.y, urgent: b.fuse < 30 })),
      flames: s.flames.map((f) => ({ x: f.x, y: f.y })),
      players: s.players.map((p) => ({ id: p.id, x: p.x, y: p.y, alive: p.alive, score: p.score })),
    };
  }

  drainEvents(): EngineEvent[] {
    return this.events.splice(0);
  }
}
