import { useEffect, useRef } from 'react';
import type { BoardFrame } from '../../server/src/protocol';

const COLS = 10;
const ROWS = 20;
// I O T S Z J L
export const PIECE_COLORS = ['', '#00e5ff', '#ffe600', '#b04dff', '#39e639', '#ff3b3b', '#3b6bff', '#ff9a1f'];

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(x, y, size, 3);
  ctx.fillRect(x, y, 3, size);
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.fillRect(x, y + size - 3, size, 3);
  ctx.fillRect(x + size - 3, y, 3, size);
}

export function Board({ frame, size }: { frame: BoardFrame; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#05050c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let i = 1; i < COLS; i++) {
      ctx.beginPath(); ctx.moveTo(i * size, 0); ctx.lineTo(i * size, ROWS * size); ctx.stroke();
    }
    for (let i = 1; i < ROWS; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * size); ctx.lineTo(COLS * size, i * size); ctx.stroke();
    }
    frame.cells.forEach((v, i) => {
      if (v) drawCell(ctx, (i % COLS) * size, Math.floor(i / COLS) * size, size, PIECE_COLORS[v]);
    });
  }, [frame, size]);

  return <canvas ref={ref} width={COLS * size} height={ROWS * size} className="board-canvas" />;
}
