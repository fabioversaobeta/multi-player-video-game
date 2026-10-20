import { describe, expect, it } from 'vitest';
import { PongEngine } from './pong-engine.js';
import {
  CPU_ID, PADDLE_H, PADDLE_STEP, PONG_H, PONG_W, WIN_SCORE, createPong, movePaddle, pongOver, stepPong,
} from './pong.js';

/** Avança até a bola ser sacada. */
function untilServed(s: ReturnType<typeof createPong>) {
  for (let i = 0; i < 200 && s.ball.vx === 0; i++) stepPong(s);
}

describe('pong', () => {
  it('raquete sobe e desce em passos fixos e para nos limites', () => {
    const s = createPong(['a', 'b'], 1);
    expect(movePaddle(s, 'a', 'up')).toBe(true);
    expect(s.paddles[0].y).toBe(PONG_H / 2 - PADDLE_STEP);
    for (let i = 0; i < 50; i++) movePaddle(s, 'a', 'down');
    expect(s.paddles[0].y).toBe(PONG_H - PADDLE_H / 2);
    expect(movePaddle(s, 'a', 'down')).toBe(false);
    expect(movePaddle(s, 'ninguem', 'up')).toBe(false);
  });

  it('com 1 jogador, a segunda raquete é a CPU', () => {
    const s = createPong(['a'], 1);
    expect(s.paddles[1].id).toBe(CPU_ID);
    expect(movePaddle(s, CPU_ID, 'up')).toBe(true); // só o servidor deve chamar isso; o motor não expõe o id
  });

  it('a bola só é sacada depois da pausa', () => {
    const s = createPong(['a', 'b'], 1);
    stepPong(s);
    expect(s.ball.vx).toBe(0);
    untilServed(s);
    expect(s.ball.vx).not.toBe(0);
  });

  it('rebate na raquete, inverte o sentido e acelera', () => {
    const s = createPong(['a', 'b'], 1);
    s.ball = { x: 6, y: 30, vx: -1, vy: 0 };
    s.paddles[0].y = 30;
    stepPong(s);
    stepPong(s);
    expect(s.ball.vx).toBeGreaterThan(1);
    expect(s.hits).toEqual(['a']);
  });

  it('ponto para quem não deixou a bola passar; o placar sobe e a bola volta ao centro', () => {
    const s = createPong(['a', 'b'], 1);
    s.paddles[0].y = 5; // longe da bola
    s.ball = { x: 4, y: 50, vx: -1, vy: 0 };
    for (let i = 0; i < 10; i++) stepPong(s);
    expect(s.paddles[1].score).toBe(1);
    expect(s.scored).toEqual([{ winner: 'b', loser: 'a' }]);
    expect(s.ball.vx).toBe(0);
    expect(s.ball.x).toBe(PONG_W / 2);
  });

  it('quica nas paredes de cima e de baixo', () => {
    const s = createPong(['a', 'b'], 1);
    s.ball = { x: 50, y: 1.5, vx: 0.5, vy: -1 };
    stepPong(s);
    expect(s.ball.vy).toBeGreaterThan(0);
  });

  it('a partida acaba ao chegar a 7 pontos; o motor ignora botões que não movem a raquete', () => {
    const e = new PongEngine();
    e.start(['a', 'b'], 1);
    expect(e.input('a', 'a')).toBe(false);
    expect(e.input('a', 'left')).toBe(true);
    expect(e.isOver()).toBe(false);
    const s = createPong(['a', 'b'], 1);
    s.paddles[1].score = WIN_SCORE;
    expect(pongOver(s)).toBe(true);
  });

  it('CPU sozinha contra um jogador parado eventualmente faz pontos', () => {
    const e = new PongEngine();
    e.start(['a'], 7);
    for (let i = 0; i < 30 * 60 * 5 && !e.isOver(); i++) e.step();
    expect(e.isOver()).toBe(true);
    expect(e.score('a')).toBeLessThan(WIN_SCORE);
  });
});
