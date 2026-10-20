import { describe, expect, it } from 'vitest';
import { AsteroidsEngine } from './asteroids-engine.js';
import {
  BULLET_LIFE, HEIGHT, INVULN_TICKS, KILL_POINTS, LIVES, MATCH_TICKS, MAX_BULLETS, ROCK_POINTS, WIDTH,
  createAsteroids, fire, stepAsteroids, thrust, turn,
} from './asteroids.js';

const run = (s: ReturnType<typeof createAsteroids>, n: number) => { for (let i = 0; i < n; i++) stepAsteroids(s); };
const clear = (s: ReturnType<typeof createAsteroids>) => { s.rocks = []; s.ticks = 1; };

describe('asteroids', () => {
  it('a mesma semente gera a mesma arena', () => {
    expect(createAsteroids(['a', 'b'], 5).rocks).toEqual(createAsteroids(['a', 'b'], 5).rocks);
    expect(createAsteroids(['a'], 5).rocks.length).toBeGreaterThan(0);
  });

  it('gira, acelera e a arena dá a volta', () => {
    const s = createAsteroids(['a'], 1);
    clear(s);
    const sh = s.ships[0];
    sh.x = WIDTH - 1; sh.y = 10; sh.angle = 0; sh.vx = sh.vy = 0;
    expect(turn(s, 'a', 1)).toBe(true);
    const a0 = sh.angle;
    run(s, 3);
    expect(sh.angle).toBeGreaterThan(a0);
    sh.angle = 0; sh.rotUntil = 0;
    for (let i = 0; i < 30; i++) { thrust(s, 'a'); stepAsteroids(s); }
    expect(sh.vx).toBeGreaterThan(5);
    expect(sh.x).toBeGreaterThanOrEqual(0);
    expect(sh.x).toBeLessThan(WIDTH);
    expect(sh.x).toBeLessThan(WIDTH / 2); // atravessou a borda direita
    expect(thrust(s, 'zz')).toBe(false);
  });

  it('atira no máximo MAX_BULLETS, o tiro some e não acerta o dono', () => {
    const s = createAsteroids(['a'], 1);
    clear(s);
    const sh = s.ships[0];
    sh.invuln = 0;
    let shots = 0;
    for (let i = 0; i < 60; i++) { if (fire(s, 'a')) shots++; stepAsteroids(s); }
    expect(shots).toBeGreaterThanOrEqual(MAX_BULLETS);
    expect(sh.lives).toBe(LIVES);
    run(s, BULLET_LIFE + 5);
    expect(s.bullets.length).toBe(0);
  });

  it('tiro quebra asteroide grande em dois médios e pontua', () => {
    const s = createAsteroids(['a'], 1);
    clear(s);
    const sh = s.ships[0];
    sh.x = 20; sh.y = 20; sh.angle = 0;
    s.rocks = [{ x: 40, y: 20, vx: 0, vy: 0, size: 3 }];
    fire(s, 'a');
    run(s, 15);
    expect(s.rocks.filter((r) => r.size === 2).length).toBe(2);
    expect(sh.score).toBe(ROCK_POINTS[3]);
  });

  it('tiro elimina rival (pontua), tira uma vida e o rival volta invulnerável', () => {
    const s = createAsteroids(['a', 'b'], 1);
    clear(s);
    const [a, b] = s.ships;
    a.x = 20; a.y = 20; a.angle = 0; a.invuln = 0;
    b.x = 50; b.y = 20; b.invuln = 0;
    fire(s, 'a');
    run(s, 15);
    expect(b.lives).toBe(LIVES - 1);
    expect(b.invuln).toBeGreaterThan(INVULN_TICKS - 30);
    expect(a.score).toBe(KILL_POINTS);
    expect(s.deaths).toContain('b');
  });

  it('invulnerável não leva tiro; asteroide tira vida; sem vidas elimina', () => {
    const s = createAsteroids(['a', 'b'], 1);
    clear(s);
    const [a, b] = s.ships;
    a.x = 20; a.y = 20; a.angle = 0; a.invuln = 0;
    b.x = 50; b.y = 20; b.invuln = 60;
    fire(s, 'a');
    run(s, 15);
    expect(b.lives).toBe(LIVES);

    b.invuln = 0; b.lives = 1;
    s.rocks = [{ x: b.x, y: b.y, vx: 0, vy: 0, size: 3 }];
    run(s, 1);
    expect(b.alive).toBe(false);
    expect(s.over).toBe(false);
    a.alive = false;
    run(s, 1);
    expect(s.over).toBe(true);
  });

  it('o tempo limite encerra a partida', () => {
    const s = createAsteroids(['a'], 1);
    s.ships[0].invuln = MATCH_TICKS * 2;
    run(s, MATCH_TICKS);
    expect(s.over).toBe(true);
  });

  it('motor: entrada, quadro, pontos e eventos', () => {
    const e = new AsteroidsEngine();
    e.start(['a', 'b'], 3);
    expect(e.input('a', 'left')).toBe(true);
    expect(e.input('a', 'up')).toBe(true);
    expect(e.input('a', 'a')).toBe(true);
    expect(e.input('a', 'down')).toBe(false);
    expect(e.input('zz', 'a')).toBe(false);
    e.step();
    const f = e.frame();
    expect(f.game === 'asteroids' && f.ships.length === 2 && f.w === WIDTH && f.h === HEIGHT && f.bullets.length === 1).toBe(true);
    expect(e.drainEvents()).toEqual([{ playerId: 'a', kind: 'drop', value: 1 }]);
    expect(e.score('a')).toBe(0);
    expect(e.isOver()).toBe(false);
    expect(e.playerOver('a')).toBe(false);
  });
});
