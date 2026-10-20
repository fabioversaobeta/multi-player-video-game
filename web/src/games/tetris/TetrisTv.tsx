import type { TvViewProps } from '../types';
import { Board, PIECE_COLORS } from './Board';

export function TetrisTv({ frame, room, vp }: TvViewProps<'tetris'>) {
  const n = Math.max(1, room.players.length);
  const colW = vp.w / n - 32;
  const size = Math.max(8, Math.floor(Math.min(colW / 10 - 2, (vp.h - 190) / 20)));
  return (
    <div className="tv playing">
      <div className="boards">
        {room.players.map((p, i) => {
          const b = frame.boards[p.id];
          return (
            <div key={p.id} className="board-col" style={{ borderColor: p.color }}>
              <div className="board-head">
                <span className="badge" style={{ background: p.color }}>J{i + 1}</span>
                <span className="pname">{p.name}</span>
              </div>
              <div className="board-wrap">
                {b && <Board frame={b} size={size} />}
                {b?.over && (
                  <div className="over-overlay">
                    <strong>FIM!</strong>
                    <span>{b.score} pts</span>
                    <small>aguardando os demais…</small>
                  </div>
                )}
              </div>
              <div className="board-foot">
                <span className="score">{b?.score ?? 0}</span>
                <span className="small">Nível {b?.level ?? 1} · {b?.lines ?? 0} linhas</span>
                <span className="next" style={{ background: PIECE_COLORS[b?.next ?? 0] }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
