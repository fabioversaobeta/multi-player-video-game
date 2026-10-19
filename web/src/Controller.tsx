import { useEffect, useRef, useState } from 'react';
import type { InputAction, RoomState } from '../../server/src/protocol';
import { playCountdown, playGameOver, playGo, playLineClear, unlockAudio } from './sounds';
import { connect, type AppSocket } from './socket';
import { addRecordOnce, getName, getRecords, resetRecords, saveName } from './storage';

const tokenKey = (code: string) => `mpvg:token:${code}`;
const joinedKey = (code: string) => `mpvg:joined:${code}`;

export function Controller({ code }: { code: string }) {
  const [name, setName] = useState(getName());
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState('');
  const [records, setRecords] = useState(() => getRecords('tetris'));
  const socketRef = useRef<AppSocket | null>(null);
  const nameRef = useRef(name);
  nameRef.current = name;

  const join = (s: AppSocket) => {
    let token: string | undefined;
    try { token = localStorage.getItem(tokenKey(code)) ?? undefined; } catch { /* ignora */ }
    s.emit('player:join', { code, name: nameRef.current, token }, (r) => {
      if (r.ok) {
        setJoined(true);
        setError('');
        setPlayerId(r.playerId);
        try { localStorage.setItem(tokenKey(code), r.token); } catch { /* ignora */ }
      } else {
        setError(r.error);
        setJoined(false);
      }
    });
  };

  useEffect(() => {
    const s = connect();
    socketRef.current = s;
    s.on('room:state', setRoom);
    s.on('player:lines', ({ lines }) => playLineClear(lines));
    // reconexão automática: se já entrou antes nesta sala, volta com o token
    s.on('connect', () => {
      if (nameRef.current && sessionStorage.getItem(joinedKey(code))) join(s);
    });
    return () => { s.disconnect(); };
  }, []);

  const me = room?.players.find((p) => p.id === playerId);

  // grava o recorde local quando a partida termina
  useEffect(() => {
    if (room?.phase === 'results' && me && room.ranking && room.matchId) {
      setRecords(addRecordOnce('tetris', room.matchId, me.name, me.score));
    }
  }, [room?.phase, room?.matchId, me?.id]);

  const phase = room?.phase;
  const countdown = room?.countdown;
  const prevPhase = useRef<string | null>(null);
  useEffect(() => {
    if (phase === 'countdown' && countdown) playCountdown();
  }, [phase, countdown]);
  useEffect(() => {
    if (prevPhase.current === 'countdown' && phase === 'playing') playGo();
    if (phase === 'results') playGameOver();
    prevPhase.current = phase ?? null;
  }, [phase]);

  const send = (action: InputAction) => socketRef.current?.emit('player:input', { action });

  if (!joined) {
    return (
      <div className="phone center">
        <h1 className="logo small-logo">MULTI-PLAYER VIDEO GAME</h1>
        <p>Sala <strong className="code-inline">{code}</strong></p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            unlockAudio();
            const n = name.trim() || 'Jogador';
            setName(n);
            nameRef.current = n;
            saveName(n);
            sessionStorage.setItem(joinedKey(code), '1');
            if (socketRef.current) join(socketRef.current);
          }}
        >
          <input
            className="input" value={name} maxLength={12} placeholder="Seu nome" autoFocus
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn big-btn" type="submit">ENTRAR</button>
        </form>
        {error && <p className="warn">{error}</p>}
      </div>
    );
  }

  if (!room || !me) {
    return <div className="phone center"><p>{room ? 'Você não está nesta partida.' : 'Conectando…'}</p></div>;
  }

  const style = { '--pc': me.color } as React.CSSProperties;

  if (room.phase === 'lobby' || room.phase === 'countdown') {
    return (
      <div className="phone center" style={style}>
        <div className="me-badge" style={{ background: me.color }}>{me.name}</div>
        <p>Você está conectado · sala {room.code}</p>
        <p className="small">{room.players.length} jogador(es) na sala</p>
        {room.phase === 'countdown' ? (
          <div className="countdown-small">{room.countdown}</div>
        ) : (
          <button
            className={'btn big-btn' + (me.ready ? ' on' : '')}
            onClick={() => { unlockAudio(); socketRef.current?.emit('player:ready', { ready: !me.ready }); }}
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
          {records.length > 0 && (
            <button className="link" onClick={() => { resetRecords(); setRecords([]); }}>Resetar recordes</button>
          )}
        </div>
      </div>
    );
  }

  if (room.phase === 'results') {
    const pos = room.ranking?.find((r) => r.playerId === me.id)?.position;
    return (
      <div className="phone center" style={style}>
        <h2>Fim de jogo</h2>
        <p className="bigscore">{me.score}</p>
        <p>Você ficou em <strong>{pos}º</strong> lugar</p>
        <button className="btn big-btn" onClick={() => send('a')}>A · VOLTAR À SALA</button>
      </div>
    );
  }

  return (
    <div className="phone pad" style={style}>
      <div className="pad-top" style={{ borderColor: me.color }}>
        <span>{me.name}</span><strong>{me.score}</strong>
      </div>
      {me.over && <div className="pad-over">Fim! {me.score} pts — aguarde os demais…</div>}
      <div className="pad-grid">
        <div className="dpad">
          <PadButton label="◀" action="left" repeat send={send} />
          <PadButton label="▼" action="down" repeat send={send} />
          <PadButton label="▶" action="right" repeat send={send} />
        </div>
        <div className="abtns">
          <PadButton label="B" action="b" send={send} className="round" />
          <PadButton label="A" action="a" send={send} className="round" />
        </div>
      </div>
      {room.canPause && <PadButton label="PAUSA" action="pause" send={send} className="pause" />}
    </div>
  );
}

function PadButton({ label, action, send, repeat, className }: {
  label: string; action: InputAction; send: (a: InputAction) => void; repeat?: boolean; className?: string;
}) {
  const timers = useRef<{ t?: number; i?: number }>({});
  const [down, setDown] = useState(false);
  const stop = () => {
    clearTimeout(timers.current.t);
    clearInterval(timers.current.i);
    setDown(false);
  };
  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDown(true);
    send(action);
    navigator.vibrate?.(15);
    if (repeat) {
      timers.current.t = window.setTimeout(() => {
        timers.current.i = window.setInterval(() => send(action), 90);
      }, 220);
    }
  };
  useEffect(() => stop, []);
  return (
    <button
      className={`pad-btn ${className ?? ''}${down ? ' down' : ''}`}
      onPointerDown={start} onPointerUp={stop} onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}
