import { describe, expect, it } from "vitest";
import { createId } from "./ids";

describe("createId", () => {
  it("returns unique non-empty ids", () => {
    const ids = new Set(Array.from({ length: 20 }, () => createId()));
    expect(ids.size).toBe(20);
    for (const id of ids) {
      expect(id.length).toBeGreaterThan(8);
    }
  });
});
