import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import type { GameFrame, RoomState } from '../../server/src/protocol';
import { Board, PIECE_COLORS } from './Board';
import { SnakeArena } from './SnakeArena';
import { connect, type AppSocket } from './socket';

const publicUrl = (import.meta.env.VITE_PUBLIC_URL as string | undefined) ?? location.origin;
const SESSION_KEY = 'mpvg:tv';

function useViewport() {
  const [v, setV] = useState({ w: innerWidth, h: innerHeight });
  useEffect(() => {
    const on = () => setV({ w: innerWidth, h: innerHeight });
    addEventListener('resize', on);
    return () => removeEventListener('resize', on);
  }, []);
  return v;
}

export function Tv() {
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [frame, setFrame] = useState<GameFrame | null>(null);
  const [online, setOnline] = useState(false);
  const vp = useViewport();

  useEffect(() => {
    const s = connect();
    const start = () => {
      setOnline(true);
      let saved: { code: string; tvToken: string } | null = null;
      try { saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null'); } catch { /* ignora */ }
      const create = () =>
        s.emit('tv:create', (r) => sessionStorage.setItem(SESSION_KEY, JSON.stringify(r)));
      if (saved) s.emit('tv:resume', saved, (r) => { if (!r.ok) create(); });
      else create();
    };
    s.on('connect', start);
    s.on('disconnect', () => setOnline(false));
    s.on('room:state', setRoom);
    s.on('game:frame', setFrame);
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  if (!room) {
    return (
      <div className="tv center">
        <h1 className="logo">MULTI-PLAYER VIDEO GAME</h1>
        <p>{online ? 'Criando sala…' : 'Conectando ao servidor…'}</p>
      </div>
    );
  }

  const joinUrl = `${publicUrl}/j/${room.code}`;
  const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

  if (room.phase === 'lobby' || room.phase === 'countdown') {
    return (
      <div className="tv lobby">
        <h1 className="logo">MULTI-PLAYER VIDEO GAME</h1>
        <div className="lobby-main">
          <div className="qr-card">
            <p className="big">Escaneie com seu celular</p>
            <div className="qr"><QRCodeSVG value={joinUrl} size={Math.min(320, vp.h * 0.4)} /></div>
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

  if (room.phase === 'results') {
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

  if (frame?.game === 'snake' && room.game === 'snake') {
    const size = Math.max(8, Math.floor(Math.min((vp.w - 64) / frame.cols, (vp.h - 190) / frame.rows)));
    return (
      <div className="tv playing">
        <div className="snake-scores">
          {room.players.map((p, i) => {
            const sn = frame.snakes.find((x) => x.id === p.id);
            return (
              <div key={p.id} className={'snake-score' + (sn && !sn.alive ? ' dead' : '')} style={{ borderColor: p.color }}>
                <span className="badge" style={{ background: p.color }}>J{i + 1}</span>
                <span className="pname">{p.name}</span>
                <span className="score">{sn?.score ?? 0}</span>
                {sn && !sn.alive && <span className="small">eliminado</span>}
              </div>
            );
          })}
        </div>
        <div className="board-wrap snake-wrap"><SnakeArena frame={frame} players={room.players} size={size} /></div>
      </div>
    );
  }

  if (frame?.game !== 'tetris' || room.game !== 'tetris') {
    return <div className="tv center"><p>Carregando partida…</p></div>;
  }

  const n = Math.max(1, room.players.length);
  const colW = vp.w / n - 32;
  const size = Math.max(8, Math.floor(Math.min(colW / 10 - 2, (vp.h - 190) / 20)));
  return (
    <div className="tv playing">
      <div className="boards">
        {room.players.map((p, i) => {
          const b = frame?.boards[p.id];
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
