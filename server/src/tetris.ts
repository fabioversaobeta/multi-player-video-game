// Motor do Tetris: funções puras. Cada transição devolve um NOVO estado (imutável por tick).
import { TICKS_PER_SECOND } from './engine.js';
import { nextRandom } from './rng.js';

export const COLS = 10;
export const ROWS = 20;

export const PIECE_TYPES = [1, 2, 3, 4, 5, 6, 7] as const; // I O T S Z J L
export type PieceType = (typeof PIECE_TYPES)[number];

const SHAPES: Record<PieceType, number[][]> = {
  1: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
  2: [[1, 1], [1, 1]], // O
  3: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], // T
  4: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], // S
  5: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], // Z
  6: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], // J
  7: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], // L
};

export interface Piece {
  type: PieceType;
  matrix: number[][];
  x: number;
  y: number;
}

export interface TetrisState {
  board: number[][]; // peças já travadas
  piece: Piece | null;
  next: PieceType;
  bag: PieceType[];
  rng: number;
  score: number;
  lines: number;
  level: number;
  ticks: number;
  gravity: number; // contador de ticks até a próxima queda
  over: boolean;
}

export type TetrisAction = 'left' | 'right' | 'down' | 'a' | 'b';

function drawFromBag(bag: PieceType[], rng: number): [PieceType, PieceType[], number] {
  let b = bag;
  let seed = rng;
  if (b.length === 0) {
    const fresh = [...PIECE_TYPES];
    for (let i = fresh.length - 1; i > 0; i--) {
      const [r, s] = nextRandom(seed);
      seed = s;
      const j = Math.floor(r * (i + 1));
      [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
    }
    b = fresh;
  }
  return [b[0], b.slice(1), seed];
}

function emptyBoard(): number[][] {
  return Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0));
}

function spawn(type: PieceType): Piece {
  const matrix = SHAPES[type].map((r) => [...r]);
  return { type, matrix, x: Math.floor((COLS - matrix[0].length) / 2), y: type === 1 ? -1 : 0 };
}

function collides(board: number[][], piece: Piece): boolean {
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (!piece.matrix[r][c]) continue;
      const x = piece.x + c;
      const y = piece.y + r;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && board[y][x]) return true;
    }
  }
  return false;
}

export function createTetris(seed: number): TetrisState {
  let rng = seed >>> 0;
  let bag: PieceType[] = [];
  let first: PieceType;
  let next: PieceType;
  [first, bag, rng] = drawFromBag(bag, rng);
  [next, bag, rng] = drawFromBag(bag, rng);
  return {
    board: emptyBoard(),
    piece: spawn(first),
    next,
    bag,
    rng,
    score: 0,
    lines: 0,
    level: 1,
    ticks: 0,
    gravity: 0,
    over: false,
  };
}

/** Quantos ticks a peça leva para cair uma linha. Acelera com linhas e com o tempo. */
export function dropInterval(level: number): number {
  return Math.max(2, Math.floor(24 * Math.pow(0.9, level - 1)));
}

const LINE_POINTS = [0, 100, 300, 500, 800];
const PIECE_POINTS = 10;
const SECONDS_PER_LEVEL = 90;
const MAX_LEVEL = 15;

function computeLevel(lines: number, ticks: number): number {
  const byLines = Math.floor(lines / 15);
  const byTime = Math.floor(ticks / (TICKS_PER_SECOND * SECONDS_PER_LEVEL));
  return Math.min(MAX_LEVEL, 1 + byLines + byTime);
}

function lockPiece(s: TetrisState): TetrisState {
  const piece = s.piece!;
  const board = s.board.map((row) => [...row]);
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (!piece.matrix[r][c]) continue;
      const y = piece.y + r;
      if (y < 0) return { ...s, board, piece: null, over: true }; // travou acima do topo
      board[y][piece.x + c] = piece.type;
    }
  }
  const kept = board.filter((row) => row.some((v) => v === 0));
  const cleared = ROWS - kept.length;
  const newBoard = [
    ...Array.from({ length: cleared }, () => new Array<number>(COLS).fill(0)),
    ...kept,
  ];
  const lines = s.lines + cleared;
  const score = s.score + PIECE_POINTS + LINE_POINTS[cleared];

  const [type, bag, rng] = drawFromBag(s.bag, s.rng);
  const nextPiece = spawn(s.next);
  const over = collides(newBoard, nextPiece);
  return {
    ...s,
    board: newBoard,
    piece: over ? null : nextPiece,
    next: type,
    bag,
    rng,
    lines,
    score,
    level: computeLevel(lines, s.ticks),
    gravity: 0,
    over,
  };
}

function rotateMatrix(m: number[][], clockwise: boolean): number[][] {
  const n = m.length;
  const out = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (clockwise) out[c][n - 1 - r] = m[r][c];
      else out[n - 1 - c][r] = m[r][c];
    }
  }
  return out;
}

const KICKS = [0, -1, 1, -2, 2];

/** Aplica um comando do jogador. Comandos inválidos devolvem o MESMO estado (rejeição silenciosa). */
export function applyAction(s: TetrisState, action: TetrisAction): TetrisState {
  if (s.over || !s.piece) return s;
  const p = s.piece;
  switch (action) {
    case 'left':
    case 'right': {
      const moved = { ...p, x: p.x + (action === 'left' ? -1 : 1) };
      return collides(s.board, moved) ? s : { ...s, piece: moved };
    }
    case 'down': {
      const moved = { ...p, y: p.y + 1 };
      if (collides(s.board, moved)) return lockPiece(s);
      return { ...s, piece: moved, score: s.score + 1, gravity: 0 };
    }
    case 'a':
    case 'b': {
      if (p.type === 2) return s; // O não precisa girar
      const matrix = rotateMatrix(p.matrix, action === 'a');
      for (const k of KICKS) {
        const rotated = { ...p, matrix, x: p.x + k };
        if (!collides(s.board, rotated)) return { ...s, piece: rotated };
      }
      return s;
    }
  }
}

/** Avança um tick de jogo (gravidade e progressão de nível por tempo). */
export function tick(s: TetrisState): TetrisState {
  if (s.over || !s.piece) return s;
  const ticks = s.ticks + 1;
  const level = computeLevel(s.lines, ticks);
  const gravity = s.gravity + 1;
  const base = { ...s, ticks, level };
  if (gravity < dropInterval(level)) return { ...base, gravity };
  const moved = { ...s.piece, y: s.piece.y + 1 };
  if (collides(s.board, moved)) return lockPiece({ ...base, gravity: 0 });
  return { ...base, piece: moved, gravity: 0 };
}

/** Tabuleiro achatado (10x20) com a peça ativa incluída, para envio ao cliente. */
export function flatten(s: TetrisState): number[] {
  const grid = s.board.map((row) => [...row]);
  if (s.piece && !s.over) {
    const p = s.piece;
    for (let r = 0; r < p.matrix.length; r++) {
      for (let c = 0; c < p.matrix[r].length; c++) {
        const y = p.y + r;
        const x = p.x + c;
        if (p.matrix[r][c] && y >= 0 && y < ROWS && x >= 0 && x < COLS) grid[y][x] = p.type;
      }
    }
  }
  return grid.flat();
}
