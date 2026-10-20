import type { RoomState } from '@mpvg/shared';
import type { AppSocket } from '../../lib/socket';

export function Results({ room, socket }: { room: RoomState; socket: AppSocket | null }) {
  return (
    <div className="tv results">
      <h1 className="logo">FIM DE JOGO</h1>
      <ol className="ranking">
        {room.ranking?.map((r) => (
          <li key={r.playerId} style={{ borderColor: r.color }}>
            <span className="pos">{r.position}º</span>
            <span className="badge" style={{ background: r.color }}>J{r.position}</span>
            <span className="pname">{r.name}</span>
            <span className="score">{r.score}</span>
          </li>
        ))}
      </ol>
      <button className="btn" onClick={() => socket?.emit('room:back')}>
        Voltar à sala (ou botão A no celular)
      </button>
    </div>
  );
}
