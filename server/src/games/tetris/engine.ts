// Adaptador do Tetris para a interface GameEngine: um tabuleiro independente por jogador.
import type { EngineEvent, GameEngine } from '../../core/engine.js';
import type { BoardFrame, GameFrame, InputAction } from '../../protocol.js';
import { applyAction, createTetris, flatten, tick, type TetrisAction, type TetrisState } from './rules.js';

export class TetrisEngine implements GameEngine {
  readonly canPause = false; // Tetris multiplayer não tem pausa
  private games = new Map<string, TetrisState>();
  private events: EngineEvent[] = [];

  start(playerIds: string[], seed: number): void {
    this.games.clear();
    this.events = [];
    playerIds.forEach((id, i) => this.games.set(id, createTetris(seed + i * 7919)));
  }

  input(playerId: string, action: InputAction): boolean {
    const before = this.games.get(playerId);
    if (!before || action === 'pause') return false;
    const after = applyAction(before, action as TetrisAction);
    if (after === before) return false;
    this.set(playerId, after);
    return true;
  }

  step(): void {
    for (const [id, g] of this.games) this.set(id, tick(g));
  }

  isOver(): boolean {
    return [...this.games.values()].every((g) => g.over);
  }

  score(playerId: string): number {
    return this.games.get(playerId)?.score ?? 0;
  }

  playerOver(playerId: string): boolean {
    return this.games.get(playerId)?.over ?? false;
  }

  frame(): GameFrame {
    const boards: Record<string, BoardFrame> = {};
    for (const [id, g] of this.games) {
      boards[id] = {
        cells: flatten(g), next: g.next, score: g.score, lines: g.lines, level: g.level, over: g.over,
      };
    }
    return { game: 'tetris', boards };
  }

  drainEvents(): EngineEvent[] {
    return this.events.splice(0);
  }

  private set(playerId: string, next: TetrisState): void {
    const prev = this.games.get(playerId);
    const cleared = next.lines - (prev?.lines ?? 0);
    if (prev?.dropping && !next.dropping) this.events.push({ playerId, kind: 'drop', value: 1 });
    if (cleared > 0) this.events.push({ playerId, kind: 'lines', value: cleared });
    this.games.set(playerId, next);
  }
}
