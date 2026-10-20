import { useEffect, useRef } from 'react';
import type { GameFrame, PlayerInfo } from '../../server/src/protocol';

type InvadersFrame = Extract<GameFrame, { game: 'invaders' }>;

const ALIEN_COLORS = ['#ff3b6b', '#ffb300', '#ffb300', '#7cff6b']; // por linha, de cima para baixo

/** `unit` = pixels por unidade do campo. */
export function InvadersField({ frame, players, unit }: { frame: InvadersFrame; players: PlayerInfo[]; unit: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0b0b1c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // chão
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, (frame.shipY + frame.shipH) * unit, canvas.width, Math.max(2, unit * 0.3));
    // invasores: corpo + olhos + pernas
    for (const a of frame.aliens) {
      const x = (a.x - frame.alienW / 2) * unit;
      const y = (a.y - frame.alienH / 2) * unit;
      const w = frame.alienW * unit;
      const h = frame.alienH * unit;
      ctx.fillStyle = ALIEN_COLORS[a.row] ?? '#fff';
      ctx.fillRect(x, y, w, h * 0.75);
      ctx.fillRect(x + w * 0.1, y + h * 0.75, w * 0.18, h * 0.25);
      ctx.fillRect(x + w * 0.72, y + h * 0.75, w * 0.18, h * 0.25);
      ctx.fillStyle = '#0b0b1c';
      ctx.fillRect(x + w * 0.22, y + h * 0.2, w * 0.16, h * 0.25);
      ctx.fillRect(x + w * 0.62, y + h * 0.2, w * 0.16, h * 0.25);
    }
    // naves: trapézio + canhão na cor do jogador; pisca depois de levar tiro
    for (const sh of frame.ships) {
      if (sh.lives <= 0 || (sh.blink && Math.floor(performance.now() / 120) % 2 === 0)) continue;
      ctx.fillStyle = players.find((p) => p.id === sh.id)?.color ?? '#fff';
      const x = (sh.x - frame.shipW / 2) * unit;
      const y = (frame.shipY - frame.shipH / 2) * unit;
      ctx.fillRect(x, y + frame.shipH * unit * 0.4, frame.shipW * unit, frame.shipH * unit * 0.6);
      ctx.fillRect(sh.x * unit - unit * 0.5, y, unit, frame.shipH * unit * 0.5);
    }
    // tiros: brancos (jogadores) e vermelhos (invasores)
    for (const t of frame.shots) {
      ctx.fillStyle = t.enemy ? '#ff3b6b' : '#ffffff';
      ctx.fillRect((t.x - 0.4) * unit, (t.y - 1.2) * unit, 0.8 * unit, 2.4 * unit);
    }
  }, [frame, players, unit]);

  return <canvas ref={ref} width={frame.w * unit} height={frame.h * unit} className="board-canvas" />;
}
