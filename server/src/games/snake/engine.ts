// Adaptador do Snake para a interface GameEngine: todos jogam na mesma arena.
import type { EngineEvent, GameEngine } from '../../core/engine.js';
import type { GameFrame, InputAction } from '@mpvg/shared';
import {
  SNAKE_COLS, SNAKE_ROWS, allDead, createSnake, stepSnake, turn, type SnakeState,
} from './rules.js';

export class SnakeEngine implements GameEngine {
  readonly canPause = false;
  private state: SnakeState = createSnake([], 0);
  private events: EngineEvent[] = [];

  start(playerIds: string[], seed: number): void {
    this.state = createSnake(playerIds, seed);
    this.events = [];
  }

  /** Esquerda/direita giram a cobra em relação ao sentido em que ela anda. */
  input(playerId: string, action: InputAction): boolean {
    if (action !== 'left' && action !== 'right') return false;
    return turn(this.state, playerId, action);
  }

  step(): void {
    stepSnake(this.state);
    for (const playerId of this.state.eaten.splice(0)) this.events.push({ playerId, kind: 'eat', value: 1 });
    for (const playerId of this.state.crashed.splice(0)) this.events.push({ playerId, kind: 'crash', value: 1 });
  }

  isOver(): boolean {
    return allDead(this.state);
  }

  score(playerId: string): number {
    return this.state.snakes.find((s) => s.id === playerId)?.score ?? 0;
  }

  playerOver(playerId: string): boolean {
    const s = this.state.snakes.find((x) => x.id === playerId);
    return s ? !s.alive : false;
  }

  frame(): GameFrame {
    return {
      game: 'snake',
      cols: SNAKE_COLS,
      rows: SNAKE_ROWS,
      foods: this.state.foods.map(([x, y]) => [x, y]),
      snakes: this.state.snakes.map((s) => ({
        id: s.id, cells: s.body.map(([x, y]) => [x, y]), alive: s.alive, lives: s.lives, score: s.score,
      })),
    };
  }

  drainEvents(): EngineEvent[] {
    return this.events.splice(0);
  }
}
