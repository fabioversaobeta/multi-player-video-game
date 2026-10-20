import { PlayerScore, ScoreBar, StatScore } from '../../components/ScoreBar';
import type { TvViewProps } from '../types';
import { DoodleTower } from './DoodleTower';

export function DoodleTv({ frame, room, vp }: TvViewProps<'doodle'>) {
  const n = Math.max(1, room.players.length);
  const h = Math.max(240, vp.h - 230);
  const w = Math.max(120, Math.min(Math.floor(h * 0.6), Math.floor(vp.w / n - 40)));
  return (
    <div className="tv playing">
      <ScoreBar>
        {room.players.map((p, i) => {
          const j = frame.jumpers.find((x) => x.id === p.id);
          return (
            <PlayerScore
              key={p.id} color={p.color} badge={`J${i + 1}`} name={p.name}
              lives={j?.alive ? '▲' : '☠'} score={j?.score ?? 0} dead={!j?.alive}
            />
          );
        })}
        <StatScore label="Tempo" value={`${frame.secondsLeft}s`} />
      </ScoreBar>
      <div className="boards">
        {room.players.map((p) => {
          const j = frame.jumpers.find((x) => x.id === p.id);
          return (
            <div key={p.id} className="board-wrap snake-wrap" style={{ position: 'relative' }}>
              <DoodleTower frame={frame} jumperId={p.id} color={p.color} w={w} h={h} />
              {j && !j.alive && (
                <div className="over-overlay">
                  <strong>{j.score} m</strong>
                  <small>caiu! aguardando os demais…</small>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
