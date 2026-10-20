// Contrato de um jogo plugável na sala. A sala cuida de lobby, contagem, ranking e conexões;
// o motor cuida só das regras e do estado da partida.
import type { GameFrame, InputAction } from './protocol.js';

export const TICKS_PER_SECOND = 30;

/** Evento sonoro enviado só ao celular do jogador (ex.: linhas fechadas, comida, batida). */
export type SfxKind = 'lines' | 'eat' | 'crash' | 'drop';

export interface EngineEvent {
  playerId: string;
  kind: SfxKind;
  value: number;
}

export interface GameEngine {
  /** O jogo aceita pausa? Se falso, o controle não exibe o botão. */
  readonly canPause: boolean;
  /** Inicia uma partida para os jogadores informados (a ordem define a posição inicial). */
  start(playerIds: string[], seed: number): void;
  /** Aplica um comando. Devolve false se foi rejeitado (rejeição silenciosa). */
  input(playerId: string, action: InputAction): boolean;
  /** Um tick do servidor (30/s). */
  step(): void;
  /** Todos os jogadores chegaram ao fim? */
  isOver(): boolean;
  score(playerId: string): number;
  /** Este jogador já perdeu? */
  playerOver(playerId: string): boolean;
  frame(): GameFrame;
  /** Entrega e esvazia os eventos sonoros acumulados. */
  drainEvents(): EngineEvent[];
}
