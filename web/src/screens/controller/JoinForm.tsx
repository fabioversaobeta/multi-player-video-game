import { useState } from 'react';

const ROOM_NOT_FOUND = 'Sala não encontrada.';

interface Props {
  code: string;
  name: string;
  error: string;
  onName: (name: string) => void;
  onEnter: () => void;
}

export function JoinForm({ code, name, error, onName, onEnter }: Props) {
  const [newCode, setNewCode] = useState('');
  return (
    <div className="phone center">
      <h1 className="logo small-logo">MULTI-PLAYER VIDEO GAME</h1>
      <p>Sala <strong className="code-inline">{code}</strong></p>
      <form onSubmit={(e) => { e.preventDefault(); onEnter(); }}>
        <input
          className="input" value={name} maxLength={12} placeholder="Seu nome" autoFocus
          onChange={(e) => onName(e.target.value)}
        />
        <button className="btn big-btn" type="submit">ENTRAR</button>
      </form>
      {error && <p className="warn">{error}</p>}
      {error === ROOM_NOT_FOUND && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const c = newCode.trim().toUpperCase();
            if (c) location.assign(`/j/${c}`);
          }}
        >
          <p className="small">Digite o código da sala exibido na TV:</p>
          <input
            className="input" value={newCode} maxLength={8} placeholder="Código da sala"
            autoCapitalize="characters" autoCorrect="off" spellCheck={false}
            onChange={(e) => setNewCode(e.target.value.replace(/[^A-Za-z]/g, ''))}
          />
          <button className="btn big-btn" type="submit" disabled={!newCode.trim()}>IR PARA A SALA</button>
        </form>
      )}
    </div>
  );
}
