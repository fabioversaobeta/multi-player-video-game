// Registro dos jogos disponíveis. Para adicionar um jogo: implementar GameEngine e registrar aqui.
import type { GameEngine } from './engine.js';
import type { GameId, GameOption } from './protocol.js';
import { SnakeEngine } from './snake-engine.js';
import { TetrisEngine } from './tetris-engine.js';

interface GameDef extends GameOption {
  create(): GameEngine;
}

export const DEFAULT_GAME: GameId = 'tetris';

export const GAMES: Record<GameId, GameDef> = {
  tetris: { id: 'tetris', name: 'Tetris', create: () => new TetrisEngine() },
  snake: { id: 'snake', name: 'Snake', create: () => new SnakeEngine() },
};

export const GAME_OPTIONS: GameOption[] = Object.values(GAMES).map(({ id, name }) => ({ id, name }));

export const isGameId = (v: unknown): v is GameId => typeof v === 'string' && v in GAMES;
