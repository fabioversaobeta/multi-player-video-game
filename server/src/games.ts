// Registro dos jogos disponíveis. Para adicionar um jogo: implementar GameEngine e registrar aqui.
import type { GameEngine } from './engine.js';
import type { GameId, GameOption } from './protocol.js';
import { AsteroidsEngine } from './asteroids-engine.js';
import { BombermanEngine } from './bomberman-engine.js';
import { DoodleEngine } from './doodle-engine.js';
import { InvadersEngine } from './invaders-engine.js';
import { PacmanEngine } from './pacman-engine.js';
import { PongEngine } from './pong-engine.js';
import { SnakeEngine } from './snake-engine.js';
import { TetrisEngine } from './tetris-engine.js';
import { TopGearEngine } from './topgear-engine.js';

interface GameDef extends GameOption {
  create(): GameEngine;
}

export const DEFAULT_GAME: GameId = 'tetris';

export const GAMES: Record<GameId, GameDef> = {
  tetris: { id: 'tetris', name: 'Tetris', create: () => new TetrisEngine() },
  snake: { id: 'snake', name: 'Snake', create: () => new SnakeEngine() },
  pong: { id: 'pong', name: 'Pong', create: () => new PongEngine() },
  invaders: { id: 'invaders', name: 'Space Invaders', create: () => new InvadersEngine() },
  pacman: { id: 'pacman', name: 'Pac-Man', create: () => new PacmanEngine() },
  bomberman: { id: 'bomberman', name: 'Bomberman', create: () => new BombermanEngine() },
  topgear: { id: 'topgear', name: 'Top Gear', create: () => new TopGearEngine() },
  doodle: { id: 'doodle', name: 'Doodle Jump', create: () => new DoodleEngine() },
  asteroids: { id: 'asteroids', name: 'Asteroids', create: () => new AsteroidsEngine() },
};

export const GAME_OPTIONS: GameOption[] = Object.values(GAMES).map(({ id, name }) => ({ id, name }));

export const isGameId = (v: unknown): v is GameId => typeof v === 'string' && v in GAMES;
