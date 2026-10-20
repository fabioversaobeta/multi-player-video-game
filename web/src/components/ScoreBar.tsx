import type { ReactNode } from 'react';

/** Barra de placar no topo da partida (TV). */
export function ScoreBar({ children }: { children: ReactNode }) {
  return <div className="snake-scores">{children}</div>;
}

/** Corações cheios e vazios: `hearts(2)` → ♥♥♡. */
export const hearts = (lives: number, max = 3) => '♥'.repeat(lives) + '♡'.repeat(Math.max(0, max - lives));

/** Placar de um jogador (ou da CPU). */
export function PlayerScore({ color, badge, name, lives, score, dead, note }: {
  color: string; badge: string; name: string; score: ReactNode;
  lives?: string; dead?: boolean; note?: string;
}) {
  return (
    <div className={'snake-score' + (dead ? ' dead' : '')} style={{ borderColor: color }}>
      <span className="badge" style={{ background: color }}>{badge}</span>
      <span className="pname">{name}</span>
      {lives !== undefined && <span className="lives">{lives}</span>}
      <span className="score">{score}</span>
      {note && <span className="small">{note}</span>}
    </div>
  );
}

/** Placar sem jogador (onda, nível, tempo restante). */
export function StatScore({ label, value }: { label: string; value: ReactNode }) {
  return <div className="snake-score"><span className="pname">{label}</span><span className="score">{value}</span></div>;
}
