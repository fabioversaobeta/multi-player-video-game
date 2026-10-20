import type { CSSProperties } from 'react';
import { GamePad } from './controller/GamePad';
import { JoinForm } from './controller/JoinForm';
import { LobbyPhone } from './controller/LobbyPhone';
import { ResultsPhone } from './controller/ResultsPhone';
import { useController } from './controller/useController';

export function Controller({ code }: { code: string }) {
  const c = useController(code);
  const { room, me, game } = c;

  if (!c.joined) {
    return <JoinForm code={code} name={c.name} error={c.error} onName={c.setName} onEnter={c.enter} />;
  }
  if (!room || !me) {
    return <div className="phone center"><p>{room ? 'Você não está nesta partida.' : 'Conectando…'}</p></div>;
  }

  const style = { '--pc': me.color } as CSSProperties;

  if (room.phase === 'lobby' || room.phase === 'countdown') {
    return (
      <LobbyPhone
        room={room} me={me} records={c.records} style={style}
        onPickGame={c.pickGame} onReady={c.setReady} onClearRecords={c.clearRecords}
      />
    );
  }
  if (room.phase === 'results') return <ResultsPhone room={room} me={me} style={style} send={c.send} />;
  return <GamePad room={room} me={me} game={game} style={style} send={c.send} />;
}
