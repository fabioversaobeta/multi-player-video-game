import { describe, expect, it } from 'vitest';
import { InvadersEngine } from './engine.js';
import {
  COLS, INV_W_FIELD, ROWS, SHIP_LIVES, SHIP_STEP, SHIP_Y, createInvaders, fire, invadersOver, moveShip, stepInvaders,
} from './rules.js';

describe('space invaders', () => {
  it('nave anda em passos fixos e para nas bordas', () => {
    const s = createInvaders(['a'], 1);
    const x0 = s.ships[0].x;
    expect(moveShip(s, 'a', 'left')).toBe(true);
    expect(s.ships[0].x).toBe(x0 - SHIP_STEP);
    for (let i = 0; i < 50; i++) moveShip(s, 'a', 'left');
    expect(moveShip(s, 'a', 'left')).toBe(false);
    for (let i = 0; i < 50; i++) moveShip(s, 'a', 'right');
    expect(s.ships[0].x).toBeLessThanOrEqual(INV_W_FIELD);
    expect(moveShip(s, 'ninguem', 'left')).toBe(false);
  });

  it('só um tiro por jogador ao mesmo tempo', () => {
    const s = createInvaders(['a', 'b'], 1);
    expect(fire(s, 'a')).toBe(true);
    expect(fire(s, 'a')).toBe(false);
    expect(fire(s, 'b')).toBe(true);
  });

  it('tiro acerta um invasor, pontua para quem atirou e some', () => {
    const s = createInvaders(['a'], 1);
    const target = s.aliens.find((a) => a.row === ROWS - 1 && a.col === 0)!;
    s.ships[0].x = s.ox + target.col * 9;
    s.bombTimer = 9999;
    fire(s, 'a');
    for (let i = 0; i < 60 && s.aliens.length === COLS * ROWS; i++) stepInvaders(s);
    expect(s.aliens).toHaveLength(COLS * ROWS - 1);
    expect(s.ships[0].score).toBe(10);
    expect(s.kills).toEqual(['a']);
    expect(s.shots.some((t) => t.owner === 'a')).toBe(false);
  });

  it('pelotão desce e inverte ao bater na borda', () => {
    const s = createInvaders(['a'], 1);
    s.bombTimer = 9999;
    const oy = s.oy;
    for (let i = 0; i < 400 && s.oy === oy; i++) stepInvaders(s);
    expect(s.oy).toBeGreaterThan(oy);
    expect(s.dir).toBe(-1);
  });

  it('bomba tira uma vida, dá invulnerabilidade e o jogador cai com 0 vidas', () => {
    const s = createInvaders(['a'], 1);
    s.bombTimer = 9999;
    s.shots.push({ x: s.ships[0].x, y: SHIP_Y - 1, owner: null });
    stepInvaders(s);
    expect(s.ships[0].lives).toBe(SHIP_LIVES - 1);
    expect(s.hits).toEqual(['a']);
    s.shots.push({ x: s.ships[0].x, y: SHIP_Y - 1, owner: null });
    stepInvaders(s);
    expect(s.ships[0].lives).toBe(SHIP_LIVES - 1); // invulnerável
    s.ships[0].lives = 0;
    expect(invadersOver(s)).toBe(true);
  });

  it('invasores chegando embaixo encerram a partida para todos', () => {
    const s = createInvaders(['a', 'b'], 1);
    s.bombTimer = 9999;
    s.oy = SHIP_Y;
    stepInvaders(s);
    expect(s.lost).toBe(true);
    expect(invadersOver(s)).toBe(true);
    expect(moveShip(s, 'a', 'left')).toBe(false);
  });

  it('limpar a onda inicia a próxima', () => {
    const s = createInvaders(['a'], 1);
    s.bombTimer = 9999;
    s.aliens = [s.aliens[0]];
    s.ships[0].x = s.ox + 2; // o pelotão (1 só invasor) anda rápido: mira à frente
    s.oy = 55;
    fire(s, 'a');
    for (let i = 0; i < 60 && s.wave === 1; i++) stepInvaders(s);
    expect(s.wave).toBe(2);
    expect(s.aliens).toHaveLength(COLS * ROWS);
    expect(s.waveCleared).toBe(true);
  });

  it('adaptador: A atira, esquerda/direita movem, quadro e fim de jogo', () => {
    const e = new InvadersEngine();
    e.start(['a', 'b'], 1);
    expect(e.input('a', 'a')).toBe(true);
    expect(e.input('a', 'left')).toBe(true);
    expect(e.input('a', 'pause')).toBe(false);
    e.step();
    expect(e.drainEvents().some((ev) => ev.kind === 'drop' && ev.playerId === 'a')).toBe(true);
    const f = e.frame();
    expect(f.game === 'invaders' && f.aliens.length === COLS * ROWS && f.ships.length === 2).toBe(true);
    expect(e.isOver()).toBe(false);
    expect(e.playerOver('a')).toBe(false);
  });
});
