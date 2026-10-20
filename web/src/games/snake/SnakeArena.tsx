import { useEffect, useRef } from 'react';
import type { GameFrame, PlayerInfo } from '@mpvg/shared';

type SnakeFrame = Extract<GameFrame, { game: 'snake' }>;

export function SnakeArena({ frame, players, size }: { frame: SnakeFrame; players: PlayerInfo[]; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const { cols, rows } = frame;
    ctx.fillStyle = '#1a1a33'; // campo mais claro que o fundo da página
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.lineWidth = 1;
    for (let i = 1; i < cols; i++) {
      ctx.beginPath(); ctx.moveTo(i * size, 0); ctx.lineTo(i * size, rows * size); ctx.stroke();
    }
    for (let i = 1; i < rows; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * size); ctx.lineTo(cols * size, i * size); ctx.stroke();
    }
    // borda do tabuleiro: é um portal (a cobra reaparece do lado oposto), não uma parede
    const wall = Math.max(3, Math.round(size * 0.14));
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = wall;
    ctx.strokeRect(wall / 2, wall / 2, cols * size - wall, rows * size - wall);
    ctx.fillStyle = '#ffffff'; // branco: nenhuma cor de jogador é branca
    for (const [x, y] of frame.foods) {
      ctx.beginPath();
      ctx.arc(x * size + size / 2, y * size + size / 2, size * 0.36, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const sn of frame.snakes) {
      const color = players.find((p) => p.id === sn.id)?.color ?? '#fff';
      sn.cells.forEach(([x, y], i) => {
        ctx.fillStyle = color;
        ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
        if (i === 0) { // cabeça com "olho" para distinguir a frente
          ctx.fillStyle = '#000';
          ctx.fillRect(x * size + size * 0.35, y * size + size * 0.35, size * 0.3, size * 0.3);
        }
      });
    }
  }, [frame, players, size]);

  return <canvas ref={ref} width={frame.cols * size} height={frame.rows * size} className="board-canvas" />;
}
