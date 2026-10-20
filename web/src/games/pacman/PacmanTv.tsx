import { PlayerScore, ScoreBar, StatScore, hearts } from '../../components/ScoreBar';
import type { TvViewProps } from '../types';
import { PacmanMaze } from './PacmanMaze';

export function PacmanTv({ frame, room, vp }: TvViewProps<'pacman'>) {
  const size = Math.max(8, Math.floor(Math.min((vp.w - 64) / frame.cols, (vp.h - 190) / frame.rows)));
  return (
    <div className="tv playing">
      <ScoreBar>
        {room.players.map((p, i) => {
          const pc = frame.pacs.find((x) => x.id === p.id);
          return (
            <PlayerScore
              key={p.id} color={p.color} badge={`J${i + 1}`} name={p.name}
              lives={hearts(pc?.lives ?? 0)} score={pc?.score ?? 0} dead={!pc || pc.lives <= 0}
            />
          );
        })}
        <StatScore label="Nível" value={frame.level} />
      </ScoreBar>
      <div className="board-wrap snake-wrap"><PacmanMaze frame={frame} players={room.players} size={size} /></div>
    </div>
  );
}
