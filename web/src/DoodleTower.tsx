import { useEffect, useRef } from 'react';
import type { GameFrame } from '../../server/src/protocol';

type DoodleFrame = Extract<GameFrame, { game: 'doodle' }>;

/** Visão de um jogador. `w`/`h` = tamanho do canvas em pixels; o mundo é `frame.w` x `frame.h`. */
export function DoodleTower({ frame, jumperId, color, w, h }: { frame: DoodleFrame; jumperId: string; color: string; w: number; h: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    const me = frame.jumpers.find((j) => j.id === jumperId);
    if (!me) return;
    const k = w / frame.w;
    const sy = (y: number) => h - (y - me.cam) * (h / frame.h);

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#9fd8ff');
    sky.addColorStop(1, '#f4fbff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    // grade de caderno que rola com a câmera
    ctx.strokeStyle = 'rgba(80,120,200,0.18)';
    const step = 10 * (h / frame.h);
    for (let y = ((me.cam * (h / frame.h)) % step); y < h + step; y += step) {
      ctx.beginPath(); ctx.moveTo(0, h - y); ctx.lineTo(w, h - y); ctx.stroke();
    }

    const pw = frame.platformW * k;
    const th = Math.max(4, 2.4 * (h / frame.h));
    for (const p of me.platforms) {
      ctx.fillStyle = p.kind === 'moving' ? '#3b82f6' : p.kind === 'fragile' ? '#b5651d' : '#3aa655';
      const x = p.x * k;
      // a tela dá a volta: desenha também a cópia deslocada
      for (const ox of [0, -w, w]) ctx.fillRect(x - pw / 2 + ox, sy(p.y), pw, th);
    }

    // personagem (sprite simples: corpo, olhos e focinho olhando para o lado em que anda)
    const cx = me.x * k;
    const feet = sy(me.y);
    const bw = w * 0.085;
    const bh = bw * 1.1;
    for (const ox of [0, -w, w]) {
      const x = cx + ox;
      ctx.fillStyle = me.alive ? color : '#888';
      ctx.fillRect(x - bw / 2, feet - bh, bw, bh);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - bw * 0.3 + me.face * bw * 0.1, feet - bh * 0.85, bw * 0.22, bw * 0.22);
      ctx.fillRect(x + bw * 0.08 + me.face * bw * 0.1, feet - bh * 0.85, bw * 0.22, bw * 0.22);
      ctx.fillStyle = '#222';
      ctx.fillRect(x - bw * 0.22 + me.face * bw * 0.16, feet - bh * 0.8, bw * 0.1, bw * 0.12);
      ctx.fillRect(x + bw * 0.16 + me.face * bw * 0.16, feet - bh * 0.8, bw * 0.1, bw * 0.12);
      ctx.fillStyle = '#ffb02e';
      ctx.fillRect(x + (me.face > 0 ? bw / 2 : -bw / 2 - bw * 0.22), feet - bh * 0.55, bw * 0.22, bw * 0.18);
      ctx.fillStyle = '#111';
      ctx.fillRect(x - bw * 0.35, feet - bh * 0.12, bw * 0.2, bh * 0.12);
      ctx.fillRect(x + bw * 0.15, feet - bh * 0.12, bw * 0.2, bh * 0.12);
    }
  }, [frame, jumperId, color, w, h]);

  return <canvas ref={ref} width={w} height={h} className="board-canvas" />;
}
