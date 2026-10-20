import { useEffect, useRef, useState } from 'react';
import type { GameId, InputAction, RoomState } from '@mpvg/shared';
import {
  playCountdown, playCrash, playDrop, playEat, playGameOver, playGo, playLineClear, unlockAudio,
} from '../../lib/sounds';
import { connect, type AppSocket } from '../../lib/socket';
import { addRecordOnce, getName, getRecords, resetRecords, saveName } from '../../lib/storage';

const tokenKey = (code: string) => `mpvg:token:${code}`;
const joinedKey = (code: string) => `mpvg:joined:${code}`;

/** Conexão do celular: entrar na sala, acompanhar o estado, tocar sons e guardar recordes. */
export function useController(code: string) {
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
    s.on('player:sfx', ({ kind, value }) => {
      if (kind === 'lines') playLineClear(value);
      else if (kind === 'eat') playEat();
      else if (kind === 'drop') playDrop();
      else playCrash();
    });
    // reconexão automática: se já entrou antes nesta sala, volta com o token
    s.on('connect', () => {
      if (nameRef.current && sessionStorage.getItem(joinedKey(code))) join(s);
    });
    return () => { s.disconnect(); };
  }, []);

  const me = room?.players.find((p) => p.id === playerId);
  const game = room?.game ?? 'tetris';

  // recordes mostrados são os do jogo escolhido na sala
  useEffect(() => { setRecords(getRecords(game)); }, [game]);

  // grava o recorde local quando a partida termina
  useEffect(() => {
    if (room?.phase === 'results' && me && room.ranking && room.matchId) {
      setRecords(addRecordOnce(room.game, room.matchId, me.name, me.score));
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

  /** Confirma o nome digitado e entra na sala. */
  const enter = () => {
    unlockAudio();
    const n = name.trim() || 'Jogador';
    setName(n);
    nameRef.current = n;
    saveName(n);
    sessionStorage.setItem(joinedKey(code), '1');
    if (socketRef.current) join(socketRef.current);
  };

  return {
    name, setName, joined, error, room, me, game, records,
    enter,
    send: (action: InputAction) => socketRef.current?.emit('player:input', { action }),
    pickGame: (id: GameId) => socketRef.current?.emit('room:game', { game: id }),
    setReady: (ready: boolean) => socketRef.current?.emit('player:ready', { ready }),
    clearRecords: () => { resetRecords(); setRecords([]); },
  };
}
