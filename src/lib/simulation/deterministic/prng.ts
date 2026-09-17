/**
 * Gerador pseudo-aleatório determinístico (Mulberry32).
 * Garante que a mesma semente + tick produz os mesmos resultados.
 */
export function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashTickSeed(baseSeed: number, tick: number): number {
  return (baseSeed ^ (tick * 2654435761)) >>> 0;
}
