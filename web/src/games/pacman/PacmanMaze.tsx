import { useEffect, useRef } from 'react';
import type { GameFrame, PlayerInfo } from '@mpvg/shared';

type PacmanFrame = Extract<GameFrame, { game: 'pacman' }>;

const GHOST_COLORS = ['#ff3b3b', '#ff9ad5', '#3be6ff', '#ffb347'];
// ângulo (rad) para onde a boca aponta, por `face`: cima, direita, baixo, esquerda
const FACE_ANGLE = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

/** `size` = pixels por casa. */
export function PacmanMaze({ frame, players, size }: { frame: PacmanFrame; players: PlayerInfo[]; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0b0b1c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const now = performance.now();

    frame.grid.forEach((row, y) => {
      [...row].forEach((c, x) => {
        const px = x * size;
        const py = y * size;
        if (c === '#') {
          ctx.fillStyle = '#1b2cc7';
          ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
        } else if (c === '.') {
          ctx.fillStyle = '#ffd9a8';
          ctx.fillRect(px + size * 0.42, py + size * 0.42, size * 0.16, size * 0.16);
        } else if (c === 'o' && Math.floor(now / 250) % 2 === 0) {
          ctx.fillStyle = '#ffd9a8';
          ctx.beginPath(); ctx.arc(px + size / 2, py + size / 2, size * 0.28, 0, Math.PI * 2); ctx.fill();
        } else if (c === 'H' && y === 8) { // portão da casa dos fantasmas
          ctx.fillStyle = '#ff9ad5';
          ctx.fillRect(px, py + size * 0.42, size, size * 0.16);
        }
      });
    });

    // jogadores: boca abrindo e fechando; piscam depois de perder uma vida
    frame.pacs.forEach((p) => {
      if (p.lives <= 0 || (p.blink && Math.floor(now / 120) % 2 === 0)) return;
      const open = (0.1 + 0.22 * Math.abs(Math.sin(now / 90))) * Math.PI;
      const a = FACE_ANGLE[p.face] ?? Math.PI;
      ctx.fillStyle = players.find((x) => x.id === p.id)?.color ?? '#ffe600';
      ctx.beginPath();
      ctx.moveTo((p.x + 0.5) * size, (p.y + 0.5) * size);
      ctx.arc((p.x + 0.5) * size, (p.y + 0.5) * size, size * 0.46, a + open, a - open + Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    });

    // fantasmas: cúpula + saia ondulada; azuis quando assustados (piscam no fim)
    for (const g of frame.ghosts) {
      const x = g.x * size;
      const y = g.y * size;
      const white = frame.flash && Math.floor(now / 150) % 2 === 0;
      ctx.fillStyle = g.scared ? (white ? '#ffffff' : '#2a3cff') : GHOST_COLORS[g.kind % 4];
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size * 0.5, size * 0.44, Math.PI, 0);
      ctx.lineTo(x + size * 0.94, y + size * 0.95);
      for (let i = 0; i < 3; i++) {
        ctx.lineTo(x + size * (0.94 - (i + 0.5) * 0.293), y + size * 0.78);
        ctx.lineTo(x + size * (0.94 - (i + 1) * 0.293), y + size * 0.95);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = g.scared ? '#ffd9a8' : '#ffffff';
      ctx.fillRect(x + size * 0.28, y + size * 0.32, size * 0.16, size * 0.2);
      ctx.fillRect(x + size * 0.58, y + size * 0.32, size * 0.16, size * 0.2);
    }
  }, [frame, players, size]);

  return <canvas ref={ref} width={frame.cols * size} height={frame.rows * size} className="board-canvas" />;
}
