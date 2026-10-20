// Regras do Asteroids simplificado (todos contra todos): naves numa arena que dá a volta, asteroides que se
// partem e tiros que também acertam as outras naves. Estado mutável, atualizado por tick (30/s).
import { nextRandom } from '../../core/rng.js';

export const WIDTH = 160;
export const HEIGHT = 90;
export const MATCH_TICKS = 120 * 30; // 2min
export const LIVES = 3;
export const TURN_SPEED = 4; // rad/s
export const THRUST = 70; // unidades/s²
export const MAX_SPEED = 55;
export const DRAG = 0.992; // por tick
export const HOLD_TICKS = 4; // quanto tempo um toque mantém girar/acelerar
export const BULLET_SPEED = 90;
export const BULLET_LIFE = 40; // ticks (alcance ≈ 120)
export const MAX_BULLETS = 4;
export const FIRE_COOLDOWN = 6;
export const INVULN_TICKS = 90;
export const SHIP_R = 2.2;
export const ROCK_R = [0, 2.4, 4.4, 7]; // por tamanho (1 pequeno, 2 médio, 3 grande)
export const ROCK_POINTS = [0, 100, 50, 20];
export const KILL_POINTS = 300;
export const MIN_BIG_ROCKS = 4; // a cada 1 s repõe um grande se houver menos que isto

const DT = 1 / 30;

export interface Ship {
  id: string;
  x: number; y: number; vx: number; vy: number;
  angle: number; // 0 = direita, cresce no sentido anti-horário (y para cima)
  rot: -1 | 0 | 1; rotUntil: number;
  thrustUntil: number;
  cooldown: number;
  lives: number;
  invuln: number;
  alive: boolean;
  score: number;
}

export interface Bullet { owner: string; x: number; y: number; vx: number; vy: number; life: number }
export interface Rock { x: number; y: number; vx: number; vy: number; size: 1 | 2 | 3 }

export interface AsteroidsState {
  ships: Ship[];
  bullets: Bullet[];
  rocks: Rock[];
  ticks: number;
  over: boolean;
  rng: number;
  // eventos do último passo (ids), esvaziados pelo motor
  shots: string[];
  smashed: string[]; // quem destruiu um asteroide
  kills: string[]; // quem eliminou uma nave
  deaths: string[]; // naves destruídas
}

const wrap = (v: number, max: number) => ((v % max) + max) % max;
const dist = (ax: number, ay: number, bx: number, by: number) => {
  const dx = Math.abs(ax - bx), dy = Math.abs(ay - by);
  return Math.hypot(Math.min(dx, WIDTH - dx), Math.min(dy, HEIGHT - dy));
};

function rand(s: AsteroidsState): number {
  let r: number;
  [r, s.rng] = nextRandom(s.rng);
  return r;
}

function spawnRock(s: AsteroidsState, size: 1 | 2 | 3, x: number, y: number): void {
  const a = rand(s) * Math.PI * 2;
  const sp = (22 - size * 4) * (0.6 + rand(s) * 0.8);
  s.rocks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, size });
}

/** Asteroide grande nascendo longe das naves vivas. */
function spawnFarRock(s: AsteroidsState): void {
  for (let tries = 0; tries < 20; tries++) {
    const x = rand(s) * WIDTH, y = rand(s) * HEIGHT;
    if (s.ships.every((sh) => !sh.alive || dist(sh.x, sh.y, x, y) > 28)) { spawnRock(s, 3, x, y); return; }
  }
  spawnRock(s, 3, 0, 0);
}

export function createAsteroids(ids: string[], seed: number): AsteroidsState {
  const s: AsteroidsState = {
    ships: [], bullets: [], rocks: [], ticks: 0, over: false, rng: seed >>> 0,
    shots: [], smashed: [], kills: [], deaths: [],
  };
  s.ships = ids.map((id, i) => {
    const a = (2 * Math.PI * i) / Math.max(1, ids.length);
    return {
      id, x: wrap(WIDTH / 2 + Math.cos(a) * 30, WIDTH), y: wrap(HEIGHT / 2 + Math.sin(a) * 25, HEIGHT), vx: 0, vy: 0,
      angle: a + Math.PI / 2, rot: 0, rotUntil: 0, thrustUntil: 0, cooldown: 0,
      lives: LIVES, invuln: INVULN_TICKS, alive: true, score: 0,
    };
  });
  for (let i = 0; i < MIN_BIG_ROCKS + 1; i++) spawnFarRock(s);
  return s;
}

const find = (s: AsteroidsState, id: string) => s.ships.find((x) => x.id === id);

export function turn(s: AsteroidsState, id: string, dir: -1 | 1): boolean {
  const sh = find(s, id);
  if (!sh || !sh.alive || s.over) return false;
  sh.rot = dir;
  sh.rotUntil = s.ticks + HOLD_TICKS;
  return true;
}

export function thrust(s: AsteroidsState, id: string): boolean {
  const sh = find(s, id);
  if (!sh || !sh.alive || s.over) return false;
  sh.thrustUntil = s.ticks + HOLD_TICKS;
  return true;
}

export function fire(s: AsteroidsState, id: string): boolean {
  const sh = find(s, id);
  if (!sh || !sh.alive || s.over || sh.cooldown > 0) return false;
  if (s.bullets.filter((b) => b.owner === id).length >= MAX_BULLETS) return false;
  const c = Math.cos(sh.angle), n = Math.sin(sh.angle);
  s.bullets.push({
    owner: id, x: wrap(sh.x + c * SHIP_R, WIDTH), y: wrap(sh.y + n * SHIP_R, HEIGHT),
    vx: sh.vx + c * BULLET_SPEED, vy: sh.vy + n * BULLET_SPEED, life: BULLET_LIFE,
  });
  sh.cooldown = FIRE_COOLDOWN;
  s.shots.push(id);
  return true;
}

function destroyShip(s: AsteroidsState, sh: Ship, killer?: string): void {
  s.deaths.push(sh.id);
  if (killer && killer !== sh.id) {
    const k = find(s, killer);
    if (k) { k.score += KILL_POINTS; s.kills.push(killer); }
  }
  sh.lives--;
  sh.vx = sh.vy = 0;
  if (sh.lives <= 0) { sh.alive = false; return; }
  // reaparece no ponto mais livre entre alguns sorteios
  let best = { x: WIDTH / 2, y: HEIGHT / 2, d: -1 };
  for (let i = 0; i < 6; i++) {
    const x = rand(s) * WIDTH, y = rand(s) * HEIGHT;
    const d = Math.min(
      ...s.rocks.map((r) => dist(r.x, r.y, x, y) - ROCK_R[r.size]),
      ...s.ships.filter((o) => o !== sh && o.alive).map((o) => dist(o.x, o.y, x, y)),
    );
    if (d > best.d) best = { x, y, d };
  }
  sh.x = best.x; sh.y = best.y;
  sh.invuln = INVULN_TICKS;
}

export function stepAsteroids(s: AsteroidsState): void {
  if (s.over) return;
  s.ticks++;

  for (const sh of s.ships) {
    if (!sh.alive) continue;
    if (s.ticks <= sh.rotUntil) sh.angle += sh.rot * TURN_SPEED * DT;
    if (s.ticks <= sh.thrustUntil) {
      sh.vx += Math.cos(sh.angle) * THRUST * DT;
      sh.vy += Math.sin(sh.angle) * THRUST * DT;
    }
    sh.vx *= DRAG; sh.vy *= DRAG;
    const sp = Math.hypot(sh.vx, sh.vy);
    if (sp > MAX_SPEED) { sh.vx *= MAX_SPEED / sp; sh.vy *= MAX_SPEED / sp; }
    sh.x = wrap(sh.x + sh.vx * DT, WIDTH);
    sh.y = wrap(sh.y + sh.vy * DT, HEIGHT);
    if (sh.cooldown > 0) sh.cooldown--;
    if (sh.invuln > 0) sh.invuln--;
  }
  for (const r of s.rocks) { r.x = wrap(r.x + r.vx * DT, WIDTH); r.y = wrap(r.y + r.vy * DT, HEIGHT); }
  for (const b of s.bullets) { b.x = wrap(b.x + b.vx * DT, WIDTH); b.y = wrap(b.y + b.vy * DT, HEIGHT); b.life--; }

  // tiros: asteroides primeiro, depois naves (o dono nunca se acerta)
  const spent = new Set<Bullet>();
  for (const b of s.bullets) {
    const ri = s.rocks.findIndex((r) => dist(r.x, r.y, b.x, b.y) <= ROCK_R[r.size]);
    if (ri >= 0) {
      const r = s.rocks[ri];
      spent.add(b);
      s.rocks.splice(ri, 1);
      const owner = find(s, b.owner);
      if (owner) { owner.score += ROCK_POINTS[r.size]; s.smashed.push(owner.id); }
      if (r.size > 1) {
        spawnRock(s, (r.size - 1) as 1 | 2, r.x, r.y);
        spawnRock(s, (r.size - 1) as 1 | 2, r.x, r.y);
      }
      continue;
    }
    const target = s.ships.find((sh) => sh.alive && sh.id !== b.owner && sh.invuln <= 0 && dist(sh.x, sh.y, b.x, b.y) <= SHIP_R);
    if (target) { spent.add(b); destroyShip(s, target, b.owner); }
  }
  s.bullets = s.bullets.filter((b) => b.life > 0 && !spent.has(b));

  // nave x asteroide: só a nave sofre
  for (const sh of s.ships) {
    if (!sh.alive || sh.invuln > 0) continue;
    if (s.rocks.some((r) => dist(r.x, r.y, sh.x, sh.y) <= ROCK_R[r.size] + SHIP_R * 0.7)) destroyShip(s, sh);
  }

  // a arena nunca esvazia: repõe um grande por segundo enquanto houver poucos
  if (s.ticks % 30 === 0 && s.rocks.filter((r) => r.size === 3).length < MIN_BIG_ROCKS) spawnFarRock(s);

  if (s.ships.every((sh) => !sh.alive) || s.ticks >= MATCH_TICKS) s.over = true;
}

export function asteroidsOver(s: AsteroidsState): boolean {
  return s.over;
}
