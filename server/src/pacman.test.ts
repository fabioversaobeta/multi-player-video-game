import { describe, expect, it } from 'vitest';
import { PacmanEngine } from './pacman-engine.js';
import {
  GHOST_POINTS, LOSE_TRACK, SIGHT, ghostCount, ghostInterval, PAC_COLS, PAC_INTERVAL, PAC_LIVES, PAC_ROWS, PAC_SPAWNS, PELLET_POINTS, createPacman, pacmanOver, steer, stepPacman, walkable,
} from './pacman.js';

const quiet = (s: ReturnType<typeof createPacman>) => { for (const g of s.ghosts) g.release = 99999; };

describe('pacman', () => {
  it('labirinto é retangular, e pontos e pontos de partida são alcançáveis', () => {
    const s = createPacman(['a'], 1);
    expect(s.grid.every((r) => r.length === PAC_COLS)).toBe(true);
    expect(s.grid).toHaveLength(PAC_ROWS);
    const [sx, sy] = PAC_SPAWNS[0];
    const seen = new Set<string>([`${sx},${sy}`]);
    const todo: [number, number][] = [[sx, sy]];
    while (todo.length) {
      const [x, y] = todo.pop()!;
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const nx = (x + dx + PAC_COLS) % PAC_COLS;
        const ny = y + dy;
        if (walkable(s, nx, ny) && !seen.has(`${nx},${ny}`)) { seen.add(`${nx},${ny}`); todo.push([nx, ny]); }
      }
    }
    s.grid.forEach((row, y) => row.forEach((c, x) => {
      if (c === '.' || c === 'o') expect(seen.has(`${x},${y}`), `ponto inalcançável ${x},${y}`).toBe(true);
    }));
    for (const [x, y] of PAC_SPAWNS) expect(seen.has(`${x},${y}`)).toBe(true);
  });

  it('anda até bater, come ponto e pontua', () => {
    const s = createPacman(['a'], 1);
    quiet(s);
    const p = s.pacs[0];
    const dots = s.dotsLeft;
    expect(steer(s, 'a', 3)).toBe(true);
    for (let i = 0; i < 60; i++) stepPacman(s);
    expect(p.x).toBeLessThan(PAC_SPAWNS[0][0]);
    expect(p.score).toBeGreaterThan(0);
    expect(s.dotsLeft).toBeLessThan(dots);
    expect(steer(s, 'ninguem', 3)).toBe(false);
  });

  it('parede bloqueia e o túnel liga as bordas', () => {
    const s = createPacman(['a'], 1);
    expect(walkable(s, 0, 0)).toBe(false);
    expect(walkable(s, -1, 9)).toBe(true);
    expect(walkable(s, 9, 9)).toBe(false); // casa dos fantasmas
    quiet(s);
    const p = s.pacs[0];
    p.x = p.px = 0; p.y = p.py = 9; p.dir = p.want = 3;
    for (let i = 0; i < PAC_INTERVAL; i++) stepPacman(s);
    expect(p.x).toBe(PAC_COLS - 1);
  });

  it('pílula assusta os fantasmas e comer um dá pontos', () => {
    const s = createPacman(['a'], 1);
    const p = s.pacs[0];
    p.x = p.px = 2; p.y = p.py = 2; // ao lado da pílula em (1,2)
    p.invuln = 0;
    steer(s, 'a', 3);
    for (let i = 0; i < PAC_INTERVAL; i++) stepPacman(s);
    expect(s.pellets).toEqual(['a']);
    expect(p.score).toBe(PELLET_POINTS);
    expect(s.frightLeft).toBeGreaterThan(0);
    expect(s.ghosts.every((g) => g.scared)).toBe(true);
    p.want = -1; // fica parado em cima do fantasma assustado
    const g = s.ghosts[0];
    g.release = 0; g.x = g.px = p.x; g.y = g.py = p.y;
    const before = p.score;
    stepPacman(s);
    expect(p.score).toBe(before + GHOST_POINTS);
    expect(s.ghostsEaten).toEqual(['a']);
    expect(g.scared).toBe(false);
    expect(g.release).toBeGreaterThan(0);
  });

  it('fantasma tira uma vida, reposiciona o jogador e o torna invulnerável; sem vidas ele sai', () => {
    const s = createPacman(['a'], 1);
    const p = s.pacs[0];
    p.invuln = 0;
    p.started = true;
    const g = s.ghosts[0];
    g.release = 0; g.x = g.px = p.x; g.y = g.py = p.y;
    for (let i = 0; i < PAC_INTERVAL; i++) stepPacman(s);
    expect(p.lives).toBe(PAC_LIVES - 1);
    expect(s.deaths).toEqual(['a']);
    expect(p.invuln).toBeGreaterThan(0);
    p.lives = 0;
    expect(pacmanOver(s)).toBe(true);
    expect(steer(s, 'a', 1)).toBe(false);
  });

  it('antes do primeiro movimento o jogador é invisível aos fantasmas e eles ficam na casa', () => {
    const s = createPacman(['a'], 1);
    const p = s.pacs[0];
    p.invuln = 0;
    const g = s.ghosts[0];
    g.release = 0; g.x = g.px = p.x; g.y = g.py = p.y;
    for (let i = 0; i < 300; i++) stepPacman(s);
    expect(p.lives).toBe(PAC_LIVES);
    expect(s.ghosts.slice(1).every((x) => x.release > 0)).toBe(true); // ninguém sai antes de alguém se mexer
    steer(s, 'a', 3);
    expect(p.started).toBe(true);
  });

  it('um fantasma no nível 1, mais um a cada nível, sempre mais lentos que o jogador', () => {
    expect([1, 2, 3, 4].map(ghostCount)).toEqual([1, 2, 3, 4]);
    expect(createPacman(['a'], 1).ghosts).toHaveLength(1);
    for (let l = 1; l < 20; l++) expect(ghostInterval(l)).toBeGreaterThan(PAC_INTERVAL);
  });

  it('fantasma persegue só quem está perto e perde o rastro quando o jogador foge', () => {
    const s = createPacman(['a'], 1);
    const p = s.pacs[0];
    p.started = true; p.want = -1; p.invuln = 99999;
    const g = s.ghosts[0];
    g.release = 0;
    // corredor da linha 3: jogador a 5 casas do fantasma -> persegue e se aproxima
    g.x = g.px = g.fx = 3; g.y = g.py = g.fy = 3; g.dir = 1;
    p.x = p.px = 8; p.y = p.py = 3;
    const gi = ghostInterval(1);
    for (let i = 0; i < gi * 3; i++) stepPacman(s);
    expect(g.chasing).toBe(true);
    expect(g.x).toBe(6);
    // jogador longe (além de LOSE_TRACK casas de caminho): o fantasma não persegue
    g.x = g.px = g.fx = 1; g.y = g.py = g.fy = 3; g.chasing = true;
    p.x = p.px = 17; p.y = p.py = 19;
    for (let i = 0; i < gi; i++) stepPacman(s);
    expect(g.chasing).toBe(false);
    expect(SIGHT).toBeLessThan(LOSE_TRACK);
  });

  it('limpar todos os pontos inicia o próximo nível', () => {
    const s = createPacman(['a'], 1);
    quiet(s);
    s.grid = s.grid.map((r) => r.map((c) => (c === '.' || c === 'o' ? ' ' : c)));
    s.dotsLeft = 1;
    s.grid[15][8] = '.';
    const p = s.pacs[0];
    p.x = p.px = 9; p.y = p.py = 15;
    steer(s, 'a', 3);
    for (let i = 0; i < 8 && s.level === 1; i++) stepPacman(s);
    expect(s.level).toBe(2);
    expect(s.levelCleared).toBe(true);
    expect(s.dotsLeft).toBeGreaterThan(100);
  });

  it('adaptador: setas movem, A/pausa são ignorados, quadro e fim de jogo', () => {
    const e = new PacmanEngine();
    e.start(['a', 'b'], 1);
    expect(e.input('a', 'up')).toBe(true);
    expect(e.input('a', 'a')).toBe(false);
    expect(e.input('a', 'pause')).toBe(false);
    e.step();
    const f = e.frame();
    expect(f.game === 'pacman' && f.pacs.length === 2 && f.ghosts.length === ghostCount(1) && f.grid.length === PAC_ROWS).toBe(true);
    expect(e.isOver()).toBe(false);
    expect(e.playerOver('a')).toBe(false);
  });
});
