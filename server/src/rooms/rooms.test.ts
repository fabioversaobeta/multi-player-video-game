import { describe, expect, it } from 'vitest';
import { Room, RoomManager, sanitizeName } from './index.js';

function playersOf(room: Room) {
  return [...room.players.values()];
}

function join(room: Room, name: string, socket: string) {
  const r = room.join(name, socket);
  if (!r.ok) throw new Error(r.error);
  return r.player;
}

describe('sala', () => {
  it('começa quando todos os presentes marcam pronto (com 1 jogador também)', () => {
    const room = new Room('ABCD');
    const a = join(room, 'Ana', 's1');
    expect(room.phase).toBe('lobby');
    room.setReady(a.id, true);
    expect(room.phase).toBe('countdown');
    for (let i = 0; i < 100; i++) room.step();
    expect(room.phase).toBe('playing');
  });

  it('espera todos ficarem prontos', () => {
    const room = new Room('ABCD');
    const a = join(room, 'Ana', 's1');
    join(room, 'Beto', 's2');
    room.setReady(a.id, true);
    expect(room.phase).toBe('lobby');
  });

  it('limita a 4 jogadores e recusa entrada durante a partida', () => {
    const room = new Room('ABCD');
    for (let i = 0; i < 4; i++) join(room, `P${i}`, `s${i}`);
    expect(room.join('Extra', 's9').ok).toBe(false);
    playersOf(room).forEach((p) => room.setReady(p.id, true));
    for (let i = 0; i < 100; i++) room.step();
    expect(room.join('Tarde', 's10').ok).toBe(false);
  });

  it('jogador que desconecta na partida continua no ranking final', () => {
    const room = new Room('ABCD');
    const a = join(room, 'Ana', 's1');
    const b = join(room, 'Beto', 's2');
    room.setReady(a.id, true);
    room.setReady(b.id, true);
    for (let i = 0; i < 100; i++) room.step();
    room.disconnectSocket('s2');
    expect(room.phase).toBe('playing'); // nada pausa
    // Ana joga, Beto fica parado; ambos eventualmente enchem
    for (let i = 0; i < 30 * 600 && room.phase === 'playing'; i++) {
      room.input(a.id, 'down');
      room.step();
    }
    expect(room.phase).toBe('results');
    expect(room.state().ranking).toHaveLength(2);
  });

  it('rejeita input inválido e registra na auditoria', () => {
    const room = new Room('ABCD');
    const a = join(room, 'Ana', 's1');
    room.setReady(a.id, true);
    for (let i = 0; i < 100; i++) room.step();
    for (let i = 0; i < 15; i++) room.input(a.id, 'left');
    expect(room.audit.some((e) => !e.accepted && e.reason === 'movimento inválido')).toBe(true);
  });

  it('reconexão devolve o mesmo jogador via token', () => {
    const room = new Room('ABCD');
    const a = join(room, 'Ana', 's1');
    const b = join(room, 'Beto', 's2');
    room.setReady(a.id, true);
    room.setReady(b.id, true);
    for (let i = 0; i < 100; i++) room.step();
    room.disconnectSocket('s1');
    const again = room.join('Ana', 's3', a.token);
    expect(again.ok && again.player.id).toBe(a.id);
  });

  it('sala é removida depois de ficar vazia', () => {
    const m = new RoomManager();
    const room = m.create();
    room.tvSocketId = 'tv';
    room.disconnectSocket('tv');
    expect(m.sweep(Date.now() + 1000)).toEqual([]);
    expect(m.sweep(Date.now() + 60_000)).toEqual([room.code]);
  });

  it('sanitiza nomes', () => {
    expect(sanitizeName('  <b>Fabio</b> muito longo demais ')).not.toContain('<');
    expect(sanitizeName('')).toBe('Jogador');
    expect(sanitizeName('x'.repeat(50)).length).toBeLessThanOrEqual(12);
  });
});
