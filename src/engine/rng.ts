// engine/rng.ts is the single source of randomness in the game.
// Pure function: the same arguments always give the same result.
export function rand01(seed: number, ...salts: (string | number)[]): number {
  let h = seed >>> 0;
  const str = salts.join('|');
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
