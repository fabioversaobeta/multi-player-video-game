import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import type { GameFrame, RoomState } from '../../../server/src/protocol';
import { AsteroidsField } from '../games/asteroids/AsteroidsField';
import { Board, PIECE_COLORS } from '../games/tetris/Board';
import { BombermanArena } from '../games/bomberman/BombermanArena';
import { InvadersField } from '../games/invaders/InvadersField';
import { DoodleTower } from '../games/doodle/DoodleTower';
import { PacmanMaze } from '../games/pacman/PacmanMaze';
import { PongCourt } from '../games/pong/PongCourt';
import { TopGearRoad } from '../games/topgear/TopGearRoad';
import { SnakeArena } from '../games/snake/SnakeArena';
import { connect, type AppSocket } from '../lib/socket';

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
                <span className="lives">{'♥'.repeat(sn?.lives ?? 0) + '♡'.repeat(Math.max(0, 3 - (sn?.lives ?? 0)))}</span>
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

  if (frame?.game === 'pong' && room.game === 'pong') {
    const unit = Math.max(4, Math.floor(Math.min((vp.w - 64) / frame.w, (vp.h - 190) / frame.h)));
    return (
      <div className="tv playing">
        <div className="snake-scores">
          {frame.paddles.map((pd, i) => {
            const p = room.players.find((x) => x.id === pd.id);
            const color = p?.color ?? '#9aa0b4';
            return (
              <div key={i} className="snake-score" style={{ borderColor: color }}>
                <span className="badge" style={{ background: color }}>{p ? `J${room.players.indexOf(p) + 1}` : 'CPU'}</span>
                <span className="pname">{p?.name ?? 'Computador'}</span>
                <span className="score">{pd.score}</span>
              </div>
            );
          })}
        </div>
        <div className="board-wrap snake-wrap"><PongCourt frame={frame} players={room.players} unit={unit} /></div>
      </div>
    );
  }

  if (frame?.game === 'invaders' && room.game === 'invaders') {
    const unit = Math.max(4, Math.floor(Math.min((vp.w - 64) / frame.w, (vp.h - 190) / frame.h)));
    return (
      <div className="tv playing">
        <div className="snake-scores">
          {room.players.map((p, i) => {
            const sh = frame.ships.find((x) => x.id === p.id);
            const dead = !sh || sh.lives <= 0;
            return (
              <div key={p.id} className={'snake-score' + (dead ? ' dead' : '')} style={{ borderColor: p.color }}>
                <span className="badge" style={{ background: p.color }}>J{i + 1}</span>
                <span className="pname">{p.name}</span>
                <span className="lives">{'♥'.repeat(sh?.lives ?? 0) + '♡'.repeat(Math.max(0, 3 - (sh?.lives ?? 0)))}</span>
                <span className="score">{sh?.score ?? 0}</span>
              </div>
            );
          })}
          <div className="snake-score"><span className="pname">Onda</span><span className="score">{frame.wave}</span></div>
        </div>
        <div className="board-wrap snake-wrap"><InvadersField frame={frame} players={room.players} unit={unit} /></div>
      </div>
    );
  }

  if (frame?.game === 'pacman' && room.game === 'pacman') {
    const size = Math.max(8, Math.floor(Math.min((vp.w - 64) / frame.cols, (vp.h - 190) / frame.rows)));
    return (
      <div className="tv playing">
        <div className="snake-scores">
          {room.players.map((p, i) => {
            const pc = frame.pacs.find((x) => x.id === p.id);
            const dead = !pc || pc.lives <= 0;
            return (
              <div key={p.id} className={'snake-score' + (dead ? ' dead' : '')} style={{ borderColor: p.color }}>
                <span className="badge" style={{ background: p.color }}>J{i + 1}</span>
                <span className="pname">{p.name}</span>
                <span className="lives">{'♥'.repeat(pc?.lives ?? 0) + '♡'.repeat(Math.max(0, 3 - (pc?.lives ?? 0)))}</span>
                <span className="score">{pc?.score ?? 0}</span>
              </div>
            );
          })}
          <div className="snake-score"><span className="pname">Nível</span><span className="score">{frame.level}</span></div>
        </div>
        <div className="board-wrap snake-wrap"><PacmanMaze frame={frame} players={room.players} size={size} /></div>
      </div>
    );
  }

  if (frame?.game === 'bomberman' && room.game === 'bomberman') {
    const size = Math.max(8, Math.floor(Math.min((vp.w - 64) / frame.cols, (vp.h - 190) / frame.rows)));
    return (
      <div className="tv playing">
        <div className="snake-scores">
          {room.players.map((p, i) => {
            const bp = frame.players.find((x) => x.id === p.id);
            return (
              <div key={p.id} className={'snake-score' + (bp?.alive ? '' : ' dead')} style={{ borderColor: p.color }}>
                <span className="badge" style={{ background: p.color }}>J{i + 1}</span>
                <span className="pname">{p.name}</span>
                <span className="lives">{bp?.alive ? '♥' : '☠'}</span>
                <span className="score">{bp?.score ?? 0}</span>
              </div>
            );
          })}
          <div className="snake-score"><span className="pname">Tempo</span><span className="score">{frame.secondsLeft}s</span></div>
        </div>
        <div className="board-wrap snake-wrap"><BombermanArena frame={frame} players={room.players} size={size} /></div>
      </div>
    );
  }

  if (frame?.game === 'asteroids' && room.game === 'asteroids') {
    const w = Math.max(320, Math.floor(Math.min(vp.w - 64, (vp.h - 190) * (frame.w / frame.h))));
    const h = Math.floor(w * (frame.h / frame.w));
    return (
      <div className="tv playing">
        <div className="snake-scores">
          {room.players.map((p, i) => {
            const sh = frame.ships.find((x) => x.id === p.id);
            return (
              <div key={p.id} className={'snake-score' + (sh?.alive ? '' : ' dead')} style={{ borderColor: p.color }}>
                <span className="badge" style={{ background: p.color }}>J{i + 1}</span>
                <span className="pname">{p.name}</span>
                <span className="lives">{sh?.alive ? '▲'.repeat(sh.lives) : '☠'}</span>
                <span className="score">{sh?.score ?? 0}</span>
              </div>
            );
          })}
          <div className="snake-score"><span className="pname">Tempo</span><span className="score">{frame.secondsLeft}s</span></div>
        </div>
        <div className="board-wrap snake-wrap"><AsteroidsField frame={frame} players={room.players} w={w} h={h} /></div>
      </div>
    );
  }

  if (frame?.game === 'doodle' && room.game === 'doodle') {
    const n = Math.max(1, room.players.length);
    const h = Math.max(240, vp.h - 230);
    const w = Math.max(120, Math.min(Math.floor(h * 0.6), Math.floor(vp.w / n - 40)));
    return (
      <div className="tv playing">
        <div className="snake-scores">
          {room.players.map((p, i) => {
            const j = frame.jumpers.find((x) => x.id === p.id);
            return (
              <div key={p.id} className={'snake-score' + (j?.alive ? '' : ' dead')} style={{ borderColor: p.color }}>
                <span className="badge" style={{ background: p.color }}>J{i + 1}</span>
                <span className="pname">{p.name}</span>
                <span className="lives">{j?.alive ? '▲' : '☠'}</span>
                <span className="score">{j?.score ?? 0}</span>
              </div>
            );
          })}
          <div className="snake-score"><span className="pname">Tempo</span><span className="score">{frame.secondsLeft}s</span></div>
        </div>
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

  if (frame?.game === 'topgear' && room.game === 'topgear') {
    const n = Math.max(1, room.players.length);
    const w = Math.max(160, Math.min(520, Math.floor(vp.w / n - 40)));
    const h = Math.max(160, Math.min(Math.floor(w * 0.75), vp.h - 230));
    return (
      <div className="tv playing">
        <div className="snake-scores">
          {room.players.map((p, i) => {
            const c = frame.cars.find((x) => x.id === p.id);
            return (
              <div key={p.id} className="snake-score" style={{ borderColor: p.color }}>
                <span className="badge" style={{ background: p.color }}>J{i + 1}</span>
                <span className="pname">{p.name}</span>
                <span className="lives">{'⚡'.repeat(c?.charges ?? 0)}</span>
                <span className="score">{c?.finished ? `${c.place}º` : `${Math.round(((c?.z ?? 0) / frame.length) * 100)}%`}</span>
              </div>
            );
          })}
          <div className="snake-score"><span className="pname">Tempo</span><span className="score">{frame.secondsLeft}s</span></div>
        </div>
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
