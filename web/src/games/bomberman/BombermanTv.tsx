import { PlayerScore, ScoreBar, StatScore } from '../../components/ScoreBar';
import type { TvViewProps } from '../types';
import { BombermanArena } from './BombermanArena';

export function BombermanTv({ frame, room, vp }: TvViewProps<'bomberman'>) {
  const size = Math.max(8, Math.floor(Math.min((vp.w - 64) / frame.cols, (vp.h - 190) / frame.rows)));
  return (
    <div className="tv playing">
      <ScoreBar>
        {room.players.map((p, i) => {
          const bp = frame.players.find((x) => x.id === p.id);
          return (
            <PlayerScore
              key={p.id} color={p.color} badge={`J${i + 1}`} name={p.name}
              lives={bp?.alive ? '♥' : '☠'} score={bp?.score ?? 0} dead={!bp?.alive}
            />
          );
        })}
        <StatScore label="Tempo" value={`${frame.secondsLeft}s`} />
      </ScoreBar>
      <div className="board-wrap snake-wrap"><BombermanArena frame={frame} players={room.players} size={size} /></div>
    </div>
  );
}
