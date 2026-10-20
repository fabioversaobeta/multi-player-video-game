// Regras do Space Invaders cooperativo: todos defendem a mesma arena, cada um com sua nave embaixo.
// Estado mutável, atualizado por tick. Unidades: campo de 100×70.
import { nextRandom } from '../../core/rng.js';

export const INV_W_FIELD = 100;
export const INV_H_FIELD = 70;
export const SHIP_Y = 64;
export const SHIP_W = 7;
export const SHIP_H = 3;
export const SHIP_STEP = 3;
export const SHIP_LIVES = 3;
export const ALIEN_W = 5;
export const ALIEN_H = 3.5;
export const COLS = 9;
export const ROWS = 4;
export const GAP_X = 9;
export const GAP_Y = 6;
const ROW_POINTS = [30, 20, 20, 10]; // linhas de cima valem mais
const DROP = 3; // quanto o pelotão desce ao bater na borda
const MARGIN = 3;
const SHOT_SPEED = 2;
const BOMB_SPEED = 0.8;
const INVULN_TICKS = 60;

export interface Alien { col: number; row: number }
export interface Ship { id: string; x: number; lives: number; score: number; invuln: number }
export interface Shot { x: number; y: number; owner: string | null } // owner nulo = bomba dos invasores

export interface InvadersState {
  ships: Ship[];
  aliens: Alien[];
  ox: number; // centro do invasor da coluna 0
  oy: number; // centro dos invasores da linha 0
  dir: 1 | -1;
  wave: number;
  shots: Shot[];
  bombTimer: number;
  lost: boolean; // os invasores chegaram embaixo
  rng: number;
  /** Eventos do último passo, esvaziados pelo motor. */
  fired: string[];
  kills: string[];
  hits: string[];
  waveCleared: boolean;
}

export const alienPos = (s: InvadersState, a: Alien): [number, number] => [s.ox + a.col * GAP_X, s.oy + a.row * GAP_Y];

function spawnWave(s: InvadersState): void {
  s.aliens = [];
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) s.aliens.push({ col, row });
  s.ox = (INV_W_FIELD - (COLS - 1) * GAP_X) / 2;
  s.oy = Math.min(8 + (s.wave - 1) * 3, 20);
  s.dir = 1;
  s.shots = s.shots.filter((x) => x.owner !== null);
  s.bombTimer = 40;
}

export function createInvaders(ids: string[], seed: number): InvadersState {
  const n = Math.max(1, ids.length);
  const s: InvadersState = {
    ships: ids.map((id, i) => ({ id, x: ((i + 1) * INV_W_FIELD) / (n + 1), lives: SHIP_LIVES, score: 0, invuln: 0 })),
    aliens: [], ox: 0, oy: 0, dir: 1, wave: 1, shots: [], bombTimer: 40, lost: false, rng: seed >>> 0,
    fired: [], kills: [], hits: [], waveCleared: false,
  };
  spawnWave(s);
  return s;
}

const alive = (sh: Ship) => sh.lives > 0;

/** Move a nave um passo. Devolve false se a nave não existe, está destruída ou já está na borda. */
export function moveShip(s: InvadersState, id: string, dir: 'left' | 'right'): boolean {
  const sh = s.ships.find((x) => x.id === id);
  if (!sh || !alive(sh) || s.lost) return false;
  const x = Math.min(INV_W_FIELD - SHIP_W / 2, Math.max(SHIP_W / 2, sh.x + (dir === 'left' ? -SHIP_STEP : SHIP_STEP)));
  if (x === sh.x) return false;
  sh.x = x;
  return true;
}

/** Atira (um tiro por vez por jogador). */
export function fire(s: InvadersState, id: string): boolean {
  const sh = s.ships.find((x) => x.id === id);
  if (!sh || !alive(sh) || s.lost || s.shots.some((t) => t.owner === id)) return false;
  s.shots.push({ x: sh.x, y: SHIP_Y - SHIP_H, owner: id });
  s.fired.push(id);
  return true;
}

export function stepInvaders(s: InvadersState): void {
  if (invadersOver(s)) return;

  // pelotão: acelera conforme sobram menos invasores e a cada onda
  const speed = Math.min(1.2, (0.12 + (1 - s.aliens.length / (COLS * ROWS)) * 0.5) * (1 + 0.15 * (s.wave - 1)));
  s.ox += s.dir * speed;
  const cols = s.aliens.map((a) => a.col);
  const minX = s.ox + Math.min(...cols) * GAP_X - ALIEN_W / 2;
  const maxX = s.ox + Math.max(...cols) * GAP_X + ALIEN_W / 2;
  if ((s.dir === 1 && maxX >= INV_W_FIELD - MARGIN) || (s.dir === -1 && minX <= MARGIN)) {
    s.dir = (s.dir * -1) as 1 | -1;
    s.oy += DROP;
  }
  const lowest = s.oy + Math.max(...s.aliens.map((a) => a.row)) * GAP_Y + ALIEN_H / 2;
  if (lowest >= SHIP_Y - SHIP_H / 2) { s.lost = true; return; }

  // bombas: saem do invasor mais baixo de uma coluna sorteada
  if (--s.bombTimer <= 0) {
    let r: number;
    [r, s.rng] = nextRandom(s.rng);
    const live = [...new Set(cols)];
    const col = live[Math.floor(r * live.length)];
    const front = s.aliens.filter((a) => a.col === col).sort((a, b) => b.row - a.row)[0];
    const [bx, by] = alienPos(s, front);
    s.shots.push({ x: bx, y: by + ALIEN_H / 2, owner: null });
    [r, s.rng] = nextRandom(s.rng);
    s.bombTimer = Math.max(12, Math.round(45 - s.wave * 4 + r * 25 - s.ships.length * 2));
  }

  const bombSpeed = BOMB_SPEED + 0.08 * (s.wave - 1);
  for (const t of s.shots) t.y += t.owner === null ? bombSpeed : -SHOT_SPEED;

  // tiros dos jogadores contra invasores
  for (const t of s.shots) {
    if (t.owner === null) continue;
    const i = s.aliens.findIndex((a) => {
      const [ax, ay] = alienPos(s, a);
      return Math.abs(t.x - ax) <= ALIEN_W / 2 && Math.abs(t.y - ay) <= ALIEN_H / 2 + 1;
    });
    if (i < 0) continue;
    const sh = s.ships.find((x) => x.id === t.owner);
    if (sh) sh.score += ROW_POINTS[s.aliens[i].row];
    s.kills.push(t.owner);
    s.aliens.splice(i, 1);
    t.y = -100; // consumido
  }

  // bombas contra naves
  for (const t of s.shots) {
    if (t.owner !== null || t.y < SHIP_Y - SHIP_H / 2 || t.y > SHIP_Y + SHIP_H / 2) continue;
    const sh = s.ships.find((x) => alive(x) && Math.abs(t.x - x.x) <= SHIP_W / 2);
    if (!sh) continue;
    t.y = INV_H_FIELD + 100; // consumida
    if (sh.invuln > 0) continue;
    sh.lives--;
    sh.invuln = INVULN_TICKS;
    s.hits.push(sh.id);
  }
  for (const sh of s.ships) if (sh.invuln > 0) sh.invuln--;
  s.shots = s.shots.filter((t) => t.y > 0 && t.y < INV_H_FIELD);

  if (s.aliens.length === 0) { // onda vencida: a próxima começa mais baixa e mais rápida
    s.wave++;
    s.waveCleared = true;
    spawnWave(s);
  }
}

export function invadersOver(s: InvadersState): boolean {
  return s.lost || s.ships.every((x) => !alive(x));
}
