// Adaptador do Doodle para a interface GameEngine.
import { TICKS_PER_SECOND, type EngineEvent, type GameEngine } from '../../core/engine.js';
import type { GameFrame, InputAction } from '../../protocol.js';
import {
  MATCH_TICKS, PLATFORM_W, VIEW_H, WIDTH, createDoodle, doodleOver, jumperScore, move, platformX, stepDoodle, type DoodleState,
} from './rules.js';

export class DoodleEngine implements GameEngine {
  readonly canPause = false;
  private state: DoodleState = createDoodle([], 0);
  private events: EngineEvent[] = [];

  start(playerIds: string[], seed: number): void {
    this.state = createDoodle(playerIds, seed);
    this.events = [];
  }

  /** ◀ ▶ movem o personagem (ele pula sozinho). */
  input(playerId: string, action: InputAction): boolean {
    if (action === 'left') return move(this.state, playerId, -1);
    if (action === 'right') return move(this.state, playerId, 1);
    return false;
  }

  step(): void {
    stepDoodle(this.state);
    for (const playerId of this.state.falls.splice(0)) this.events.push({ playerId, kind: 'crash', value: 1 });
  }

  isOver(): boolean {
    return doodleOver(this.state);
  }

  score(playerId: string): number {
    const j = this.state.jumpers.find((x) => x.id === playerId);
    return j ? jumperScore(j) : 0;
  }

  playerOver(playerId: string): boolean {
    const j = this.state.jumpers.find((x) => x.id === playerId);
    return !!j && (!j.alive || this.state.over);
  }

  frame(): GameFrame {
    const s = this.state;
    return {
      game: 'doodle',
      w: WIDTH,
      h: VIEW_H,
      platformW: PLATFORM_W,
      secondsLeft: Math.max(0, Math.ceil((MATCH_TICKS - s.ticks) / TICKS_PER_SECOND)),
      jumpers: s.jumpers.map((j) => ({
        id: j.id, x: j.x, y: j.y, vy: j.vy, face: j.face, cam: j.cam, alive: j.alive, score: jumperScore(j),
        platforms: s.platforms
          .map((p, i) => ({ p, i }))
          .filter(({ p, i }) => p.y >= j.cam - 4 && p.y <= j.cam + VIEW_H + 4 && !(p.kind === 'fragile' && j.broken.has(i)))
          .map(({ p }) => ({ x: Math.round(platformX(p, s.ticks) * 10) / 10, y: p.y, kind: p.kind })),
      })),
    };
  }

  drainEvents(): EngineEvent[] {
    return this.events.splice(0);
  }
}
