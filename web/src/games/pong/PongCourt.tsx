import { useEffect, useRef } from 'react';
import type { GameFrame, PlayerInfo } from '../../../../server/src/protocol';

type PongFrame = Extract<GameFrame, { game: 'pong' }>;

/** `unit` = pixels por unidade do campo. */
export function PongCourt({ frame, players, unit }: { frame: PongFrame; players: PlayerInfo[]; unit: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const { w, h } = frame;
    ctx.fillStyle = '#1a1a33';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = Math.max(2, unit * 0.5);
    ctx.setLineDash([unit * 2, unit * 2]);
    ctx.beginPath(); ctx.moveTo((w / 2) * unit, 0); ctx.lineTo((w / 2) * unit, h * unit); ctx.stroke();
    ctx.setLineDash([]);
    for (const p of frame.paddles) {
      ctx.fillStyle = players.find((x) => x.id === p.id)?.color ?? '#9aa0b4'; // CPU: cinza
      ctx.fillRect((p.x - 1) * unit, (p.y - frame.paddleH / 2) * unit, 2 * unit, frame.paddleH * unit);
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(frame.ball.x * unit, frame.ball.y * unit, unit, 0, Math.PI * 2);
    ctx.fill();
  }, [frame, players, unit]);

  return <canvas ref={ref} width={frame.w * unit} height={frame.h * unit} className="board-canvas" />;
}
