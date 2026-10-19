import { createServer } from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server, type Socket } from 'socket.io';
import type { ClientToServer, ServerToClient } from './protocol.js';
import { RoomManager, type Room } from './rooms.js';
import { TICKS_PER_SECOND } from './tetris.js';

const PORT = Number(process.env.PORT ?? 3001);
const ORIGIN = process.env.CORS_ORIGIN ?? '*'; // em produção: URL do frontend na Vercel
const corsOrigin = ORIGIN === '*' ? true : ORIGIN.split(',');

const app = express();
app.use(cors({ origin: corsOrigin }));
const manager = new RoomManager();
app.get('/health', (_req, res) => res.json({ ok: true, rooms: manager.rooms.size }));

const http = createServer(app);
const io = new Server<ClientToServer, ServerToClient>(http, { cors: { origin: corsOrigin } });

const tvChannel = (room: Room) => `${room.code}:tv`;
const roomChannel = (room: Room) => `room:${room.code}`;

io.on('connection', (socket: Socket<ClientToServer, ServerToClient>) => {
  let current: Room | undefined;
  let playerId: string | undefined;

  socket.on('tv:create', (ack) => {
    const room = manager.create();
    room.tvSocketId = socket.id;
    current = room;
    socket.join([roomChannel(room), tvChannel(room)]);
    room.touch();
    ack({ code: room.code, tvToken: room.tvToken });
  });

  socket.on('tv:resume', ({ code, tvToken }, ack) => {
    const room = manager.get(code);
    if (!room || room.tvToken !== tvToken) return ack({ ok: false });
    room.tvSocketId = socket.id;
    room.emptySince = null;
    current = room;
    socket.join([roomChannel(room), tvChannel(room)]);
    room.touch();
    room.frameDirty = true;
    ack({ ok: true });
  });

  socket.on('player:join', ({ code, name, token }, ack) => {
    const room = manager.get(code);
    if (!room) return ack({ ok: false, error: 'Sala não encontrada.' });
    const r = room.join(name, socket.id, token);
    if (!r.ok) return ack(r);
    current = room;
    playerId = r.player.id;
    socket.join(roomChannel(room));
    ack({ ok: true, playerId: r.player.id, token: r.player.token });
  });

  socket.on('player:ready', ({ ready }) => {
    if (current && playerId) current.setReady(playerId, !!ready);
  });

  socket.on('player:input', ({ action }) => {
    if (current && playerId) current.input(playerId, action);
  });

  socket.on('room:back', () => current?.backToLobby());

  socket.on('disconnect', () => current?.disconnectSocket(socket.id));
});

// Loop do servidor: 30 ticks por segundo; só transmite quando algo mudou.
const lastFrameKey = new Map<string, string>();
const TICK_MS = 1000 / TICKS_PER_SECOND;
let lastTime = Date.now();
let acc = 0;
setInterval(() => {
  // acumulador: setInterval pode atrasar (especialmente no Windows); garante 30 ticks/s reais
  const now = Date.now();
  acc = Math.min(acc + (now - lastTime), TICK_MS * 5);
  lastTime = now;
  const steps = Math.floor(acc / TICK_MS);
  acc -= steps * TICK_MS;
  for (const room of manager.rooms.values()) {
    for (let i = 0; i < steps; i++) room.step();
    if (room.stateDirty) {
      room.stateDirty = false;
      io.to(roomChannel(room)).emit('room:state', room.state());
    }
    if (room.phase === 'playing' || room.frameDirty) {
      room.frameDirty = false;
      const frame = room.frame();
      const key = JSON.stringify(frame);
      if (lastFrameKey.get(room.code) !== key) {
        lastFrameKey.set(room.code, key);
        io.to(tvChannel(room)).emit('game:frame', frame);
      }
    }
  }
}, 1000 / TICKS_PER_SECOND);

setInterval(() => {
  for (const code of manager.sweep()) {
    lastFrameKey.delete(code);
    console.log(`sala ${code} removida (vazia)`);
  }
}, 5000);

http.listen(PORT, () => console.log(`servidor em http://localhost:${PORT}`));
