import { describe, expect, it } from 'vitest';
import { TopGearEngine } from './topgear-engine.js';
import {
  CRASH_FACTOR, GRACE_TICKS, MATCH_TICKS, MAX_SPEED, NITRO_CHARGES, NITRO_SPEED, OFFROAD_SPEED, PLACE_BONUS, SEG_LEN, STEER_COOLDOWN,
  STEER_STEP, TRACK_LEN, createTopGear, racerScore, steer, stepTopGear, useNitro,
} from './topgear.js';

const run = (s: ReturnType<typeof createTopGear>, n: number) => { for (let i = 0; i < n; i++) stepTopGear(s); };
const flat = (s: ReturnType<typeof createTopGear>) => { s.curves.fill(0); s.obstacles.length = 0; };

describe('topgear', () => {
  it('pista tem curvas válidas, largada reta e carros parados dentro da pista', () => {
    const s = createTopGear(['a', 'b'], 5);
    expect(s.curves.length).toBeGreaterThanOrEqual(TRACK_LEN / SEG_LEN);
    expect(s.curves.slice(0, 3).every((c) => c === 0)).toBe(true);
    expect(s.curves.every((c) => c >= -1 && c <= 1)).toBe(true);
    expect(s.obstacles.length).toBeGreaterThan(0);
    expect(s.obstacles.every((o) => Math.abs(o.x) <= 0.8 && o.z > 0 && o.z < TRACK_LEN)).toBe(true);
    expect(s.racers[0].x).toBeLessThan(s.racers[1].x);
  });

  it('acelera até a velocidade máxima', () => {
    const s = createTopGear(['a'], 1);
    flat(s);
    run(s, 90);
    expect(s.racers[0].speed).toBe(MAX_SPEED);
    expect(s.racers[0].z).toBeGreaterThan(0);
  });

  it('muda de lado com recarga e respeita o limite', () => {
    const s = createTopGear(['a'], 1);
    expect(steer(s, 'a', 1)).toBe(true);
    expect(s.racers[0].x).toBeCloseTo(STEER_STEP);
    expect(steer(s, 'a', 1)).toBe(false);
    run(s, STEER_COOLDOWN);
    expect(steer(s, 'a', 1)).toBe(true);
    for (let i = 0; i < 40; i++) { run(s, STEER_COOLDOWN); steer(s, 'a', 1); }
    expect(s.racers[0].x).toBeLessThanOrEqual(1.3);
    expect(steer(s, 'zz', 1)).toBe(false);
  });

  it('a curva empurra o carro para fora e o acostamento limita a velocidade', () => {
    const s = createTopGear(['a'], 1);
    flat(s);
    s.curves.fill(1);
    run(s, 60);
    expect(s.racers[0].x).toBeLessThan(0);
    run(s, 120);
    expect(s.racers[0].x).toBeLessThan(-1);
    expect(s.racers[0].speed).toBe(OFFROAD_SPEED);
  });

  it('turbo: 3 cargas, aumenta a velocidade e acaba', () => {
    const s = createTopGear(['a'], 1);
    flat(s);
    run(s, 90);
    expect(useNitro(s, 'a')).toBe(true);
    expect(useNitro(s, 'a')).toBe(false); // já ligado
    run(s, 45);
    expect(s.racers[0].speed).toBe(NITRO_SPEED);
    run(s, 60);
    expect(s.racers[0].speed).toBeLessThan(NITRO_SPEED);
    expect(s.racers[0].charges).toBe(NITRO_CHARGES - 1);
    s.racers[0].charges = 0;
    expect(useNitro(s, 'a')).toBe(false);
  });

  it('bater num carro reduz a velocidade uma vez e dá invulnerabilidade', () => {
    const s = createTopGear(['a'], 1);
    flat(s);
    run(s, 90);
    const r = s.racers[0];
    s.obstacles.push({ x: r.x, z: r.z + 1 });
    run(s, 1);
    expect(r.speed).toBeLessThan(MAX_SPEED * CRASH_FACTOR + 1);
    expect(s.crashes).toEqual(['a']);
    expect(r.invuln).toBeGreaterThan(0);
    const after = r.speed;
    run(s, 1);
    expect(s.crashes).toEqual(['a']); // não bateu de novo
    expect(r.speed).toBeGreaterThanOrEqual(after);
  });

  it('chegada: colocação define o bônus e a corrida acaba depois do prazo extra', () => {
    const s = createTopGear(['a', 'b'], 1);
    flat(s);
    s.racers[0].z = TRACK_LEN - 1; s.racers[0].speed = MAX_SPEED;
    run(s, 1);
    expect(s.racers[0].finished).toBe(true);
    expect(s.racers[0].place).toBe(1);
    expect(racerScore(s.racers[0])).toBe(PLACE_BONUS[0] + 300);
    expect(s.over).toBe(false);
    expect(steer(s, 'a', 1)).toBe(false); // já cruzou a linha
    run(s, GRACE_TICKS);
    expect(s.over).toBe(true);
    expect(racerScore(s.racers[1])).toBeLessThan(PLACE_BONUS[3]); // não chegou: só pontos de percurso
  });

  it('solo termina ao chegar; o tempo limite encerra a corrida', () => {
    const solo = createTopGear(['a'], 1);
    flat(solo);
    solo.racers[0].z = TRACK_LEN - 1; solo.racers[0].speed = MAX_SPEED;
    run(solo, 1);
    expect(solo.over).toBe(true);

    const m = createTopGear(['a', 'b'], 1);
    run(m, MATCH_TICKS);
    expect(m.over).toBe(true);
  });

  it('motor: entrada, quadro e eventos', () => {
    const e = new TopGearEngine();
    e.start(['a', 'b'], 3);
    expect(e.input('a', 'right')).toBe(true);
    expect(e.input('a', 'b')).toBe(true);
    expect(e.input('a', 'a')).toBe(false);
    expect(e.input('zz', 'left')).toBe(false);
    e.step();
    expect(e.drainEvents()).toEqual([{ playerId: 'a', kind: 'drop', value: 1 }]);
    const f = e.frame();
    expect(f.game === 'topgear' && f.cars.length === 2 && f.cars[0].turbo && f.curves.length > 0).toBe(true);
    expect(e.isOver()).toBe(false);
    expect(e.playerOver('a')).toBe(false);
    expect(e.score('a')).toBe(0);
  });
});
