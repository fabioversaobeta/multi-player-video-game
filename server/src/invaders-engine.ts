// Adaptador do Space Invaders para a interface GameEngine.
import type { EngineEvent, GameEngine } from './engine.js';
import {
  ALIEN_H, ALIEN_W, INV_H_FIELD, INV_W_FIELD, SHIP_H, SHIP_W, SHIP_Y, alienPos, createInvaders, fire, invadersOver,
  moveShip, stepInvaders, type InvadersState,
} from './invaders.js';
import type { GameFrame, InputAction } from './protocol.js';

export class InvadersEngine implements GameEngine {
  readonly canPause = false;
  private state: InvadersState = createInvaders([], 0);
  private events: EngineEvent[] = [];

  start(playerIds: string[], seed: number): void {
    this.state = createInvaders(playerIds, seed);
    this.events = [];
  }

  /** Esquerda/direita movem a nave; A atira. Demais botões são ignorados. */
  input(playerId: string, action: InputAction): boolean {
    if (action === 'a') return fire(this.state, playerId);
    if (action !== 'left' && action !== 'right') return false;
    return moveShip(this.state, playerId, action);
  }

  step(): void {
    stepInvaders(this.state);
    const s = this.state;
    for (const playerId of s.fired.splice(0)) this.events.push({ playerId, kind: 'drop', value: 1 });
    for (const playerId of s.kills.splice(0)) this.events.push({ playerId, kind: 'eat', value: 1 });
    for (const playerId of s.hits.splice(0)) this.events.push({ playerId, kind: 'crash', value: 1 });
    if (s.waveCleared) {
      s.waveCleared = false;
      for (const sh of s.ships) this.events.push({ playerId: sh.id, kind: 'lines', value: 1 });
    }
  }

  isOver(): boolean {
    return invadersOver(this.state);
  }

  score(playerId: string): number {
    return this.state.ships.find((x) => x.id === playerId)?.score ?? 0;
  }

  /** Nave destruída, ou os invasores chegaram embaixo (todos perdem). */
  playerOver(playerId: string): boolean {
    const sh = this.state.ships.find((x) => x.id === playerId);
    return !!sh && (sh.lives <= 0 || this.state.lost);
  }

  frame(): GameFrame {
    const s = this.state;
    return {
      game: 'invaders',
      w: INV_W_FIELD,
      h: INV_H_FIELD,
      shipY: SHIP_Y,
      shipW: SHIP_W,
      shipH: SHIP_H,
      alienW: ALIEN_W,
      alienH: ALIEN_H,
      wave: s.wave,
      aliens: s.aliens.map((a) => {
        const [x, y] = alienPos(s, a);
        return { x, y, row: a.row };
      }),
      shots: s.shots.map((t) => ({ x: t.x, y: t.y, enemy: t.owner === null })),
      ships: s.ships.map((sh) => ({ id: sh.id, x: sh.x, lives: sh.lives, score: sh.score, blink: sh.invuln > 0 })),
    };
  }

  drainEvents(): EngineEvent[] {
    return this.events.splice(0);
  }
}
