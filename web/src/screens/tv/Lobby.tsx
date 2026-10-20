import { QRCodeSVG } from 'qrcode.react';
import type { RoomState } from '@mpvg/shared';
import type { AppSocket } from '../../lib/socket';

const publicUrl = (import.meta.env.VITE_PUBLIC_URL as string | undefined) ?? location.origin;

export function Lobby({ room, socket, viewportH }: { room: RoomState; socket: AppSocket | null; viewportH: number }) {
  const joinUrl = `${publicUrl}/j/${room.code}`;
  const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
  return (
    <div className="tv lobby">
      <h1 className="logo">MULTI-PLAYER VIDEO GAME</h1>
      <div className="lobby-main">
        <div className="qr-card">
          <p className="big">Escaneie com seu celular</p>
          <div className="qr"><QRCodeSVG value={joinUrl} size={Math.min(320, viewportH * 0.4)} /></div>
          <p className="code">{room.code}</p>
          <p className="small">{joinUrl}</p>
          {isLocal && (
            <p className="warn">Abra esta tela pelo IP da rede (não localhost) para os celulares conseguirem entrar.</p>
          )}
        </div>
        <div className="players-card">
          <p className="big">Jogadores ({room.players.length}/{room.maxPlayers})</p>
          <ul className="player-list">
            {room.players.map((p, i) => (
              <li key={p.id} style={{ borderColor: p.color }}>
                <span className="badge" style={{ background: p.color }}>J{i + 1}</span>
                <span className="pname">{p.name}</span>
                <span className={p.ready ? 'ready' : 'waiting'}>{p.ready ? '✔ PRONTO' : 'aguardando…'}</span>
              </li>
            ))}
            {room.players.length === 0 && <li className="empty">Ninguém entrou ainda</li>}
          </ul>
          <div className="game-picker">
            {room.games.map((g) => (
              <button
                key={g.id}
                className={'game-opt' + (g.id === room.game ? ' on' : '')}
                onClick={() => socket?.emit('room:game', { game: g.id })}
              >
                {g.name}
              </button>
            ))}
          </div>
          <p className="small">O jogo começa quando todos marcarem “Pronto”.</p>
        </div>
      </div>
      {room.phase === 'countdown' && <div className="countdown">{room.countdown}</div>}
    </div>
  );
}
