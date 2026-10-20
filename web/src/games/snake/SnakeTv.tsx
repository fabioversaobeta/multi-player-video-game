import { PlayerScore, ScoreBar, hearts } from '../../components/ScoreBar';
import type { TvViewProps } from '../types';
import { SnakeArena } from './SnakeArena';

export function SnakeTv({ frame, room, vp }: TvViewProps<'snake'>) {
  const size = Math.max(8, Math.floor(Math.min((vp.w - 64) / frame.cols, (vp.h - 190) / frame.rows)));
  return (
    <div className="tv playing">
      <ScoreBar>
        {room.players.map((p, i) => {
          const sn = frame.snakes.find((x) => x.id === p.id);
          return (
            <PlayerScore
              key={p.id} color={p.color} badge={`J${i + 1}`} name={p.name}
              lives={hearts(sn?.lives ?? 0)} score={sn?.score ?? 0}
              dead={!!sn && !sn.alive} note={sn && !sn.alive ? 'eliminado' : undefined}
            />
          );
        })}
      </ScoreBar>
      <div className="board-wrap snake-wrap"><SnakeArena frame={frame} players={room.players} size={size} /></div>
    </div>
  );
}
