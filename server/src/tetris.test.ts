import { describe, expect, it } from 'vitest';
import {
  COLS, ROWS, applyAction, createTetris, dropInterval, flatten, tick, type TetrisState,
} from './tetris.js';

const fresh = () => createTetris(42);

describe('tetris', () => {
  it('cria tabuleiro 10x20 vazio com uma peça ativa', () => {
    const s = fresh();
    expect(s.board).toHaveLength(ROWS);
    expect(s.board[0]).toHaveLength(COLS);
    expect(s.board.flat().every((v) => v === 0)).toBe(true);
    expect(s.piece).not.toBeNull();
    expect(flatten(s)).toHaveLength(COLS * ROWS);
  });

  it('é determinístico para a mesma semente', () => {
    expect(createTetris(7).piece!.type).toBe(createTetris(7).piece!.type);
  });

  it('move para os lados e rejeita silenciosamente contra a parede', () => {
    let s = fresh();
    for (let i = 0; i < 20; i++) s = applyAction(s, 'left');
    const x = s.piece!.x;
    const again = applyAction(s, 'left');
    expect(again).toBe(s); // mesmo objeto = rejeitado, sem mudança
    expect(again.piece!.x).toBe(x);
  });

  it('não muta o estado anterior', () => {
    const s = fresh();
    const x = s.piece!.x;
    applyAction(s, 'right');
    expect(s.piece!.x).toBe(x);
  });

  it('queda por gravidade ocorre após o intervalo', () => {
    let s = fresh();
    const y = s.piece!.y;
    for (let i = 0; i < dropInterval(1); i++) s = tick(s);
    expect(s.piece!.y).toBe(y + 1);
  });

  it('descer rápido soma 1 ponto por célula', () => {
    const s = applyAction(fresh(), 'down');
    expect(s.score).toBe(1);
  });

  it('trava a peça no fundo, pontua e gera a próxima', () => {
    let s = fresh();
    const next = s.next;
    for (let i = 0; i < ROWS + 2; i++) s = applyAction(s, 'down');
    expect(s.board.flat().some((v) => v !== 0)).toBe(true);
    expect(s.piece!.type).toBe(next);
    expect(s.score).toBeGreaterThanOrEqual(10);
  });

  it('limpa linhas completas e pontua', () => {
    const s = fresh();
    const board = s.board.map((r) => [...r]);
    // última linha cheia, exceto colunas 4..7 onde cairá uma peça I horizontal
    board[ROWS - 1] = board[ROWS - 1].map((_, c) => (c >= 3 && c <= 6 ? 0 : 1));
    const base: TetrisState = {
      ...s,
      board,
      piece: { type: 1, matrix: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], x: 3, y: ROWS - 3 },
    };
    let cur = base;
    for (let i = 0; i < 5; i++) cur = applyAction(cur, 'down');
    expect(cur.lines).toBe(1);
    expect(cur.score).toBeGreaterThanOrEqual(100);
    expect(cur.board[ROWS - 1].every((v) => v === 0)).toBe(true);
  });

  it('fim de jogo quando o tabuleiro enche', () => {
    let s = fresh();
    for (let i = 0; i < 400 && !s.over; i++) s = applyAction(s, 'down');
    expect(s.over).toBe(true);
    expect(applyAction(s, 'left')).toBe(s);
    expect(tick(s)).toBe(s);
  });

  it('acelera com o passar do tempo mesmo sem linhas', () => {
    let s = fresh();
    s = { ...s, board: s.board, piece: { ...s.piece!, y: 0 } };
    for (let i = 0; i < 30 * 31; i++) {
      s = tick(s);
      if (s.over) break;
    }
    expect(dropInterval(2)).toBeLessThan(dropInterval(1));
  });

  it('rotaciona sem sair do tabuleiro (com ajuste junto à parede)', () => {
    let s = fresh();
    for (let i = 0; i < 20; i++) s = applyAction(s, 'right');
    const r = applyAction(s, 'a');
    expect(flatten(r).filter((v) => v !== 0)).toHaveLength(4);
  });
});
