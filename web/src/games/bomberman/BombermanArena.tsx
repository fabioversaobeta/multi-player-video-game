import { useEffect, useRef } from 'react';
import type { GameFrame, PlayerInfo } from '@mpvg/shared';

type BombermanFrame = Extract<GameFrame, { game: 'bomberman' }>;

/** `size` = pixels por casa. */
export function BombermanArena({ frame, players, size }: { frame: BombermanFrame; players: PlayerInfo[]; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const now = performance.now();
    ctx.fillStyle = '#1d6b2f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    frame.grid.forEach((row, y) => {
      [...row].forEach((c, x) => {
        const px = x * size;
        const py = y * size;
        if (c === '#') {
          ctx.fillStyle = '#5b6070';
          ctx.fillRect(px, py, size, size);
          ctx.fillStyle = '#8a90a3';
          ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
        } else if (c === 'B') {
          ctx.fillStyle = '#b5651d';
          ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
          ctx.strokeStyle = '#7a420f';
          ctx.strokeRect(px + 3, py + 3, size - 6, size - 6);
        }
      });
    });

    for (const f of frame.flames) {
      ctx.fillStyle = '#ff8a00';
      ctx.fillRect(f.x * size + 2, f.y * size + 2, size - 4, size - 4);
      ctx.fillStyle = '#ffe14d';
      ctx.fillRect(f.x * size + size * 0.28, f.y * size + size * 0.28, size * 0.44, size * 0.44);
    }

    for (const b of frame.bombs) {
      const pulse = 1 + 0.08 * Math.sin(now / (b.urgent ? 50 : 150));
      ctx.fillStyle = b.urgent && Math.floor(now / 100) % 2 === 0 ? '#ff3b3b' : '#111';
      ctx.beginPath();
      ctx.arc((b.x + 0.5) * size, (b.y + 0.55) * size, size * 0.36 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd24d';
      ctx.fillRect((b.x + 0.55) * size, (b.y + 0.08) * size, size * 0.1, size * 0.2);
    }

    // jogadores: corpo na cor do jogador, rosto claro
    for (const p of frame.players) {
      if (!p.alive) continue;
      const cx = (p.x + 0.5) * size;
      const cy = (p.y + 0.5) * size;
      ctx.fillStyle = players.find((q) => q.id === p.id)?.color ?? '#fff';
      ctx.beginPath(); ctx.arc(cx, cy + size * 0.06, size * 0.38, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe8cc';
      ctx.beginPath(); ctx.arc(cx, cy - size * 0.06, size * 0.26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.fillRect(cx - size * 0.15, cy - size * 0.12, size * 0.08, size * 0.14);
      ctx.fillRect(cx + size * 0.07, cy - size * 0.12, size * 0.08, size * 0.14);
    }
  }, [frame, players, size]);

  return <canvas ref={ref} width={frame.cols * size} height={frame.rows * size} className="board-canvas" />;
}
