export type Rng = () => number;

export function randomInt(min: number, max: number, rng: Rng = Math.random): number {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  if (high < low) {
    return low;
  }
  return Math.floor(rng() * (high - low + 1)) + low;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function pickOne<T>(items: readonly T[], rng: Rng = Math.random): T {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty list");
  }
  return items[randomInt(0, items.length - 1, rng)];
}
