import { TvView } from '../games/TvView';
import { useViewport } from '../lib/useViewport';
import { Lobby } from './tv/Lobby';
import { Results } from './tv/Results';
import { useTvRoom } from './tv/useTvRoom';

export function Tv() {
  const { socket, room, frame, online } = useTvRoom();
  const vp = useViewport();

  if (!room) {
    return (
      <div className="tv center">
        <h1 className="logo">MULTI-PLAYER VIDEO GAME</h1>
        <p>{online ? 'Criando sala…' : 'Conectando ao servidor…'}</p>
      </div>
    );
  }
  if (room.phase === 'lobby' || room.phase === 'countdown') return <Lobby room={room} socket={socket} viewportH={vp.h} />;
  if (room.phase === 'results') return <Results room={room} socket={socket} />;
  // o quadro pode ser do jogo anterior por um instante: só desenha quando bate com o jogo da sala
  if (!frame || frame.game !== room.game) return <div className="tv center"><p>Carregando partida…</p></div>;
  return <TvView frame={frame} room={room} vp={vp} />;
}
