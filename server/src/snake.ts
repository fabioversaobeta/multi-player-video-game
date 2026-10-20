// Regras do Snake multiplayer: uma arena compartilhada. Estado mutável, atualizado por tick.
// Exceção às regras gerais (decisoes.md §3): aqui há colisão entre jogadores (bater em outra cobra custa uma vida).
// O tabuleiro é toroidal: sair por um lado faz a cobra reaparecer no lado oposto.
import { TICKS_PER_SECOND } from './engine.js';
import { nextRandom } from './rng.js';

export const SNAKE_COLS = 32;
export const SNAKE_ROWS = 18;
export const FOOD_POINTS = 10;
export const START_LIVES = 3;
const START_LENGTH = 3;

export type Point = [number, number]; // [x, y]
export type Turn = 'left' | 'right';
// 0 = cima, 1 = direita, 2 = baixo, 3 = esquerda
const DIRS: Point[] = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export interface Snake {
  id: string;
  body: Point[]; // cabeça primeiro; vazio quando morta
  dir: number;
  queue: Turn[]; // curvas pedidas e ainda não aplicadas (máx. 2)
  alive: boolean; // false só quando as vidas acabam
  lives: number;
  score: number;
}

export interface SnakeState {
  snakes: Snake[];
  foods: Point[];
  rng: number;
  ticks: number;
  moveCounter: number;
  /** Eventos do último passo (ids), esvaziados pelo motor. */
  eaten: string[];
  crashed: string[];
}

// Posições iniciais (cabeça + direção); até 6 jogadores.
const SPAWNS: { x: number; y: number; dir: number }[] = [
  { x: 4, y: 4, dir: 1 },
  { x: SNAKE_COLS - 5, y: SNAKE_ROWS - 5, dir: 3 },
  { x: 4, y: SNAKE_ROWS - 5, dir: 1 },
  { x: SNAKE_COLS - 5, y: 4, dir: 3 },
  { x: 4, y: SNAKE_ROWS >> 1, dir: 1 },
  { x: SNAKE_COLS - 5, y: SNAKE_ROWS >> 1, dir: 3 },
];

/** Ticks entre movimentos: começa em 6 (5 casas/s) e acelera até 3 conforme a partida avança. */
export function moveInterval(ticks: number): number {
  return Math.max(3, 6 - Math.floor(ticks / (TICKS_PER_SECOND * 25)));
}

export function createSnake(ids: string[], seed: number): SnakeState {
  const snakes: Snake[] = ids.map((id, i) => {
    const sp = SPAWNS[i % SPAWNS.length];
    const [dx, dy] = DIRS[sp.dir];
    const body: Point[] = Array.from({ length: START_LENGTH }, (_, k) => [sp.x - dx * k, sp.y - dy * k]);
    return { id, body, dir: sp.dir, queue: [], alive: true, lives: START_LIVES, score: 0 };
  });
  const s: SnakeState = {
    snakes, foods: [], rng: seed >>> 0, ticks: 0, moveCounter: 0, eaten: [], crashed: [],
  };
  refillFood(s);
  return s;
}

function refillFood(s: SnakeState): void {
  const total = SNAKE_COLS * SNAKE_ROWS;
  const taken = new Set<number>();
  for (const sn of s.snakes) for (const [x, y] of sn.body) taken.add(y * SNAKE_COLS + x);
  for (const [x, y] of s.foods) taken.add(y * SNAKE_COLS + x);
  const target = Math.max(2, s.snakes.length);
  while (s.foods.length < target && taken.size < total) {
    let r: number;
    [r, s.rng] = nextRandom(s.rng);
    let idx = Math.floor(r * total);
    while (taken.has(idx)) idx = (idx + 1) % total; // próxima casa livre
    taken.add(idx);
    s.foods.push([idx % SNAKE_COLS, Math.floor(idx / SNAKE_COLS)]);
  }
}

/** Pede uma curva (relativa à direção atual). Devolve false se rejeitada. */
export function turn(s: SnakeState, id: string, t: Turn): boolean {
  const sn = s.snakes.find((x) => x.id === id);
  if (!sn || !sn.alive || sn.queue.length >= 2) return false;
  sn.queue.push(t);
  return true;
}

/** Avança um tick; as cobras só andam a cada `moveInterval` ticks. */
export function stepSnake(s: SnakeState): void {
  s.ticks++;
  if (++s.moveCounter < moveInterval(s.ticks)) return;
  s.moveCounter = 0;

  const alive = s.snakes.filter((sn) => sn.alive);
  for (const sn of alive) {
    const t = sn.queue.shift();
    if (t) sn.dir = (sn.dir + (t === 'right' ? 1 : 3)) % 4;
  }
  const heads = new Map<Snake, Point>();
  for (const sn of alive) {
    const [dx, dy] = DIRS[sn.dir];
    heads.set(sn, [wrap(sn.body[0][0] + dx, SNAKE_COLS), wrap(sn.body[0][1] + dy, SNAKE_ROWS)]);
  }
  const foodAt = (p: Point) => s.foods.findIndex((f) => f[0] === p[0] && f[1] === p[1]);

  // Casas ocupadas depois do movimento: a ponta da cauda libera, a não ser que a cobra coma.
  const occupied = new Set<number>();
  for (const sn of alive) {
    const len = foodAt(heads.get(sn)!) >= 0 ? sn.body.length : sn.body.length - 1;
    for (let i = 0; i < len; i++) occupied.add(sn.body[i][1] * SNAKE_COLS + sn.body[i][0]);
  }

  const dead = new Set<Snake>();
  for (const sn of alive) {
    const [x, y] = heads.get(sn)!;
    const hitsBody = occupied.has(y * SNAKE_COLS + x);
    const headOn = alive.some((o) => o !== sn && heads.get(o)![0] === x && heads.get(o)![1] === y);
    if (hitsBody || headOn) dead.add(sn);
  }
  for (const sn of dead) {
    sn.lives--;
    sn.queue = [];
    s.crashed.push(sn.id);
    if (sn.lives <= 0) {
      sn.alive = false;
      sn.body = [];
    }
  }
  for (const sn of alive) {
    if (dead.has(sn)) continue;
    const head = heads.get(sn)!;
    sn.body.unshift(head);
    const f = foodAt(head);
    if (f >= 0) {
      s.foods.splice(f, 1);
      sn.score += FOOD_POINTS;
      s.eaten.push(sn.id);
    } else {
      sn.body.pop();
    }
  }
  // Quem ainda tem vidas renasce (depois do movimento, para ver o tabuleiro já atualizado).
  for (const sn of dead) if (sn.alive) respawn(s, sn);
  refillFood(s);
}

function wrap(v: number, max: number): number {
  return ((v % max) + max) % max;
}

/** Recoloca a cobra com o comprimento inicial numa faixa livre; se não houver espaço, ela cai. */
function respawn(s: SnakeState, sn: Snake): void {
  const total = SNAKE_COLS * SNAKE_ROWS;
  const taken = new Set<number>();
  for (const o of s.snakes) if (o !== sn) for (const [x, y] of o.body) taken.add(y * SNAKE_COLS + x);
  let r: number;
  [r, s.rng] = nextRandom(s.rng);
  const start = Math.floor(r * total);
  [r, s.rng] = nextRandom(s.rng);
  const dir = Math.floor(r * 4);
  const [dx, dy] = DIRS[dir];
  for (let n = 0; n < total; n++) {
    const idx = (start + n) % total;
    const hx = idx % SNAKE_COLS;
    const hy = Math.floor(idx / SNAKE_COLS);
    const body: Point[] = Array.from({ length: START_LENGTH }, (_, k) => [wrap(hx - dx * k, SNAKE_COLS), wrap(hy - dy * k, SNAKE_ROWS)]);
    // exige também 2 casas livres à frente, para não nascer encurralada
    const ahead: Point[] = [1, 2].map((k) => [wrap(hx + dx * k, SNAKE_COLS), wrap(hy + dy * k, SNAKE_ROWS)]);
    if ([...body, ...ahead].every(([x, y]) => !taken.has(y * SNAKE_COLS + x))) {
      sn.body = body;
      sn.dir = dir;
      return;
    }
  }
  sn.alive = false;
  sn.body = [];
}

export function allDead(s: SnakeState): boolean {
  return s.snakes.every((sn) => !sn.alive);
}
