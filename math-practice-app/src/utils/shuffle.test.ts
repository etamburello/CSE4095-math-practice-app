import { describe, expect, it } from "vitest";
import { shuffle } from "./shuffle";

describe("shuffle", () => {
  it("keeps every item and changes order across seeds", () => {
    const original = [1, 2, 3, 4];
    const positions = new Set<number>();
    for (let seed = 1; seed <= 30; seed += 1) {
      let state = seed;
      const rng = () => {
        state = (state * 17 + 3) % 100;
        return state / 100;
      };
      const shuffled = shuffle(original, rng);
      expect(shuffled).toHaveLength(4);
      expect([...shuffled].sort()).toEqual([1, 2, 3, 4]);
      positions.add(shuffled.indexOf(4));
    }
    expect(positions.size).toBeGreaterThan(1);
  });
});
