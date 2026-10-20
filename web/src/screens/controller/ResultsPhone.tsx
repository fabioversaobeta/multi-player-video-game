import type { CSSProperties } from 'react';
import type { InputAction, PlayerInfo, RoomState } from '@mpvg/shared';

interface Props {
  room: RoomState;
  me: PlayerInfo;
  style: CSSProperties;
  send: (a: InputAction) => void;
}

export function ResultsPhone({ room, me, style, send }: Props) {
  const pos = room.ranking?.find((r) => r.playerId === me.id)?.position;
  return (
    <div className="phone center" style={style}>
      <h2>Fim de jogo</h2>
      <p className="bigscore">{me.score}</p>
      <p>Você ficou em <strong>{pos}º</strong> lugar</p>
      <button className="btn big-btn" onClick={() => send('a')}>A · VOLTAR À SALA</button>
    </div>
  );
}
