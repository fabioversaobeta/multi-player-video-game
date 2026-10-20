import { describe, expect, it } from 'vitest';
import { Room } from '../../rooms/index.js';
import {
  FOOD_POINTS, SNAKE_COLS, SNAKE_ROWS, START_LIVES, createSnake, moveInterval, stepSnake, turn, type SnakeState,
} from './rules.js';

/** Avança um movimento completo (vários ticks). */
function move(s: SnakeState, times = 1) {
  for (let i = 0; i < times * moveInterval(s.ticks); i++) stepSnake(s);
}

describe('snake', () => {
  it('anda para a frente e mantém o comprimento', () => {
    const s = createSnake(['a'], 1);
    const [hx, hy] = s.snakes[0].body[0];
    move(s);
    expect(s.snakes[0].body[0]).toEqual([hx + 1, hy]);
    expect(s.snakes[0].body).toHaveLength(3);
  });

  it('curva é relativa à direção e não permite inverter', () => {
    const s = createSnake(['a'], 1); // começa indo para a direita
    const [hx, hy] = s.snakes[0].body[0];
    turn(s, 'a', 'right'); // direita -> baixo
    move(s);
    expect(s.snakes[0].body[0]).toEqual([hx, hy + 1]);
    turn(s, 'a', 'left'); // baixo -> direita
    move(s);
    expect(s.snakes[0].body[0]).toEqual([hx + 1, hy + 1]);
  });

  it('limita a fila de curvas a 2', () => {
    const s = createSnake(['a'], 1);
    expect(turn(s, 'a', 'left')).toBe(true);
    expect(turn(s, 'a', 'left')).toBe(true);
    expect(turn(s, 'a', 'left')).toBe(false);
  });

  it('comer cresce e pontua', () => {
    const s = createSnake(['a'], 1);
    const [hx, hy] = s.snakes[0].body[0];
    s.foods = [[hx + 1, hy], [0, 0]];
    move(s);
    expect(s.snakes[0].score).toBe(FOOD_POINTS);
    expect(s.snakes[0].body).toHaveLength(4);
    expect(s.foods).toHaveLength(2); // a comida é reposta
  });

  it('atravessa a borda e reaparece do lado oposto, sem perder vida', () => {
    const s = createSnake(['a'], 1);
    move(s, SNAKE_COLS);
    expect(s.snakes[0].alive).toBe(true);
    expect(s.snakes[0].lives).toBe(START_LIVES);
    expect(s.snakes[0].body[0]).toEqual([4, 4]); // deu a volta completa
    s.snakes[0].body = [[0, 5], [1, 5], [2, 5]];
    s.snakes[0].dir = 3;
    move(s);
    expect(s.snakes[0].body[0]).toEqual([SNAKE_COLS - 1, 5]);
    s.snakes[0].body = [[5, 0], [5, 1], [5, 2]];
    s.snakes[0].dir = 0;
    move(s);
    expect(s.snakes[0].body[0]).toEqual([5, SNAKE_ROWS - 1]);
  });

  it('bater em si mesma custa uma vida e a cobra renasce', () => {
    const s = createSnake(['a'], 1);
    s.snakes[0].body = [[10, 5], [10, 6], [9, 6], [9, 5], [9, 4], [10, 4], [10, 3]];
    s.snakes[0].dir = 0; // vai para (10,4), o próprio corpo
    s.foods = [[0, 0], [31, 17]];
    move(s);
    expect(s.snakes[0].alive).toBe(true);
    expect(s.snakes[0].lives).toBe(START_LIVES - 1);
    expect(s.snakes[0].body).toHaveLength(3);
    expect(s.crashed).toEqual(['a']);
  });

  it('sem vidas a cobra é eliminada', () => {
    const s = createSnake(['a'], 1);
    s.snakes[0].lives = 1;
    s.snakes[0].body = [[10, 5], [10, 6], [9, 6], [9, 5], [9, 4], [10, 4], [10, 3]];
    s.snakes[0].dir = 0;
    s.foods = [[0, 0], [31, 17]];
    move(s);
    expect(s.snakes[0].alive).toBe(false);
    expect(s.snakes[0].body).toEqual([]);
  });

  it('cabeça contra cabeça elimina os dois', () => {
    const s = createSnake(['a', 'b'], 1);
    s.snakes[0].body = [[10, 5], [9, 5], [8, 5]];
    s.snakes[0].dir = 1;
    s.snakes[1].body = [[12, 5], [13, 5], [14, 5]];
    s.snakes[1].dir = 3;
    s.foods = [[0, 0], [31, 17]];
    move(s);
    expect(s.snakes.map((x) => x.lives)).toEqual([START_LIVES - 1, START_LIVES - 1]);
  });

  it('bater no corpo de outra cobra elimina só quem bateu', () => {
    const s = createSnake(['a', 'b'], 1);
    s.snakes[0].body = [[10, 5], [9, 5], [8, 5]];
    s.snakes[0].dir = 1; // vai para (11,5), onde está o corpo de b
    s.snakes[1].body = [[11, 4], [11, 5], [11, 6]];
    s.snakes[1].dir = 0; // sobe, segue viva
    s.foods = [[0, 0], [31, 17]];
    move(s);
    expect(s.snakes[0].lives).toBe(START_LIVES - 1);
    expect(s.snakes[1].lives).toBe(START_LIVES);
  });

  it('a própria cauda que sai libera a casa no mesmo movimento', () => {
    const s = createSnake(['a'], 1);
    s.snakes[0].body = [[10, 5], [10, 6], [9, 6], [9, 5]]; // cabeça ao lado da cauda
    s.snakes[0].dir = 3; // vai para (9,5), casa da cauda
    s.foods = [[0, 0], [31, 17]];
    move(s);
    expect(s.snakes[0].alive).toBe(true);
  });

  it('é determinístico para a mesma semente', () => {
    const a = createSnake(['a', 'b'], 7);
    const b = createSnake(['a', 'b'], 7);
    expect(a.foods).toEqual(b.foods);
  });

  it('a comida nunca nasce sobre uma cobra', () => {
    for (let seed = 0; seed < 50; seed++) {
      const s = createSnake(['a', 'b', 'c', 'd'], seed);
      const body = new Set(s.snakes.flatMap((x) => x.body.map((p) => p.join(','))));
      expect(s.foods.every((f) => !body.has(f.join(',')))).toBe(true);
    }
  });
});

describe('sala com Snake', () => {
  function startSnake(names: string[]) {
    const room = new Room('ABCD');
    room.setGame('snake');
    const players = names.map((n, i) => {
      const r = room.join(n, `s${i}`);
      if (!r.ok) throw new Error(r.error);
      return r.player;
    });
    players.forEach((p) => room.setReady(p.id, true));
    for (let i = 0; i < 100; i++) room.step();
    return { room, players };
  }

  it('troca de jogo só no lobby e zera os "prontos"', () => {
    const room = new Room('ABCD');
    const r = room.join('Ana', 's1');
    const r2 = room.join('Beto', 's2');
    if (!r.ok || !r2.ok) throw new Error('join');
    room.setGame('snake');
    expect(room.state().game).toBe('snake');
    room.setGame('inexistente');
    expect(room.game).toBe('snake');
    room.setReady(r.player.id, true); // Beto ainda não está pronto: segue no lobby
    room.setGame('tetris');
    expect(r.player.ready).toBe(false);
    room.setReady(r.player.id, true);
    room.setReady(r2.player.id, true);
    for (let i = 0; i < 100; i++) room.step();
    room.setGame('snake'); // partida em andamento: ignorado
    expect(room.game).toBe('tetris');
  });

  it('joga uma partida inteira e gera ranking', () => {
    const { room, players } = startSnake(['Ana', 'Beto']);
    expect(room.phase).toBe('playing');
    expect(room.frame()?.game).toBe('snake');
    // cada cobra fica com 1 vida e um corpo prestes a bater em si mesma
    const state = (room as any).engine.state as SnakeState;
    for (const sn of state.snakes) {
      const [x, y] = sn.body[0];
      sn.lives = 1;
      sn.dir = 0;
      sn.body = [[x, y], [x, y + 1], [x - 1, y + 1], [x - 1, y], [x - 1, y - 1], [x, y - 1], [x, y - 2]];
    }
    for (let i = 0; i < 30 * 60 && room.phase === 'playing'; i++) room.step();
    expect(room.phase).toBe('results');
    expect(room.state().ranking).toHaveLength(2);
    expect(room.state().players.every((p) => p.over)).toBe(true);
    expect(room.sfxEvents.some((e) => e.kind === 'crash')).toBe(true);
    expect(players).toHaveLength(2);
  });

  it('input de Snake: curva aceita, botão inútil rejeitado', () => {
    const { room, players } = startSnake(['Ana']);
    room.input(players[0].id, 'right');
    room.input(players[0].id, 'down');
    expect(room.audit.at(-2)?.accepted).toBe(true);
    expect(room.audit.at(-1)).toMatchObject({ accepted: false, reason: 'movimento inválido' });
  });
});
