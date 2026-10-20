// Regras do Pac-Man cooperativo: todos os jogadores comem os pontos do mesmo labirinto e fogem dos mesmos fantasmas.
// Estado mutável, atualizado por tick. Movimento em casas (grade); o túnel da linha 9 liga as bordas.
import { nextRandom } from '../../core/rng.js';

// '#' parede · '.' ponto · 'o' pílula · ' ' vazio · 'H' casa dos fantasmas (ninguém anda ali, só nascem)
const TEMPLATE = [
  '###################',
  '#........#........#',
  '#o##.###.#.###.##o#',
  '#.................#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.### # ###.####',
  '####.#       #.####',
  '####.# ##H## #.####',
  '    .  #HHH#  .    ',
  '####.# ##### #.####',
  '####.#       #.####',
  '####.# ##### #.####',
  '#........#........#',
  '#.##.###.#.###.##.#',
  '#o.#...........#.o#',
  '##.#.#.#####.#.#.##',
  '#....#...#...#....#',
  '#.######.#.######.#',
  '#.................#',
  '###################',
];

export const PAC_COLS = TEMPLATE[0].length;
export const PAC_ROWS = TEMPLATE.length;
export const PAC_LIVES = 3;
export const DOT_POINTS = 10;
export const PELLET_POINTS = 50;
export const GHOST_POINTS = 200;
export const PAC_INTERVAL = 8; // ticks entre movimentos do jogador (3,75 casas/s)
const INVULN_TICKS = 120;
const NEVER = -1e9;
const GHOST_HOME: [number, number] = [9, 9];
const GHOST_EXIT: [number, number] = [9, 7];
const releaseTicks = (kind: number) => 90 + kind * 150; // só contam depois que alguém se mexe
/** Um fantasma no nível 1 e mais um a cada nível (até 8). */
export const ghostCount = (level: number) => Math.min(8, level);
/** Distância (em casas de caminho) em que o fantasma passa a perseguir, e a partir da qual perde o rastro. */
export const SIGHT = 6;
export const LOSE_TRACK = 10;
// Pontos de partida (todos vazios e alcançáveis); até 6 jogadores.
export const PAC_SPAWNS: [number, number][] = [[9, 15], [1, 19], [17, 19], [1, 13], [17, 13], [9, 19]];

// 0 = cima, 1 = direita, 2 = baixo, 3 = esquerda
const DIRS: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export interface Pac {
  id: string;
  x: number; y: number; px: number; py: number;
  dir: number; // -1 = parado
  want: number; // direção pedida
  face: number; // para onde a boca aponta
  lives: number;
  score: number;
  invuln: number;
  fx: number; fy: number; mt: number; // de onde veio e em que tick andou (para suavizar o desenho)
  started: boolean; // antes do primeiro movimento: invencível e invisível aos fantasmas
}

export interface Ghost {
  kind: number; // 0..3: define cor e comportamento
  x: number; y: number; px: number; py: number;
  fx: number; fy: number; mt: number;
  dir: number;
  scared: boolean;
  chasing: boolean; // está no rastro de um jogador
  release: number; // ticks até sair da casa (> 0 = ainda dentro)
}

export interface PacmanState {
  pacs: Pac[];
  ghosts: Ghost[];
  grid: string[][];
  dotsLeft: number;
  level: number;
  frightLeft: number;
  ticks: number;
  rng: number;
  /** Eventos do último passo (ids de jogador), esvaziados pelo motor. */
  pellets: string[];
  ghostsEaten: string[];
  deaths: string[];
  levelCleared: boolean;
}

export const ghostInterval = (level: number) => Math.max(10, 12 - Math.floor((level - 1) / 2)); // nível 1: 2,5 casas/s (sempre mais lento que o jogador)
const frightTicks = (level: number) => Math.max(90, 240 - (level - 1) * 30);

function buildGrid(): { grid: string[][]; dots: number } {
  const grid = TEMPLATE.map((r) => [...r]);
  let dots = 0;
  for (const row of grid) for (const c of row) if (c === '.' || c === 'o') dots++;
  return { grid, dots };
}

function placeGhosts(s: PacmanState): void {
  const fast = s.level > 1 ? 0.5 : 1;
  s.ghosts = Array.from({ length: ghostCount(s.level) }, (_, kind) => ({
    kind, x: GHOST_HOME[0], y: GHOST_HOME[1], px: GHOST_HOME[0], py: GHOST_HOME[1], fx: 0, fy: 0, mt: NEVER,
    dir: 3, scared: false, chasing: false, release: Math.max(1, Math.round(releaseTicks(kind) * fast)),
  }));
  s.frightLeft = 0;
}

function placePac(p: Pac, i: number): void {
  const [x, y] = PAC_SPAWNS[i % PAC_SPAWNS.length];
  p.x = p.px = x; p.y = p.py = y;
  p.mt = NEVER;
  p.dir = -1; p.want = -1;
  p.invuln = INVULN_TICKS;
}

export function createPacman(ids: string[], seed: number): PacmanState {
  const { grid, dots } = buildGrid();
  const s: PacmanState = {
    pacs: ids.map((id) => ({ id, x: 0, y: 0, px: 0, py: 0, dir: -1, want: -1, face: 3, lives: PAC_LIVES, score: 0, invuln: 0, fx: 0, fy: 0, mt: NEVER, started: false })),
    ghosts: [], grid, dotsLeft: dots, level: 1, frightLeft: 0, ticks: 0, rng: seed >>> 0,
    pellets: [], ghostsEaten: [], deaths: [], levelCleared: false,
  };
  s.pacs.forEach((p, i) => placePac(p, i));
  placeGhosts(s);
  return s;
}

const wrapX = (x: number) => (x + PAC_COLS) % PAC_COLS;

/** Casa livre para andar (o túnel liga as bordas esquerda e direita). */
export function walkable(s: PacmanState, x: number, y: number): boolean {
  if (y < 0 || y >= PAC_ROWS) return false;
  const c = s.grid[y][wrapX(x)];
  return c !== '#' && c !== 'H';
}

/** Define a direção desejada. Devolve false se o jogador não existe ou foi eliminado. */
export function steer(s: PacmanState, id: string, dir: number): boolean {
  const p = s.pacs.find((x) => x.id === id);
  if (!p || p.lives <= 0 || dir < 0 || dir > 3) return false;
  p.want = dir;
  p.started = true;
  return true;
}

function movePac(s: PacmanState, p: Pac): void {
  if (p.lives <= 0 || p.want < 0) return;
  let d = p.dir;
  const [wx, wy] = DIRS[p.want];
  if (walkable(s, p.x + wx, p.y + wy)) d = p.want;
  if (d < 0) return;
  const [dx, dy] = DIRS[d];
  if (!walkable(s, p.x + dx, p.y + dy)) { p.dir = d; return; } // encostou: fica parado até virar
  p.dir = p.face = d;
  p.fx = p.x; p.fy = p.y; p.mt = s.ticks;
  p.x = wrapX(p.x + dx);
  p.y += dy;
  const c = s.grid[p.y][p.x];
  if (c === '.' || c === 'o') {
    s.grid[p.y][p.x] = ' ';
    s.dotsLeft--;
    if (c === '.') p.score += DOT_POINTS;
    else {
      p.score += PELLET_POINTS;
      s.frightLeft = frightTicks(s.level);
      for (const g of s.ghosts) g.scared = true;
      s.pellets.push(p.id);
    }
  }
}

/** Busca em largura a partir do fantasma: jogador mais próximo (por caminho, até LOSE_TRACK casas) e o 1º passo até ele. */
function scout(s: PacmanState, g: Ghost): { dist: number; dir: number } | null {
  const at = new Map<number, number>(); // casa -> 1º passo usado para chegar
  const key = (x: number, y: number) => y * PAC_COLS + x;
  let frontier: [number, number][] = [[g.x, g.y]];
  at.set(key(g.x, g.y), -1);
  for (let dist = 0; dist <= LOSE_TRACK && frontier.length; dist++) {
    const next: [number, number][] = [];
    for (const [x, y] of frontier) {
      const first = at.get(key(x, y))!;
      if (s.pacs.some((p) => p.lives > 0 && p.started && p.x === x && p.y === y)) return { dist, dir: first };
      for (let d = 0; d < 4; d++) {
        const nx = wrapX(x + DIRS[d][0]);
        const ny = y + DIRS[d][1];
        if (!walkable(s, nx, ny) || at.has(key(nx, ny))) continue;
        at.set(key(nx, ny), first < 0 ? d : first);
        next.push([nx, ny]);
      }
    }
    frontier = next;
  }
  return null;
}

/** Persegue só quem passa perto; se o jogador se afasta, perde o rastro e volta a vagar. */
function moveGhost(s: PacmanState, g: Ghost): void {
  const back = (g.dir + 2) % 4;
  const free = (d: number) => walkable(s, g.x + DIRS[d][0], g.y + DIRS[d][1]);
  let opts = [0, 1, 2, 3].filter((d) => d !== back && free(d));
  if (opts.length === 0) opts = free(back) ? [back] : [];
  if (opts.length === 0) return;
  const seen = g.scared ? null : scout(s, g);
  g.chasing = !!seen && seen.dist > 0 && (seen.dist <= SIGHT || (g.chasing && seen.dist <= LOSE_TRACK));
  let pick: number;
  if (g.chasing && seen) {
    pick = seen.dir;
  } else {
    let r: number;
    [r, s.rng] = nextRandom(s.rng);
    pick = opts.includes(g.dir) && r < 0.5 ? g.dir : opts[Math.floor(((r * 2) % 1) * opts.length)];
  }
  g.dir = pick;
  g.fx = g.x; g.fy = g.y; g.mt = s.ticks;
  g.x = wrapX(g.x + DIRS[pick][0]);
  g.y += DIRS[pick][1];
}

function collide(s: PacmanState): void {
  for (const p of s.pacs) {
    if (p.lives <= 0 || !p.started) continue;
    for (const g of s.ghosts) {
      if (g.release > 0) continue;
      const same = g.x === p.x && g.y === p.y;
      const swapped = g.x === p.px && g.y === p.py && p.x === g.px && p.y === g.py;
      if (!same && !swapped) continue;
      if (g.scared) {
        p.score += GHOST_POINTS;
        s.ghostsEaten.push(p.id);
        g.scared = false;
        g.x = g.px = GHOST_HOME[0];
        g.y = g.py = GHOST_HOME[1];
        g.release = 60;
        g.mt = NEVER;
      } else if (p.invuln <= 0) {
        p.lives--;
        s.deaths.push(p.id);
        placePac(p, s.pacs.indexOf(p));
        if (p.lives <= 0) { p.x = p.px = -1; p.y = p.py = -1; p.invuln = 0; }
        break;
      }
    }
  }
}

export function stepPacman(s: PacmanState): void {
  if (pacmanOver(s)) return;
  s.ticks++;
  for (const p of s.pacs) { p.px = p.x; p.py = p.y; if (p.invuln > 0) p.invuln--; }
  for (const g of s.ghosts) { g.px = g.x; g.py = g.y; }
  if (s.frightLeft > 0 && --s.frightLeft === 0) for (const g of s.ghosts) g.scared = false;

  for (const g of s.ghosts) {
    if (g.release > 0 && s.pacs.some((p) => p.started) && --g.release === 0) { // sai da casa pelo portão
      g.x = g.px = GHOST_EXIT[0];
      g.y = g.py = GHOST_EXIT[1];
      g.dir = s.ticks % 2 === 0 ? 1 : 3;
      g.mt = NEVER;
    }
  }

  if (s.ticks % PAC_INTERVAL === 0) {
    for (const p of s.pacs) movePac(s, p);
    collide(s);
  }
  const gi = ghostInterval(s.level);
  for (const g of s.ghosts) {
    if (g.release > 0 || s.ticks % (g.scared ? gi + 3 : gi) !== 0) continue;
    moveGhost(s, g);
  }
  collide(s);

  if (s.dotsLeft === 0 && !pacmanOver(s)) { // labirinto limpo: o próximo nível é mais rápido
    const { grid, dots } = buildGrid();
    s.grid = grid;
    s.dotsLeft = dots;
    s.level++;
    s.levelCleared = true;
    s.pacs.forEach((p, i) => { if (p.lives > 0) placePac(p, i); });
    placeGhosts(s);
  }
}

/** Posição para desenhar: desliza da casa anterior até a atual durante o intervalo entre passos. */
export function drawPos(s: PacmanState, e: { x: number; y: number; fx: number; fy: number; mt: number }, interval: number): [number, number] {
  if (Math.abs(e.x - e.fx) > 1 || Math.abs(e.y - e.fy) > 1) return [e.x, e.y]; // túnel: sem deslizar
  const t = Math.min(1, (s.ticks - e.mt + 1) / interval);
  return [e.fx + (e.x - e.fx) * t, e.fy + (e.y - e.fy) * t];
}

export function pacmanOver(s: PacmanState): boolean {
  return s.pacs.every((p) => p.lives <= 0);
}
