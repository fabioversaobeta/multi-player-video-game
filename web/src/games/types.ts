import type { GameFrame, RoomState } from '@mpvg/shared';
import type { Viewport } from '../lib/useViewport';

/** Props da visão de TV de um jogo: o quadro já chega estreitado para o jogo certo. */
export interface TvViewProps<G extends GameFrame['game']> {
  frame: Extract<GameFrame, { game: G }>;
  room: RoomState;
  vp: Viewport;
}
