// Regras do Pong: 2 raquetes (1º e 2º jogadores). Com 1 jogador, a 2ª raquete é controlada pelo servidor (CPU).
// Demais jogadores da sala assistem. Estado mutável, atualizado por tick. Unidades: campo de 100×60.
import { nextRandom } from '../../core/rng.js';

export const PONG_W = 100;
export const PONG_H = 60;
export const PADDLE_H = 12;
export const PADDLE_W = 2;
export const PADDLE_MARGIN = 3; // distância do centro da raquete até a borda lateral
export const PADDLE_STEP = 3.5; // deslocamento por comando recebido (o celular repete enquanto o botão está pressionado)
export const BALL_R = 1;
export const WIN_SCORE = 7;
export const CPU_ID = 'cpu';
const START_SPEED = 0.9; // unidades por tick
const MAX_SPEED = 2;
const SPEEDUP = 1.07;
const MAX_ANGLE = (55 * Math.PI) / 180;
const SERVE_DELAY = 45; // ticks parado antes do saque
const CPU_SPEED = 0.8;

export type Dir = 'up' | 'down';

export interface Paddle {
  id: string; // CPU_ID quando controlada pelo servidor
  x: number;
  y: number; // centro
  score: number;
}

export interface PongState {
  paddles: [Paddle, Paddle];
  ball: { x: number; y: number; vx: number; vy: number };
  rng: number;
  serveTimer: number;
  /** Eventos do último passo, esvaziados pelo motor. */
  hits: string[];
  scored: { winner: string; loser: string }[];
}

export function createPong(ids: string[], seed: number): PongState {
  return {
    paddles: [
      { id: ids[0] ?? CPU_ID, x: PADDLE_MARGIN, y: PONG_H / 2, score: 0 },
      { id: ids[1] ?? CPU_ID, x: PONG_W - PADDLE_MARGIN, y: PONG_H / 2, score: 0 },
    ],
    ball: { x: PONG_W / 2, y: PONG_H / 2, vx: 0, vy: 0 },
    rng: seed >>> 0,
    serveTimer: SERVE_DELAY,
    hits: [],
    scored: [],
  };
}

const clampPaddle = (y: number) => Math.min(PONG_H - PADDLE_H / 2, Math.max(PADDLE_H / 2, y));

/** Move a raquete do jogador um passo. Devolve false se o jogador não tem raquete ou já está no limite. */
export function movePaddle(s: PongState, id: string, dir: Dir): boolean {
  const p = s.paddles.find((x) => x.id === id);
  if (!p) return false;
  const y = clampPaddle(p.y + (dir === 'up' ? -PADDLE_STEP : PADDLE_STEP));
  if (y === p.y) return false;
  p.y = y;
  return true;
}

/** Saca a bola em direção à raquete `toward` (0 = esquerda, 1 = direita) com ângulo sorteado. */
function serve(s: PongState, toward: 0 | 1): void {
  let r: number;
  [r, s.rng] = nextRandom(s.rng);
  const angle = (r - 0.5) * MAX_ANGLE;
  const sign = toward === 0 ? -1 : 1;
  s.ball = {
    x: PONG_W / 2,
    y: PONG_H / 2,
    vx: sign * START_SPEED * Math.cos(angle),
    vy: START_SPEED * Math.sin(angle),
  };
}

export function stepPong(s: PongState): void {
  const b = s.ball;
  // CPU acompanha a bola só quando ela vem em sua direção, e mais devagar que um humano atento
  for (const [i, p] of s.paddles.entries()) {
    if (p.id !== CPU_ID) continue;
    const incoming = i === 0 ? b.vx < 0 : b.vx > 0;
    const d = (incoming ? b.y : PONG_H / 2) - p.y;
    if (Math.abs(d) > 1) p.y = clampPaddle(p.y + Math.sign(d) * Math.min(CPU_SPEED, Math.abs(d)));
  }

  if (b.vx === 0) { // bola parada entre pontos
    if (--s.serveTimer <= 0) serve(s, s.paddles[0].score <= s.paddles[1].score ? 0 : 1);
    return;
  }

  b.x += b.vx;
  b.y += b.vy;
  if (b.y < BALL_R) { b.y = BALL_R; b.vy = Math.abs(b.vy); }
  if (b.y > PONG_H - BALL_R) { b.y = PONG_H - BALL_R; b.vy = -Math.abs(b.vy); }

  for (const [i, p] of s.paddles.entries()) {
    const movingToward = i === 0 ? b.vx < 0 : b.vx > 0;
    const face = p.x + (i === 0 ? 1 : -1) * (PADDLE_W / 2);
    const reached = i === 0 ? b.x - BALL_R <= face : b.x + BALL_R >= face;
    const inside = i === 0 ? b.x > p.x - PADDLE_W : b.x < p.x + PADDLE_W; // já passou da raquete: não rebate mais
    if (!movingToward || !reached || !inside || Math.abs(b.y - p.y) > PADDLE_H / 2 + BALL_R) continue;
    // o ponto de contato na raquete define o ângulo de saída; cada rebatida acelera a bola
    const offset = Math.max(-1, Math.min(1, (b.y - p.y) / (PADDLE_H / 2)));
    const speed = Math.min(MAX_SPEED, Math.hypot(b.vx, b.vy) * SPEEDUP);
    const angle = offset * MAX_ANGLE;
    b.vx = (i === 0 ? 1 : -1) * speed * Math.cos(angle);
    b.vy = speed * Math.sin(angle);
    b.x = i === 0 ? face + BALL_R : face - BALL_R;
    s.hits.push(p.id);
    return;
  }

  if (b.x < -BALL_R || b.x > PONG_W + BALL_R) {
    const winner = b.x < 0 ? 1 : 0;
    s.paddles[winner].score++;
    s.scored.push({ winner: s.paddles[winner].id, loser: s.paddles[1 - winner].id });
    s.ball = { x: PONG_W / 2, y: PONG_H / 2, vx: 0, vy: 0 };
    s.serveTimer = SERVE_DELAY;
  }
}

export function pongOver(s: PongState): boolean {
  return s.paddles.some((p) => p.score >= WIN_SCORE);
}
