import type { GameFrame, RoomState } from '@mpvg/shared';
import type { Viewport } from '../lib/useViewport';
import { AsteroidsTv } from './asteroids/AsteroidsTv';
import { BombermanTv } from './bomberman/BombermanTv';
import { DoodleTv } from './doodle/DoodleTv';
import { InvadersTv } from './invaders/InvadersTv';
import { PacmanTv } from './pacman/PacmanTv';
import { PongTv } from './pong/PongTv';
import { SnakeTv } from './snake/SnakeTv';
import { TetrisTv } from './tetris/TetrisTv';
import { TopGearTv } from './topgear/TopGearTv';

/** Escolhe a visão de TV do jogo do quadro. Para um jogo novo, acrescente um `case`. */
export function TvView({ frame, room, vp }: { frame: GameFrame; room: RoomState; vp: Viewport }) {
  switch (frame.game) {
    case 'asteroids': return <AsteroidsTv frame={frame} room={room} vp={vp} />;
    case 'bomberman': return <BombermanTv frame={frame} room={room} vp={vp} />;
    case 'doodle': return <DoodleTv frame={frame} room={room} vp={vp} />;
    case 'invaders': return <InvadersTv frame={frame} room={room} vp={vp} />;
    case 'pacman': return <PacmanTv frame={frame} room={room} vp={vp} />;
    case 'pong': return <PongTv frame={frame} room={room} vp={vp} />;
    case 'snake': return <SnakeTv frame={frame} room={room} vp={vp} />;
    case 'tetris': return <TetrisTv frame={frame} room={room} vp={vp} />;
    case 'topgear': return <TopGearTv frame={frame} room={room} vp={vp} />;
  }
}
