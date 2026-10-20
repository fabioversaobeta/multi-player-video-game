import { PlayerScore, ScoreBar, StatScore } from '../../components/ScoreBar';
import type { TvViewProps } from '../types';
import { TopGearRoad } from './TopGearRoad';

export function TopGearTv({ frame, room, vp }: TvViewProps<'topgear'>) {
  const n = Math.max(1, room.players.length);
  const w = Math.max(160, Math.min(520, Math.floor(vp.w / n - 40)));
  const h = Math.max(160, Math.min(Math.floor(w * 0.75), vp.h - 230));
  return (
    <div className="tv playing">
      <ScoreBar>
        {room.players.map((p, i) => {
          const c = frame.cars.find((x) => x.id === p.id);
          return (
            <PlayerScore
              key={p.id} color={p.color} badge={`J${i + 1}`} name={p.name}
              lives={'⚡'.repeat(c?.charges ?? 0)}
              score={c?.finished ? `${c.place}º` : `${Math.round(((c?.z ?? 0) / frame.length) * 100)}%`}
            />
          );
        })}
        <StatScore label="Tempo" value={`${frame.secondsLeft}s`} />
      </ScoreBar>
      <div className="boards">
        {room.players.map((p) => {
          const c = frame.cars.find((x) => x.id === p.id);
          return (
            <div key={p.id} className="board-wrap snake-wrap" style={{ position: 'relative' }}>
              <TopGearRoad frame={frame} carId={p.id} players={room.players} w={w} h={h} />
              <div className="small" style={{ position: 'absolute', left: 8, top: 6, color: '#fff', fontWeight: 700 }}>{Math.round((c?.speed ?? 0) * 4)} km/h</div>
              {c?.finished && (
                <div className="over-overlay">
                  <strong>{c.place}º LUGAR!</strong>
                  <small>aguardando os demais…</small>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
