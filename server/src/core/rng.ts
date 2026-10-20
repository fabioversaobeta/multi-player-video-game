// RNG determinístico (mulberry32). Devolve [valor em 0..1, novo estado da semente].
export function nextRandom(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) >>> 0;
  const state = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, state];
}
