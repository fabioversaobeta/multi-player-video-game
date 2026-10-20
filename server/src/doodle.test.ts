import { describe, expect, it } from 'vitest';
import { DoodleEngine } from './doodle-engine.js';
import {
  GRAVITY, HOLD_TICKS, JUMP, MATCH_TICKS, MOVE_SPEED, PLATFORM_W, WIDTH, createDoodle, move, stepDoodle,
} from './doodle.js';

const run = (s: ReturnType<typeof createDoodle>, n: number) => { for (let i = 0; i < n; i++) stepDoodle(s); };
const maxJump = (JUMP * JUMP) / (2 * GRAVITY);

describe('doodle', () => {
  it('torre ordenada, alcançável e igual para a mesma semente', () => {
    const s = createDoodle(['a', 'b'], 7);
    const ys = s.platforms.map((p) => p.y);
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
    const mains = s.platforms.filter((p) => p.kind !== 'fragile');
    for (let i = 1; i < mains.length; i++) expect(mains[i].y - mains[i - 1].y).toBeLessThan(maxJump);
    expect(s.platforms.every((p) => p.x >= 0 && p.x <= WIDTH)).toBe(true);
    expect(createDoodle(['a'], 7).platforms).toEqual(createDoodle(['a'], 7).platforms);
  });

  it('pula sozinho ao pisar numa plataforma e sobe', () => {
    const s = createDoodle(['a'], 1);
    s.platforms = [{ kind: 'normal', x: WIDTH / 2, y: 4, phase: 0 }];
    const j = s.jumpers[0];
    run(s, 120);
    expect(j.alive).toBe(true);
    expect(j.best).toBeGreaterThan(4 + maxJump - 2);
    expect(j.y).toBeGreaterThanOrEqual(4);
  });

  it('move para o lado por um instante e a tela dá a volta', () => {
    const s = createDoodle(['a'], 1);
    const j = s.jumpers[0];
    j.x = 1;
    expect(move(s, 'a', -1)).toBe(true);
    run(s, HOLD_TICKS);
    expect(j.x).toBeGreaterThan(WIDTH - 15);
    const x = j.x;
    run(s, 3);
    expect(j.x).toBe(x); // o toque acabou
    expect((MOVE_SPEED * HOLD_TICKS) / 30).toBeLessThan(PLATFORM_W);
    expect(move(s, 'zz', 1)).toBe(false);
  });

  it('plataforma frágil quebra (por jogador) e não quica de novo', () => {
    const s = createDoodle(['a', 'b'], 1);
    s.platforms = [{ kind: 'fragile', x: 30, y: 4, phase: 0 }];
    for (const j of s.jumpers) { j.x = 30; j.y = 4.2; j.vy = -10; }
    run(s, 2);
    expect(s.jumpers[0].vy).toBeGreaterThan(0);
    expect(s.jumpers[0].broken.has(0)).toBe(true);
    s.jumpers[0].y = 4.3; s.jumpers[0].vy = -10;
    run(s, 1);
    expect(s.jumpers[0].vy).toBeLessThan(0); // atravessou
  });

  it('cair da tela elimina o jogador; todos eliminados encerram a partida', () => {
    const s = createDoodle(['a', 'b'], 1);
    s.platforms = [];
    run(s, 200);
    expect(s.jumpers.every((j) => !j.alive)).toBe(true);
    expect([...s.falls].sort()).toEqual(['a', 'b']);
    expect(s.over).toBe(true);
  });

  it('o tempo limite encerra a partida', () => {
    const s = createDoodle(['a', 'b'], 1);
    run(s, MATCH_TICKS);
    expect(s.over).toBe(true);
  });

  it('motor: entrada, quadro, pontos e eventos', () => {
    const e = new DoodleEngine();
    e.start(['a', 'b'], 3);
    expect(e.input('a', 'right')).toBe(true);
    expect(e.input('a', 'b')).toBe(false);
    expect(e.input('zz', 'left')).toBe(false);
    for (let i = 0; i < 20; i++) e.step();
    const f = e.frame();
    expect(f.game === 'doodle' && f.jumpers.length === 2 && f.jumpers[0].platforms.length > 0).toBe(true);
    expect(e.score('a')).toBeGreaterThan(0);
    expect(e.isOver()).toBe(false);
    expect(e.playerOver('a')).toBe(false);
    expect(e.drainEvents()).toEqual([]);
  });
});
