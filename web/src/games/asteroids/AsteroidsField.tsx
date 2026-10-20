import { useEffect, useRef } from 'react';
import type { GameFrame, PlayerInfo } from '../../../../server/src/protocol';

type AsteroidsFrame = Extract<GameFrame, { game: 'asteroids' }>;

/** Arena única; `w`/`h` = tamanho do canvas em pixels, o mundo é `frame.w` x `frame.h` (y para cima). */
export function AsteroidsField({ frame, players, w, h }: { frame: AsteroidsFrame; players: PlayerInfo[]; w: number; h: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    const k = w / frame.w;
    const colorOf = (id: string) => players.find((p) => p.id === id)?.color ?? '#fff';
    const blink = Math.floor(performance.now() / 100) % 2 === 0;

    ctx.fillStyle = '#05060f';
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 1.5;

    // as peças que cruzam a borda aparecem também do outro lado
    const copies = (x: number, y: number, r: number, draw: (px: number, py: number) => void) => {
      const px = x * k, py = h - y * k, pr = r * k;
      for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) {
        if (px + ox > -pr * 2 && px + ox < w + pr * 2 && py + oy > -pr * 2 && py + oy < h + pr * 2) draw(px + ox, py + oy);
      }
    };

    ctx.strokeStyle = '#c9ccd6';
    for (const r of frame.rocks) {
      copies(r.x, r.y, r.r, (px, py) => {
        const rr = r.r * k;
        ctx.beginPath();
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2;
          const rad = rr * (0.8 + 0.2 * Math.sin(i * 2.3 + r.r)); // contorno irregular, estável por tamanho
          const x = px + Math.cos(a) * rad, y = py + Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      });
    }

    for (const b of frame.bullets) {
      ctx.fillStyle = colorOf(b.owner);
      copies(b.x, b.y, 1, (px, py) => { ctx.beginPath(); ctx.arc(px, py, Math.max(2, k * 0.6), 0, Math.PI * 2); ctx.fill(); });
    }

    for (const s of frame.ships) {
      if (!s.alive) continue;
      if (s.invuln && !blink) continue; // pisca enquanto invulnerável
      const color = colorOf(s.id);
      const sr = frame.shipR * k * 1.6;
      copies(s.x, s.y, sr, (px, py) => {
        const pt = (a: number, d: number) => [px + Math.cos(-s.angle + a) * d, py + Math.sin(-s.angle + a) * d];
        // y do canvas é invertido: o ângulo do mundo vira -angle
        const nose = pt(0, sr), l = pt(2.5, sr * 0.9), t = pt(Math.PI, sr * 0.35), r = pt(-2.5, sr * 0.9);
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(nose[0], nose[1]); ctx.lineTo(l[0], l[1]); ctx.lineTo(t[0], t[1]); ctx.lineTo(r[0], r[1]); ctx.closePath();
        ctx.stroke();
        if (s.thrusting) {
          const f = pt(Math.PI, sr * 1.3);
          ctx.strokeStyle = '#ffb02e';
          ctx.beginPath(); ctx.moveTo(t[0], t[1]); ctx.lineTo(f[0], f[1]); ctx.stroke();
        }
      });
    }
  }, [frame, players, w, h]);

  return <canvas ref={ref} width={w} height={h} className="board-canvas" />;
}
