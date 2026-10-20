import type { CSSProperties } from 'react';
import type { GameId, InputAction, PlayerInfo, RoomState } from '@mpvg/shared';
import { PadButton } from './PadButton';

const HINTS: Partial<Record<GameId, string>> = {
  snake: 'Esquerda/direita giram a cobra',
  pong: 'Segure ▲ ▼ para mover a raquete · vence quem fizer 7 pontos',
  invaders: '◀ ▶ movem a nave · FOGO atira (um tiro por vez)',
  pacman: 'Toque numa direção: o Pac-Man segue até bater · coma tudo e fuja dos fantasmas',
  bomberman: 'Ande pela arena · BOMBA explode em 3 s · último de pé vence',
  topgear: '◀ ▶ mudam de lado (as curvas empurram!) · NITRO: 3 turbos · desvie dos carros',
  doodle: '◀ ▶ movem o personagem (ele pula sozinho) · suba o mais alto que puder · não caia!',
  asteroids: '◀ ▶ giram a nave · PROPULSOR acelera · FOGO atira · acerte rochas e rivais (3 vidas)',
};

interface Props {
  room: RoomState;
  me: PlayerInfo;
  game: GameId;
  style: CSSProperties;
  send: (a: InputAction) => void;
}

/** Controle do celular durante a partida; os botões mudam conforme o jogo. */
export function GamePad({ room, me, game, style, send }: Props) {
  return (
    <div className="phone pad" style={style}>
      <div className="pad-top" style={{ borderColor: me.color }}>
        <span>{me.name}</span><strong>{me.score}</strong>
      </div>
      {me.over && <div className="pad-over">Fim! {me.score} pts — aguarde os demais…</div>}
      {HINTS[game] && <div className="pad-hint">{HINTS[game]}</div>}
      <Buttons game={game} send={send} />
      {room.canPause && <PadButton label="PAUSA" action="pause" send={send} className="pause" />}
    </div>
  );
}

function Buttons({ game, send }: { game: GameId; send: (a: InputAction) => void }) {
  if (game === 'asteroids') {
    return (
      <div className="pad-grid">
        <div className="dpad split three">
          <PadButton label="◀" action="left" repeat send={send} />
          <PadButton label="PROPULSOR" action="up" repeat send={send} className="round" />
          <PadButton label="▶" action="right" repeat send={send} />
        </div>
        <div className="abtns">
          <PadButton label="FOGO" action="a" repeat send={send} className="round" />
        </div>
      </div>
    );
  }
  if (game === 'topgear') {
    return (
      <div className="pad-grid">
        <div className="dpad split three">
          <PadButton label="◀" action="left" repeat send={send} />
          <PadButton label="NITRO" action="b" send={send} className="round" />
          <PadButton label="▶" action="right" repeat send={send} />
        </div>
      </div>
    );
  }
  if (game === 'bomberman') {
    return (
      <div className="pad-grid">
        <div className="dpad cross">
          <PadButton label="▲" action="up" repeat send={send} className="up" />
          <PadButton label="◀" action="left" repeat send={send} className="left" />
          <PadButton label="▶" action="right" repeat send={send} className="right" />
          <PadButton label="▼" action="down" repeat send={send} className="down-btn" />
        </div>
        <div className="abtns">
          <PadButton label="BOMBA" action="a" send={send} className="round" />
        </div>
      </div>
    );
  }
  if (game === 'pacman') {
    return (
      <div className="pad-grid">
        <div className="dpad cross">
          <PadButton label="▲" action="up" send={send} className="up" />
          <PadButton label="◀" action="left" send={send} className="left" />
          <PadButton label="▶" action="right" send={send} className="right" />
          <PadButton label="▼" action="down" send={send} className="down-btn" />
        </div>
      </div>
    );
  }
  // tetris, snake, pong, invaders e doodle: esquerda/direita (e extras por jogo)
  return (
    <div className="pad-grid">
      <div className={game === 'tetris' ? 'dpad' : game === 'invaders' ? 'dpad split three' : 'dpad split'}>
        <PadButton label={game === 'pong' ? '▲' : '◀'} action="left" repeat={game !== 'snake'} send={send} />
        {game === 'tetris' && <PadButton label="▼" action="down" repeat send={send} />}
        {game === 'invaders' && <PadButton label="FOGO" action="a" repeat send={send} className="round" />}
        <PadButton label={game === 'pong' ? '▼' : '▶'} action="right" repeat={game !== 'snake'} send={send} />
      </div>
      {game === 'tetris' && (
        <div className="abtns">
          <PadButton label="B" action="b" send={send} className="round" />
          <PadButton label="A" action="a" send={send} className="round" />
        </div>
      )}
    </div>
  );
}
