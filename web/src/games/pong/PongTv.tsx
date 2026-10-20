import { PlayerScore, ScoreBar } from '../../components/ScoreBar';
import type { TvViewProps } from '../types';
import { PongCourt } from './PongCourt';

export function PongTv({ frame, room, vp }: TvViewProps<'pong'>) {
  const unit = Math.max(4, Math.floor(Math.min((vp.w - 64) / frame.w, (vp.h - 190) / frame.h)));
  return (
    <div className="tv playing">
      <ScoreBar>
        {frame.paddles.map((pd, i) => {
          const p = room.players.find((x) => x.id === pd.id);
          return (
            <PlayerScore
              key={i} color={p?.color ?? '#9aa0b4'}
              badge={p ? `J${room.players.indexOf(p) + 1}` : 'CPU'}
              name={p?.name ?? 'Computador'} score={pd.score}
            />
          );
        })}
      </ScoreBar>
      <div className="board-wrap snake-wrap"><PongCourt frame={frame} players={room.players} unit={unit} /></div>
    </div>
  );
}
