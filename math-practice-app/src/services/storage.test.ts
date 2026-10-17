import { describe, expect, it } from "vitest";
import {
  STORAGE_KEYS,
  clearAllData,
  clearPracticeHistory,
  loadAll,
  saveAll,
} from "../services/storageService";
import { DEFAULT_SETTINGS } from "../types/settings";
import { createEmptyStatistics } from "../types/statistics";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe("storage", () => {
  it("round-trips settings and keeps unrelated keys", () => {
    const storage = memoryStorage();
    storage.setItem("otherApp", "keep-me");
    const warning = saveAll(storage, {
      settings: { ...DEFAULT_SETTINGS, soundEffects: false },
      sessions: [],
      attempts: [],
      mistakePatterns: [],
      statistics: createEmptyStatistics(),
      activeSession: null,
    });
    expect(warning).toBeNull();
    const loaded = loadAll(storage);
    expect(loaded.settings.soundEffects).toBe(false);
    expect(storage.getItem("otherApp")).toBe("keep-me");
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.version) ?? "{}")).toEqual({ version: 1 });
  });

  it("resets only the broken category", () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEYS.settings, "{");
    storage.setItem(
      STORAGE_KEYS.attempts,
      JSON.stringify([
        {
          id: "a",
          questionId: "q",
          operation: "addition",
          firstOperand: 1,
          secondOperand: 1,
          correctAnswer: 2,
          selectedAnswer: 2,
          selfReportedCorrect: true,
          difficulty: 1,
          source: "regular",
          attemptedAt: "2024-01-01T00:00:00.000Z",
          sessionId: "s",
        },
        { bad: true },
      ]),
    );
    const loaded = loadAll(storage);
    expect(loaded.settings.soundEffects).toBe(DEFAULT_SETTINGS.soundEffects);
    expect(loaded.attempts).toHaveLength(1);
    expect(loaded.warning).toBeTruthy();
  });

  it("clears practice history without removing the version key", () => {
    const storage = memoryStorage();
    saveAll(storage, {
      settings: DEFAULT_SETTINGS,
      sessions: [],
      attempts: [],
      mistakePatterns: [],
      statistics: createEmptyStatistics(),
      activeSession: null,
    });
    clearPracticeHistory(storage);
    expect(storage.getItem(STORAGE_KEYS.attempts)).toBeNull();
    expect(loadAll(storage).settings.defaultDifficulty).toBe(1);
    clearAllData(storage);
    expect(loadAll(storage).settings).toEqual(DEFAULT_SETTINGS);
  });

  it("reports a warning when storage cannot be written", () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new Error("full");
    };
    const warning = saveAll(storage, {
      settings: DEFAULT_SETTINGS,
      sessions: [],
      attempts: [],
      mistakePatterns: [],
      statistics: createEmptyStatistics(),
      activeSession: null,
    });
    expect(warning).toMatch(/could not save/i);
  });
});
