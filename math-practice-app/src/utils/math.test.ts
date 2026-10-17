import { describe, expect, it } from "vitest";
import { createRng, randomInt } from "./math";

describe("randomInt", () => {
  it("stays inside the requested bounds", () => {
    const rng = createRng(7);
    for (let index = 0; index < 100; index += 1) {
      const value = randomInt(0, 10, rng);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(10);
    }
  });

  it("can return the minimum and maximum", () => {
    expect(randomInt(3, 8, () => 0)).toBe(3);
    expect(randomInt(3, 8, () => 0.999)).toBe(8);
  });
});
