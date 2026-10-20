import { useEffect, useState } from 'react';
import type { GameFrame, RoomState } from '@mpvg/shared';
import { connect, type AppSocket } from '../../lib/socket';

const SESSION_KEY = 'mpvg:tv';

/** Conecta a TV ao servidor, cria (ou retoma) a sala e acompanha estado e quadros da partida. */
export function useTvRoom() {
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [frame, setFrame] = useState<GameFrame | null>(null);
  const [online, setOnline] = useState(false);

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

  return { socket, room, frame, online };
}
