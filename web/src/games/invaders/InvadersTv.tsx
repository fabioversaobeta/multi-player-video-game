import { PlayerScore, ScoreBar, StatScore, hearts } from '../../components/ScoreBar';
import type { TvViewProps } from '../types';
import { InvadersField } from './InvadersField';

export function InvadersTv({ frame, room, vp }: TvViewProps<'invaders'>) {
  const unit = Math.max(4, Math.floor(Math.min((vp.w - 64) / frame.w, (vp.h - 190) / frame.h)));
  return (
    <div className="tv playing">
      <ScoreBar>
        {room.players.map((p, i) => {
          const sh = frame.ships.find((x) => x.id === p.id);
          return (
            <PlayerScore
              key={p.id} color={p.color} badge={`J${i + 1}`} name={p.name}
              lives={hearts(sh?.lives ?? 0)} score={sh?.score ?? 0} dead={!sh || sh.lives <= 0}
            />
          );
        })}
        <StatScore label="Onda" value={frame.wave} />
      </ScoreBar>
      <div className="board-wrap snake-wrap"><InvadersField frame={frame} players={room.players} unit={unit} /></div>
    </div>
  );
}
