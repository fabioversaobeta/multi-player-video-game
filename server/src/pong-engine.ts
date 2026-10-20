// Adaptador do Pong para a interface GameEngine.
import type { EngineEvent, GameEngine } from './engine.js';
import type { GameFrame, InputAction } from './protocol.js';
import { CPU_ID, PADDLE_H, PONG_H, PONG_W, createPong, movePaddle, pongOver, stepPong, type PongState } from './pong.js';

export class PongEngine implements GameEngine {
  readonly canPause = false;
  private state: PongState = createPong([], 0);
  private events: EngineEvent[] = [];

  start(playerIds: string[], seed: number): void {
    this.state = createPong(playerIds, seed);
    this.events = [];
  }

  /** Esquerda sobe e direita desce a raquete. Demais botões são ignorados. */
  input(playerId: string, action: InputAction): boolean {
    if (action !== 'left' && action !== 'right') return false;
    return movePaddle(this.state, playerId, action === 'left' ? 'up' : 'down');
  }

  step(): void {
    stepPong(this.state);
    for (const id of this.state.hits.splice(0)) this.events.push({ playerId: id, kind: 'drop', value: 1 });
    for (const { winner, loser } of this.state.scored.splice(0)) {
      this.events.push({ playerId: winner, kind: 'eat', value: 1 });
      this.events.push({ playerId: loser, kind: 'crash', value: 1 });
    }
  }

  isOver(): boolean {
    return pongOver(this.state);
  }

  score(playerId: string): number {
    return this.state.paddles.find((p) => p.id === playerId)?.score ?? 0;
  }

  /** Quando alguém faz 7 pontos a partida acaba para todos. */
  playerOver(_playerId: string): boolean {
    return pongOver(this.state);
  }

  frame(): GameFrame {
    const { paddles, ball } = this.state;
    return {
      game: 'pong',
      w: PONG_W,
      h: PONG_H,
      paddleH: PADDLE_H,
      ball: { x: ball.x, y: ball.y },
      paddles: paddles.map((p) => ({ id: p.id === CPU_ID ? null : p.id, x: p.x, y: p.y, score: p.score })),
    };
  }

  drainEvents(): EngineEvent[] {
    return this.events.splice(0);
  }
}
