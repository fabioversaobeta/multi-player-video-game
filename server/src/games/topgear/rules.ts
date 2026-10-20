// Regras do Top Gear simplificado: corrida numa pista com curvas e carros parados, todos na mesma pista.
// Cada jogador tem posição (z), lado (x: -1 a 1 = pista) e velocidade. Estado mutável, atualizado por tick.
import { nextRandom } from '../../core/rng.js';

export const TRACK_LEN = 3000;
export const SEG_LEN = 100; // comprimento de cada trecho de curva
export const MAX_SPEED = 50; // unidades/s
export const NITRO_SPEED = 80;
export const OFFROAD_SPEED = 18;
export const ACCEL = 25; // unidades/s²
export const BRAKE = 60;
export const STEER_STEP = 0.1;
export const STEER_COOLDOWN = 3; // ticks entre toques de direção
export const DRIFT = 1 / 200; // quanto a curva empurra o carro (x por unidade de velocidade)
export const NITRO_CHARGES = 3;
export const NITRO_TICKS = 60;
export const HIT_Z = 4;
export const HIT_X = 0.22;
export const CRASH_FACTOR = 0.4;
export const INVULN_TICKS = 30;
export const MATCH_TICKS = 120 * 30; // 2 min
export const GRACE_TICKS = 20 * 30; // tempo extra depois do primeiro a chegar
export const PROGRESS_POINTS = 300;
export const PLACE_BONUS = [1000, 700, 500, 300];

const DT = 1 / 30;

export interface Racer {
  id: string;
  x: number; z: number; speed: number;
  charges: number;
  nitro: number; // ticks restantes de turbo
  invuln: number;
  nextSteer: number;
  finished: boolean;
  place: number; // 0 até chegar
}

export interface Obstacle { x: number; z: number }

export interface TopGearState {
  racers: Racer[];
  curves: number[]; // -1 (esquerda) a 1 (direita), um por trecho
  obstacles: Obstacle[];
  ticks: number;
  finishedCount: number;
  firstFinishTick: number | null;
  over: boolean;
  /** Eventos do último passo (ids de jogador), esvaziados pelo motor. */
  crashes: string[];
  turbos: string[];
  finishes: string[];
}

export function createTopGear(ids: string[], seed: number): TopGearState {
  let rng = seed >>> 0;
  const rand = () => { let r: number; [r, rng] = nextRandom(rng); return r; };
  const round2 = (v: number) => Math.round(v * 100) / 100;

  const curves: number[] = [];
  let c = 0;
  for (let i = 0; i < TRACK_LEN / SEG_LEN + 5; i++) {
    c = i < 3 || rand() < 0.35 ? 0 : Math.max(-1, Math.min(1, c * 0.4 + (rand() * 2 - 1) * 0.9));
    curves.push(round2(c));
  }

  const obstacles: Obstacle[] = [];
  for (let z = 250; z < TRACK_LEN - 100; z += 55) {
    if (rand() < 0.65) obstacles.push({ z: z + Math.floor(rand() * 20), x: round2(rand() * 1.6 - 0.8) });
    if (rand() < 0.25) obstacles.push({ z: z + 25, x: round2(rand() * 1.6 - 0.8) });
  }

  return {
    curves, obstacles, ticks: 0, finishedCount: 0, firstFinishTick: null, over: false,
    racers: ids.map((id, i) => ({
      id, x: ids.length === 1 ? 0 : -0.6 + (1.2 * i) / (ids.length - 1), z: 0, speed: 0,
      charges: NITRO_CHARGES, nitro: 0, invuln: 0, nextSteer: 0, finished: false, place: 0,
    })),
    crashes: [], turbos: [], finishes: [],
  };
}

export const curveAt = (curves: number[], z: number) =>
  curves[Math.max(0, Math.min(curves.length - 1, Math.floor(z / SEG_LEN)))];

const find = (s: TopGearState, id: string) => s.racers.find((r) => r.id === id);

/** Muda de lado. Devolve false se o jogador não corre mais ou está em recarga. */
export function steer(s: TopGearState, id: string, dir: -1 | 1): boolean {
  const r = find(s, id);
  if (!r || r.finished || s.over || s.ticks < r.nextSteer) return false;
  r.x = Math.max(-1.3, Math.min(1.3, r.x + dir * STEER_STEP));
  r.nextSteer = s.ticks + STEER_COOLDOWN;
  return true;
}

/** Liga o turbo (3 cargas por corrida). */
export function useNitro(s: TopGearState, id: string): boolean {
  const r = find(s, id);
  if (!r || r.finished || s.over || r.charges <= 0 || r.nitro > 0) return false;
  r.charges--;
  r.nitro = NITRO_TICKS;
  s.turbos.push(id);
  return true;
}

export function stepTopGear(s: TopGearState): void {
  if (s.over) return;
  s.ticks++;
  for (const r of s.racers) {
    if (r.finished) continue;
    let target = r.nitro > 0 ? NITRO_SPEED : MAX_SPEED;
    if (Math.abs(r.x) > 1) target = Math.min(target, OFFROAD_SPEED);
    r.speed = r.speed < target ? Math.min(target, r.speed + ACCEL * DT) : Math.max(target, r.speed - BRAKE * DT);
    if (r.nitro > 0) r.nitro--;
    if (r.invuln > 0) r.invuln--;

    // a curva empurra o carro para fora dela (curva > 0 = para a direita, empurra para a esquerda)
    r.x = Math.max(-1.3, Math.min(1.3, r.x - curveAt(s.curves, r.z) * r.speed * DRIFT * DT));
    r.z += r.speed * DT;

    if (r.invuln === 0 && s.obstacles.some((o) => Math.abs(o.z - r.z) < HIT_Z && Math.abs(o.x - r.x) < HIT_X)) {
      r.speed *= CRASH_FACTOR;
      r.invuln = INVULN_TICKS;
      s.crashes.push(r.id);
    }

    if (r.z >= TRACK_LEN) {
      r.z = TRACK_LEN;
      r.finished = true;
      r.place = ++s.finishedCount;
      s.finishes.push(r.id);
      if (s.firstFinishTick === null) s.firstFinishTick = s.ticks;
    }
  }

  const multi = s.racers.length > 1;
  const allDone = s.racers.every((r) => r.finished);
  const grace = multi && s.firstFinishTick !== null && s.ticks - s.firstFinishTick >= GRACE_TICKS;
  if (allDone || grace || s.ticks >= MATCH_TICKS) s.over = true;
}

/** Pontos pelo trecho percorrido, mais o bônus de colocação para quem cruzou a linha. */
export function racerScore(r: Racer): number {
  const progress = Math.floor((Math.min(r.z, TRACK_LEN) / TRACK_LEN) * PROGRESS_POINTS);
  return progress + (r.place > 0 ? PLACE_BONUS[Math.min(r.place, PLACE_BONUS.length) - 1] : 0);
}

export function topGearOver(s: TopGearState): boolean {
  return s.over;
}
