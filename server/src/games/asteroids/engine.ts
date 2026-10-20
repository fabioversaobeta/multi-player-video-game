// Adaptador do Asteroids para a interface GameEngine.
import {
  HEIGHT, MATCH_TICKS, ROCK_R, SHIP_R, WIDTH, asteroidsOver, createAsteroids, fire, stepAsteroids, thrust, turn, type AsteroidsState,
} from './rules.js';
import { TICKS_PER_SECOND, type EngineEvent, type GameEngine } from '../../core/engine.js';
import type { GameFrame, InputAction } from '@mpvg/shared';

const r1 = (v: number) => Math.round(v * 10) / 10;

export class AsteroidsEngine implements GameEngine {
  readonly canPause = false;
  private state: AsteroidsState = createAsteroids([], 0);
  private events: EngineEvent[] = [];

  start(playerIds: string[], seed: number): void {
    this.state = createAsteroids(playerIds, seed);
    this.events = [];
  }

  /** ◀ ▶ giram, ▲ acelera, A atira. */
  input(playerId: string, action: InputAction): boolean {
    if (action === 'left') return turn(this.state, playerId, 1);
    if (action === 'right') return turn(this.state, playerId, -1);
    if (action === 'up') return thrust(this.state, playerId);
    if (action === 'a') return fire(this.state, playerId);
    return false;
  }

  step(): void {
    stepAsteroids(this.state);
    const s = this.state;
    for (const playerId of s.shots.splice(0)) this.events.push({ playerId, kind: 'drop', value: 1 });
    for (const playerId of new Set(s.smashed.splice(0))) this.events.push({ playerId, kind: 'eat', value: 1 });
    for (const playerId of s.kills.splice(0)) this.events.push({ playerId, kind: 'lines', value: 1 });
    for (const playerId of s.deaths.splice(0)) this.events.push({ playerId, kind: 'crash', value: 1 });
  }

  isOver(): boolean {
    return asteroidsOver(this.state);
  }

  score(playerId: string): number {
    return this.state.ships.find((p) => p.id === playerId)?.score ?? 0;
  }

  playerOver(playerId: string): boolean {
    const p = this.state.ships.find((x) => x.id === playerId);
    return !!p && !p.alive;
  }

  frame(): GameFrame {
    const s = this.state;
    return {
      game: 'asteroids',
      w: WIDTH,
      h: HEIGHT,
      shipR: SHIP_R,
      secondsLeft: Math.max(0, Math.ceil((MATCH_TICKS - s.ticks) / TICKS_PER_SECOND)),
      ships: s.ships.map((p) => ({
        id: p.id, x: r1(p.x), y: r1(p.y), angle: Math.round(p.angle * 100) / 100, alive: p.alive, lives: p.lives,
        invuln: p.invuln > 0, thrusting: s.ticks <= p.thrustUntil, score: p.score,
      })),
      rocks: s.rocks.map((r) => ({ x: r1(r.x), y: r1(r.y), r: ROCK_R[r.size] })),
      bullets: s.bullets.map((b) => ({ x: r1(b.x), y: r1(b.y), owner: b.owner })),
    };
  }

  drainEvents(): EngineEvent[] {
    return this.events.splice(0);
  }
}
