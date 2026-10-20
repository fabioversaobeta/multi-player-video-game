import { describe, expect, it } from 'vitest';
import { BombermanEngine } from './bomberman-engine.js';
import {
  BLAST_RANGE, BLOCK_POINTS, BOMB_COLS, BOMB_ROWS, BOMB_SPAWNS, FUSE_TICKS, KILL_POINTS, MATCH_TICKS, MOVE_COOLDOWN, WIN_POINTS,
  createBomberman, move, plantBomb, stepBomberman,
} from './bomberman.js';

const clear = (s: ReturnType<typeof createBomberman>) => {
  for (const row of s.grid) row.forEach((c, i) => { if (c === 'B') row[i] = ' '; });
  s.blocks = 0;
};
const run = (s: ReturnType<typeof createBomberman>, n: number) => { for (let i = 0; i < n; i++) stepBomberman(s); };

describe('bomberman', () => {
  it('arena tem bordas, pilares e cantos de partida livres', () => {
    const s = createBomberman(['a', 'b'], 7);
    expect(s.grid).toHaveLength(BOMB_ROWS);
    expect(s.grid.every((r) => r.length === BOMB_COLS)).toBe(true);
    expect(s.grid[0].every((c) => c === '#')).toBe(true);
    expect(s.grid[2][2]).toBe('#');
    expect(s.blocks).toBeGreaterThan(0);
    for (const [x, y] of BOMB_SPAWNS) {
      expect(s.grid[y][x]).toBe(' ');
      expect(s.grid[y][x + (x === 1 ? 1 : -1)]).toBe(' ');
      expect(s.grid[y + (y === 1 ? 1 : -1)][x]).toBe(' ');
    }
  });

  it('anda uma casa, respeita a recarga e não atravessa parede', () => {
    const s = createBomberman(['a'], 1);
    const p = s.players[0];
    expect(move(s, 'a', 0)).toBe(false); // borda
    expect(move(s, 'a', 1)).toBe(true);
    expect(p.x).toBe(2);
    expect(move(s, 'a', 1)).toBe(false); // recarga
    run(s, MOVE_COOLDOWN);
    expect(move(s, 'a', 2)).toBe(false); // pilar em (2,2)
    expect(move(s, 'a', 1)).toBe(true);
  });

  it('bloco e bomba bloqueiam o caminho', () => {
    const s = createBomberman(['a', 'b'], 1);
    clear(s);
    s.grid[1][3] = 'B';
    s.players[0].x = 2; s.players[0].y = 1;
    expect(move(s, 'a', 1)).toBe(false);
    s.players[1].x = 2; s.players[1].y = 3;
    s.bombs.push({ x: 2, y: 2, owner: 'b', fuse: 50 });
    expect(move(s, 'a', 2)).toBe(false);
  });

  it('só uma bomba por vez; explode no tempo e destrói bloco com pontos', () => {
    const s = createBomberman(['a', 'b'], 1);
    clear(s);
    s.grid[1][3] = 'B'; s.blocks = 1;
    s.players[0].x = 2; s.players[0].y = 1;
    expect(plantBomb(s, 'a')).toBe(true);
    expect(plantBomb(s, 'a')).toBe(false);
    run(s, FUSE_TICKS - 1);
    expect(s.bombs).toHaveLength(1);
    s.players[0].x = 1; s.players[0].y = 3; // fora da linha de fogo
    run(s, 1);
    expect(s.bombs).toHaveLength(0);
    expect(s.grid[1][3]).toBe(' ');
    expect(s.players[0].score).toBe(BLOCK_POINTS);
  });

  it('a chama para no pilar e tem alcance limitado', () => {
    const s = createBomberman(['a', 'b'], 1);
    clear(s);
    s.players[0].x = 1; s.players[0].y = 3;
    s.players[1].x = 13; s.players[1].y = 11;
    s.bombs.push({ x: 1, y: 1, owner: 'a', fuse: 1 });
    run(s, 1);
    const at = (x: number, y: number) => s.flames.some((f) => f.x === x && f.y === y);
    expect(at(1, 1) && at(1, 2) && at(1, 3)).toBe(true);
    expect(at(1, 1 + BLAST_RANGE + 1)).toBe(false);
    expect(at(2, 2)).toBe(false);
    expect(s.players[0].alive).toBe(false); // morreu na própria bomba
    expect(s.players[0].score).toBe(0);
  });

  it('bombas atingidas explodem em cadeia', () => {
    const s = createBomberman(['a', 'b'], 1);
    clear(s);
    s.players[0].x = 13; s.players[0].y = 11;
    s.players[1].x = 13; s.players[1].y = 1;
    s.bombs.push({ x: 1, y: 1, owner: 'a', fuse: 1 }, { x: 2, y: 1, owner: 'b', fuse: 80 });
    run(s, 1);
    expect(s.bombs).toHaveLength(0);
  });

  it('matar outro jogador dá pontos e o último de pé ganha o bônus', () => {
    const s = createBomberman(['a', 'b'], 1);
    clear(s);
    s.players[0].x = 13; s.players[0].y = 11;
    s.players[1].x = 1; s.players[1].y = 3;
    s.bombs.push({ x: 1, y: 1, owner: 'a', fuse: 1 });
    run(s, 1);
    expect(s.players[1].alive).toBe(false);
    expect(s.over).toBe(true);
    expect(s.winner).toBe('a');
    expect(s.players[0].score).toBe(KILL_POINTS + WIN_POINTS);
    expect(move(s, 'a', 3)).toBe(false); // partida acabou
  });

  it('solo termina ao morrer, e multi termina pelo tempo sem vencedor', () => {
    const solo = createBomberman(['a'], 1);
    clear(solo);
    solo.blocks = 5;
    solo.bombs.push({ x: solo.players[0].x, y: solo.players[0].y, owner: 'a', fuse: 1 });
    run(solo, 1);
    expect(solo.over).toBe(true);

    const m = createBomberman(['a', 'b'], 1);
    run(m, MATCH_TICKS);
    expect(m.over).toBe(true);
    expect(m.winner).toBeNull();
  });

  it('motor: entrada, quadro e eventos', () => {
    const e = new BombermanEngine();
    e.start(['a', 'b'], 3);
    expect(e.input('a', 'a')).toBe(true);
    expect(e.input('a', 'pause')).toBe(false);
    expect(e.input('zz', 'right')).toBe(false);
    e.step();
    expect(e.drainEvents()).toEqual([{ playerId: 'a', kind: 'drop', value: 1 }]);
    const f = e.frame();
    expect(f.game === 'bomberman' && f.bombs.length === 1 && f.players.length === 2).toBe(true);
    expect(e.isOver()).toBe(false);
    expect(e.playerOver('a')).toBe(false);
  });
});
