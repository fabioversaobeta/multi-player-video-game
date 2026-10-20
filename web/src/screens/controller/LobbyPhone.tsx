import type { CSSProperties } from 'react';
import type { GameId, PlayerInfo, RoomState } from '@mpvg/shared';
import { playLineClear, unlockAudio } from '../../lib/sounds';
import type { getRecords } from '../../lib/storage';

interface Props {
  room: RoomState;
  me: PlayerInfo;
  records: ReturnType<typeof getRecords>;
  style: CSSProperties;
  onPickGame: (id: GameId) => void;
  onReady: (ready: boolean) => void;
  onClearRecords: () => void;
}

export function LobbyPhone({ room, me, records, style, onPickGame, onReady, onClearRecords }: Props) {
  return (
    <div className="phone center" style={style}>
      <div className="me-badge" style={{ background: me.color }}>{me.name}</div>
      <p>Você está conectado · sala {room.code}</p>
      <p className="small">{room.players.length} jogador(es) na sala</p>
      {room.phase === 'lobby' && (
        <div className="game-picker">
          {room.games.map((g) => (
            <button
              key={g.id}
              className={'game-opt' + (g.id === room.game ? ' on' : '')}
              onClick={() => onPickGame(g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}
      {room.phase === 'countdown' && <p className="small">{room.games.find((g) => g.id === room.game)?.name}</p>}
      {room.phase === 'countdown' ? (
        <div className="countdown-small">{room.countdown}</div>
      ) : (
        <button
          className={'btn big-btn' + (me.ready ? ' on' : '')}
          onClick={() => { unlockAudio(); onReady(!me.ready); }}
        >
          {me.ready ? '✔ PRONTO (toque p/ cancelar)' : 'ESTOU PRONTO'}
        </button>
      )}
      <button
        className="link"
        onClick={() => { unlockAudio(); [1, 2, 3, 4].forEach((n, i) => setTimeout(() => playLineClear(n), 200 + i * 900)); }}
      >
        🔊 Testar som
      </button>
      <div className="records">
        <h3>Meus recordes</h3>
        {records.length === 0 && <p className="small">Ainda sem recordes</p>}
        <ol>{records.map((r) => <li key={r.pos}>{r.pos}º {r.player} — {r.score}</li>)}</ol>
        {records.length > 0 && <button className="link" onClick={onClearRecords}>Resetar recordes</button>}
      </div>
    </div>
  );
}
