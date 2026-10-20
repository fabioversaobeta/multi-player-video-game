import { useEffect, useRef } from 'react';
import type { GameFrame, PlayerInfo } from '../../../../server/src/protocol';

type TopGearFrame = Extract<GameFrame, { game: 'topgear' }>;

const CAM_BACK = 10; // a câmera fica 10 unidades atrás do carro
const VIEW = 400; // alcance da visão
const CURVE_K = 7.5e-5; // quanto a curva entorta a estrada na tela

function drawCar(ctx: CanvasRenderingContext2D, cx: number, yBottom: number, width: number, color: string, turbo = false) {
  const hgt = width * 0.55;
  const top = yBottom - hgt;
  const wheel = width * 0.2;
  if (turbo) {
    ctx.fillStyle = '#ffb02e';
    ctx.fillRect(cx - width * 0.28, yBottom, width * 0.18, hgt * 0.5);
    ctx.fillRect(cx + width * 0.1, yBottom, width * 0.18, hgt * 0.5);
  }
  ctx.fillStyle = '#111';
  ctx.fillRect(cx - width / 2, yBottom - hgt * 0.5, wheel, hgt * 0.5);
  ctx.fillRect(cx + width / 2 - wheel, yBottom - hgt * 0.5, wheel, hgt * 0.5);
  ctx.fillStyle = color;
  ctx.fillRect(cx - width * 0.46, top + hgt * 0.25, width * 0.92, hgt * 0.6);
  ctx.fillRect(cx - width * 0.3, top, width * 0.6, hgt * 0.4);
  ctx.fillStyle = '#9fd8ff';
  ctx.fillRect(cx - width * 0.22, top + hgt * 0.07, width * 0.44, hgt * 0.22);
  ctx.fillStyle = '#ff3b3b';
  ctx.fillRect(cx - width * 0.44, top + hgt * 0.5, width * 0.14, hgt * 0.14);
  ctx.fillRect(cx + width * 0.3, top + hgt * 0.5, width * 0.14, hgt * 0.14);
}

/** Visão de um piloto em pseudo-3D. `w`/`h` = tamanho do canvas em pixels. */
export function TopGearRoad({ frame, carId, players, w, h }: { frame: TopGearFrame; carId: string; players: PlayerInfo[]; w: number; h: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const me = frame.cars.find((c) => c.id === carId);
    if (!me) return;
    const hor = Math.floor(h * 0.38);
    const camZ = me.z - CAM_BACK;
    const curveAt = (z: number) => frame.curves[Math.max(0, Math.min(frame.curves.length - 1, Math.floor(z / frame.segLen)))];

    const sky = ctx.createLinearGradient(0, 0, 0, hor);
    sky.addColorStop(0, '#2b6cd9');
    sky.addColorStop(1, '#bfe3ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, hor + 1);

    const center = new Float32Array(h);
    const half = new Float32Array(h);
    let dx = 0;
    let off = 0;
    let prevD = CAM_BACK;
    for (let y = h - 1; y > hor; y--) {
      const p = (y - hor) / (h - hor);
      const d = CAM_BACK / p;
      const z = camZ + d;
      const dd = d - prevD;
      prevD = d;
      dx += curveAt(z) * dd * CURVE_K;
      off += dx * dd;
      const hw = p * w * 0.45;
      const cx = w / 2 + (off - me.x) * hw;
      center[y] = cx;
      half[y] = hw;

      const band = Math.floor(z / 12) % 2 === 0;
      ctx.fillStyle = band ? '#2e8b3a' : '#37a345';
      ctx.fillRect(0, y, w, 1);
      ctx.fillStyle = band ? '#d8d8d8' : '#c43d3d';
      ctx.fillRect(cx - hw * 1.12, y, hw * 2.24, 1);
      if (z >= frame.length && z < frame.length + 8) {
        const tile = hw / 3;
        for (let k = -6; k < 6; k++) {
          ctx.fillStyle = (k + Math.floor(z / 2)) % 2 === 0 ? '#fff' : '#111';
          ctx.fillRect(cx + k * tile * 0.5, y, tile * 0.5 + 1, 1);
        }
        continue;
      }
      ctx.fillStyle = band ? '#585a63' : '#62646e';
      ctx.fillRect(cx - hw, y, hw * 2, 1);
      if (band) {
        ctx.fillStyle = '#f2f2f2';
        ctx.fillRect(cx - hw * 0.02, y, hw * 0.04, 1);
      }
    }

    // carros parados e outros pilotos, do mais longe para o mais perto
    const sprites: { dz: number; x: number; color: string; turbo: boolean }[] = [];
    frame.obstacles.forEach((o, i) => sprites.push({ dz: o.z - camZ, x: o.x, color: i % 2 ? '#e0a000' : '#7a5cff', turbo: false }));
    for (const c of frame.cars) {
      if (c.id === carId) continue;
      sprites.push({ dz: c.z - camZ, x: c.x, color: players.find((p) => p.id === c.id)?.color ?? '#fff', turbo: c.turbo });
    }
    sprites.sort((a, b) => b.dz - a.dz);
    for (const s of sprites) {
      if (s.dz <= CAM_BACK || s.dz > VIEW) continue;
      const p = CAM_BACK / s.dz;
      const y = Math.min(h - 1, Math.round(hor + p * (h - hor)));
      if (y <= hor) continue;
      drawCar(ctx, center[y] + s.x * half[y], y, half[y] * 0.3, s.color, s.turbo);
    }

    // o carro do próprio piloto, sempre na parte de baixo
    if (!me.blink || Math.floor(performance.now() / 80) % 2 === 0) {
      drawCar(ctx, w / 2, h - 6, w * 0.15, players.find((p) => p.id === carId)?.color ?? '#fff', me.turbo);
    }
  }, [frame, carId, players, w, h]);

  return <canvas ref={ref} width={w} height={h} className="board-canvas" />;
}
