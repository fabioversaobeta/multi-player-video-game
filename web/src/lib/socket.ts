import { io, type Socket } from 'socket.io-client';
import type { ClientToServer, ServerToClient } from '@mpvg/shared';

const url = import.meta.env.VITE_SERVER_URL ?? `${location.protocol}//${location.hostname}:3001`;

export type AppSocket = Socket<ServerToClient, ClientToServer>;

export function connect(): AppSocket {
  return io(url);
}
