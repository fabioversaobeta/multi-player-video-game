// Regras do Doodle simplificado (estilo Doodle Jump / Flappy): cada jogador salta sozinho de plataforma em
// plataforma, subindo o mais alto possível. A torre é a mesma para todos (gerada pela semente da partida).
// Coordenadas: x de 0 a WIDTH (a tela dá a volta), y cresce para cima. Estado mutável, atualizado por tick.
import { nextRandom } from './rng.js';

export const WIDTH = 100;
export const VIEW_H = 150; // altura visível
export const PLATFORM_W = 18;
export const PLATFORM_ROWS = 400;
export const GRAVITY = 150; // unidades/s²
export const JUMP = 95; // velocidade do pulo (altura ≈ 30)
export const MOVE_SPEED = 55; // unidades/s
export const HOLD_TICKS = 7; // quanto tempo um toque mantém o movimento
export const CAM_MARGIN = 75; // o jogador fica até aqui acima da base da tela
export const MATCH_TICKS = 150 * 30; // 2min30
export const MOVING_AMP = 20;

const DT = 1 / 30;

export type PlatformKind = 'normal' | 'moving' | 'fragile';

export interface Platform {
  kind: PlatformKind;
  /** x central (para as móveis, o centro da oscilação). */
  x: number;
  y: number;
  /** Fase da oscilação (só móveis). */
  phase: number;
}

export interface Jumper {
  id: string;
  x: number; y: number; vy: number;
  dir: -1 | 0 | 1;
  dirUntil: number;
  face: -1 | 1;
  cam: number; // y da base da tela
  best: number; // altura máxima
  alive: boolean;
  broken: Set<number>; // plataformas frágeis já quebradas (por jogador)
}

export interface DoodleState {
  platforms: Platform[];
  jumpers: Jumper[];
  ticks: number;
  over: boolean;
  /** Mortes do último passo (ids), esvaziadas pelo motor. */
  falls: string[];
}

export function createDoodle(ids: string[], seed: number): DoodleState {
  let rng = seed >>> 0;
  const rand = () => { let r: number; [r, rng] = nextRandom(rng); return r; };
  const round1 = (v: number) => Math.round(v * 10) / 10;

  // chão largo, depois uma plataforma "principal" por linha (sempre alcançável) e, às vezes, uma frágil de enfeite
  const platforms: Platform[] = [{ kind: 'normal', x: WIDTH / 2, y: 4, phase: 0 }];
  let y = 4;
  for (let i = 1; i < PLATFORM_ROWS; i++) {
    const gap = 8 + rand() * (5 + Math.min(9, i / 20)); // no máximo 22 < altura do pulo
    y = round1(y + gap);
    const moving = rand() < Math.min(0.45, 0.05 + i / 400);
    const x = round1(moving ? MOVING_AMP + PLATFORM_W / 2 + rand() * (WIDTH - 2 * MOVING_AMP - PLATFORM_W) : PLATFORM_W / 2 + rand() * (WIDTH - PLATFORM_W));
    platforms.push({ kind: moving ? 'moving' : 'normal', x, y, phase: round1(rand() * 6.28) });
    if (rand() < 0.3) {
      platforms.push({ kind: 'fragile', x: round1(PLATFORM_W / 2 + rand() * (WIDTH - PLATFORM_W)), y: round1(y - gap / 2), phase: 0 });
    }
  }

  platforms.sort((a, b) => a.y - b.y);

  return {
    platforms, ticks: 0, over: false, falls: [],
    jumpers: ids.map((id, i) => ({
      id, x: ids.length === 1 ? WIDTH / 2 : 20 + (60 * i) / (ids.length - 1), y: 4, vy: JUMP, dir: 0, dirUntil: 0, face: 1,
      cam: 0, best: 0, alive: true, broken: new Set<number>(),
    })),
  };
}

/** Posição x atual da plataforma (as móveis oscilam com o tempo). */
export const platformX = (p: Platform, ticks: number) =>
  p.kind === 'moving' ? p.x + MOVING_AMP * Math.sin(ticks / 30 * 1.6 + p.phase) : p.x;

/** Move para o lado por um instante. Devolve false se o jogador não joga mais. */
export function move(s: DoodleState, id: string, dir: -1 | 1): boolean {
  const j = s.jumpers.find((x) => x.id === id);
  if (!j || !j.alive || s.over) return false;
  j.dir = dir;
  j.dirUntil = s.ticks + HOLD_TICKS;
  j.face = dir;
  return true;
}

export function stepDoodle(s: DoodleState): void {
  if (s.over) return;
  s.ticks++;
  for (const j of s.jumpers) {
    if (!j.alive) continue;
    const dx = s.ticks <= j.dirUntil ? j.dir * MOVE_SPEED * DT : 0;
    j.x = (j.x + dx + WIDTH) % WIDTH;
    const prevY = j.y;
    j.vy -= GRAVITY * DT;
    j.y += j.vy * DT;

    if (j.vy < 0) {
      for (let i = 0; i < s.platforms.length; i++) {
        const p = s.platforms[i];
        if (p.y > prevY) break; // ordenadas por altura: as próximas estão acima
        if (p.y < j.y) continue;
        if (p.kind === 'fragile' && j.broken.has(i)) continue;
        const raw = Math.abs(j.x - platformX(p, s.ticks));
        if (Math.min(raw, WIDTH - raw) <= PLATFORM_W / 2 + 2) {
          if (p.kind === 'fragile') j.broken.add(i);
          j.y = p.y;
          j.vy = JUMP;
          break;
        }
      }
    }

    j.best = Math.max(j.best, j.y);
    j.cam = Math.max(j.cam, j.y - CAM_MARGIN);
    if (j.y < j.cam - 2) {
      j.alive = false;
      s.falls.push(j.id);
    }
  }

  if (s.jumpers.every((j) => !j.alive) || s.ticks >= MATCH_TICKS) s.over = true;
}

export const jumperScore = (j: Jumper) => Math.floor(j.best);

export function doodleOver(s: DoodleState): boolean {
  return s.over;
}
