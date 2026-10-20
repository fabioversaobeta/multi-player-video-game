import { PlayerScore, ScoreBar, StatScore } from '../../components/ScoreBar';
import type { TvViewProps } from '../types';
import { AsteroidsField } from './AsteroidsField';

export function AsteroidsTv({ frame, room, vp }: TvViewProps<'asteroids'>) {
  const w = Math.max(320, Math.floor(Math.min(vp.w - 64, (vp.h - 190) * (frame.w / frame.h))));
  const h = Math.floor(w * (frame.h / frame.w));
  return (
    <div className="tv playing">
      <ScoreBar>
        {room.players.map((p, i) => {
          const sh = frame.ships.find((x) => x.id === p.id);
          return (
            <PlayerScore
              key={p.id} color={p.color} badge={`J${i + 1}`} name={p.name}
              lives={sh?.alive ? '▲'.repeat(sh.lives) : '☠'} score={sh?.score ?? 0} dead={!sh?.alive}
            />
          );
        })}
        <StatScore label="Tempo" value={`${frame.secondsLeft}s`} />
      </ScoreBar>
      <div className="board-wrap snake-wrap"><AsteroidsField frame={frame} players={room.players} w={w} h={h} /></div>
    </div>
  );
}
