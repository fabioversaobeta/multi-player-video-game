import { randomBytes } from 'node:crypto';
import { Room } from './room.js';

export class RoomManager {
  rooms = new Map<string, Room>();

  create(): Room {
    let code: string;
    do code = randomCode(); while (this.rooms.has(code));
    const room = new Room(code);
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(String(code ?? '').toUpperCase());
  }

  sweep(now = Date.now()): string[] {
    const removed: string[] = [];
    for (const [code, room] of this.rooms) {
      room.checkEmpty(now);
      if (room.isExpired(now)) {
        this.rooms.delete(code);
        removed.push(code);
      }
    }
    return removed;
  }
}

// sem letras ambíguas (I, O) para facilitar digitar o código
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
function randomCode(): string {
  const bytes = randomBytes(4);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}
