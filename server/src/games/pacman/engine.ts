// Adaptador do Pac-Man para a interface GameEngine.
import type { EngineEvent, GameEngine } from '../../core/engine.js';
import {
  PAC_COLS, PAC_INTERVAL, PAC_ROWS, createPacman, drawPos, ghostInterval, pacmanOver, steer, stepPacman, type PacmanState,
} from './rules.js';
import type { GameFrame, InputAction } from '@mpvg/shared';

const ACTION_DIR: Partial<Record<InputAction, number>> = { up: 0, right: 1, down: 2, left: 3 };

const pos = ([x, y]: [number, number]) => ({ x, y });

export class PacmanEngine implements GameEngine {
  readonly canPause = false;
  private state: PacmanState = createPacman([], 0);
  private events: EngineEvent[] = [];

  start(playerIds: string[], seed: number): void {
    this.state = createPacman(playerIds, seed);
    this.events = [];
  }

  /** ▲ ▶ ▼ ◀ escolhem a direção; o jogador segue andando até bater numa parede. */
  input(playerId: string, action: InputAction): boolean {
    const dir = ACTION_DIR[action];
    return dir !== undefined && steer(this.state, playerId, dir);
  }

  step(): void {
    stepPacman(this.state);
    const s = this.state;
    for (const playerId of s.pellets.splice(0)) this.events.push({ playerId, kind: 'eat', value: 1 });
    for (const playerId of s.ghostsEaten.splice(0)) this.events.push({ playerId, kind: 'lines', value: 1 });
    for (const playerId of s.deaths.splice(0)) this.events.push({ playerId, kind: 'crash', value: 1 });
    if (s.levelCleared) {
      s.levelCleared = false;
      for (const p of s.pacs) this.events.push({ playerId: p.id, kind: 'lines', value: 4 });
    }
  }

  isOver(): boolean {
    return pacmanOver(this.state);
  }

  score(playerId: string): number {
    return this.state.pacs.find((x) => x.id === playerId)?.score ?? 0;
  }

  playerOver(playerId: string): boolean {
    const p = this.state.pacs.find((x) => x.id === playerId);
    return !!p && p.lives <= 0;
  }

  frame(): GameFrame {
    const s = this.state;
    return {
      game: 'pacman',
      cols: PAC_COLS,
      rows: PAC_ROWS,
      grid: s.grid.map((r) => r.join('')),
      level: s.level,
      frightened: s.frightLeft > 0,
      flash: s.frightLeft > 0 && s.frightLeft < 60,
      pacs: s.pacs.map((p) => ({
        id: p.id, ...pos(drawPos(s, p, PAC_INTERVAL)), face: p.face, lives: p.lives, score: p.score, blink: p.invuln > 0 || !p.started,
      })),
      ghosts: s.ghosts.map((g) => ({ ...pos(drawPos(s, g, g.scared ? ghostInterval(s.level) + 3 : ghostInterval(s.level))), kind: g.kind, scared: g.scared })),
    };
  }

  drainEvents(): EngineEvent[] {
    return this.events.splice(0);
  }
}
