let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/** Navegadores só liberam áudio após um gesto do usuário; chame em clique/tecla. */
export async function unlockAudio(): Promise<void> {
  const c = audio();
  if (c && c.state === 'suspended') await c.resume().catch(() => undefined);
}

export function audioBlocked(): boolean {
  return !ctx || ctx.state !== 'running';
}

function tone(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, vol: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

// Notas (Hz): C5 E5 G5 C6 E6 G6
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5, G6 = 1568;

/** Som por quantidade de linhas fechadas de uma vez: mais linhas = mais notas, mais agudo e mais festivo. */
export function playLineClear(count: number): void {
  const c = audio();
  if (!c || c.state !== 'running' || count < 1) return;
  const t = c.currentTime + 0.01;
  switch (Math.min(count, 4)) {
    case 1:
      tone(c, C6, t, 0.18, 'triangle', 0.25);
      break;
    case 2:
      tone(c, C5, t, 0.14, 'square', 0.15);
      tone(c, G5, t + 0.1, 0.22, 'square', 0.15);
      break;
    case 3:
      [C5, E5, G5].forEach((f, i) => tone(c, f, t + i * 0.09, 0.2, 'square', 0.15));
      tone(c, C6, t + 0.27, 0.3, 'triangle', 0.2);
      break;
    default:
      // TETRIS: arpejo ascendente + acorde final brilhante
      [C5, E5, G5, C6, E6].forEach((f, i) => tone(c, f, t + i * 0.07, 0.22, 'square', 0.14));
      [C6, E6, G6].forEach((f) => tone(c, f, t + 0.38, 0.6, 'triangle', 0.2));
  }
}

function ready(): AudioContext | null {
  const c = audio();
  return c && c.state === 'running' ? c : null;
}

/** Bip da contagem regressiva (3, 2, 1). */
export function playCountdown(): void {
  const c = ready();
  if (c) tone(c, 660, c.currentTime + 0.01, 0.25, 'square', 0.18);
}

/** Bip agudo e mais longo quando a partida começa. */
export function playGo(): void {
  const c = ready();
  if (!c) return;
  const t = c.currentTime + 0.01;
  tone(c, 1320, t, 0.5, 'square', 0.18);
  tone(c, 1760, t, 0.5, 'triangle', 0.15);
}

/** Fim de partida: notas descendentes. */
export function playGameOver(): void {
  const c = ready();
  if (!c) return;
  const t = c.currentTime + 0.01;
  [G5, E5, C5, 392, 261.63].forEach((f, i) => tone(c, f, t + i * 0.22, i === 4 ? 0.8 : 0.28, 'triangle', 0.22));
}

/** Comeu: bip curto e agudo. */
export function playEat(): void {
  const c = ready();
  if (c) tone(c, 880, c.currentTime + 0.01, 0.1, 'square', 0.15);
}

/** Bateu: tom grave descendente. */
export function playCrash(): void {
  const c = ready();
  if (!c) return;
  const t = c.currentTime + 0.01;
  tone(c, 220, t, 0.15, 'sawtooth', 0.2);
  tone(c, 140, t + 0.12, 0.3, 'sawtooth', 0.2);
}
