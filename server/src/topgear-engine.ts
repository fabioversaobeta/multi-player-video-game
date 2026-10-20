// Adaptador do Top Gear para a interface GameEngine.
import { TICKS_PER_SECOND, type EngineEvent, type GameEngine } from './engine.js';
import type { GameFrame, InputAction } from './protocol.js';
import {
  MATCH_TICKS, SEG_LEN, TRACK_LEN, createTopGear, racerScore, steer, stepTopGear, topGearOver, useNitro, type TopGearState,
} from './topgear.js';

export class TopGearEngine implements GameEngine {
  readonly canPause = false;
  private state: TopGearState = createTopGear([], 0);
  private events: EngineEvent[] = [];

  start(playerIds: string[], seed: number): void {
    this.state = createTopGear(playerIds, seed);
    this.events = [];
  }

  /** ◀ ▶ mudam de lado; B (NITRO) liga o turbo. */
  input(playerId: string, action: InputAction): boolean {
    if (action === 'left') return steer(this.state, playerId, -1);
    if (action === 'right') return steer(this.state, playerId, 1);
    if (action === 'b') return useNitro(this.state, playerId);
    return false;
  }

  step(): void {
    stepTopGear(this.state);
    const s = this.state;
    for (const playerId of s.crashes.splice(0)) this.events.push({ playerId, kind: 'crash', value: 1 });
    for (const playerId of s.turbos.splice(0)) this.events.push({ playerId, kind: 'drop', value: 1 });
    for (const playerId of s.finishes.splice(0)) this.events.push({ playerId, kind: 'eat', value: 1 });
  }

  isOver(): boolean {
    return topGearOver(this.state);
  }

  score(playerId: string): number {
    const r = this.state.racers.find((x) => x.id === playerId);
    return r ? racerScore(r) : 0;
  }

  /** Cruzou a linha de chegada ou a corrida acabou. */
  playerOver(playerId: string): boolean {
    const r = this.state.racers.find((x) => x.id === playerId);
    return !!r && (r.finished || this.state.over);
  }

  frame(): GameFrame {
    const s = this.state;
    return {
      game: 'topgear',
      length: TRACK_LEN,
      segLen: SEG_LEN,
      curves: s.curves,
      obstacles: s.obstacles.map((o) => ({ x: o.x, z: o.z })),
      secondsLeft: Math.max(0, Math.ceil((MATCH_TICKS - s.ticks) / TICKS_PER_SECOND)),
      cars: s.racers.map((r) => ({
        id: r.id, x: r.x, z: r.z, speed: r.speed, charges: r.charges, turbo: r.nitro > 0,
        finished: r.finished, place: r.place, blink: r.invuln > 0, score: racerScore(r),
      })),
    };
  }

  drainEvents(): EngineEvent[] {
    return this.events.splice(0);
  }
}
