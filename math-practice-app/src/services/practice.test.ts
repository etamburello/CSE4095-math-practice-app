import { describe, expect, it } from "vitest";
import { generateSimilarQuestion } from "../services/similarQuestionGenerator";
import {
  applyReviewOutcome,
  mostMissedOperations,
  prioritizePatterns,
  topMissedFacts,
  upsertIncorrectPattern,
} from "../services/mistakeService";
import { buildResult, createSession } from "../services/practiceService";
import { accuracy, recordAttemptStats } from "../services/statisticsService";
import type { MistakePattern } from "../types/mistake";
import type { Question } from "../types/question";
import { createEmptyStatistics } from "../types/statistics";
import { isValidQuestion } from "../utils/validation";

function pattern(overrides: Partial<MistakePattern> = {}): MistakePattern {
  return {
    id: "pattern-1",
    operation: "multiplication",
    firstOperand: 8,
    secondOperand: 7,
    correctAnswer: 56,
    difficulty: 2,
    incorrectCount: 1,
    similarCorrectCount: 0,
    lastIncorrectAt: "2024-01-01T00:00:00.000Z",
    mastered: false,
    ...overrides,
  };
}

function question(overrides: Partial<Question> = {}): Question {
  return {
    id: "question-1",
    operation: "addition",
    firstOperand: 2,
    secondOperand: 3,
    displayText: "2 + 3",
    correctAnswer: 5,
    choices: [5, 4, 6, 7],
    difficulty: 1,
    source: "regular",
    ...overrides,
  };
}

describe("similar questions", () => {
  it("labels a related question for every operation", () => {
    const patterns = [
      pattern(),
      pattern({
        id: "add",
        operation: "addition",
        firstOperand: 8,
        secondOperand: 7,
        correctAnswer: 15,
      }),
      pattern({
        id: "sub",
        operation: "subtraction",
        firstOperand: 9,
        secondOperand: 4,
        correctAnswer: 5,
      }),
      pattern({
        id: "div",
        operation: "division",
        firstOperand: 42,
        secondOperand: 6,
        correctAnswer: 7,
      }),
    ];
    for (const item of patterns) {
      const similar = generateSimilarQuestion(item, { rng: () => 0.2 });
      expect(similar.source).toBe("mistake-review");
      expect(similar.mistakePatternId).toBe(item.id);
      expect(isValidQuestion(similar)).toBe(true);
    }
  });

  it("reverses addition and multiplication, not subtraction", () => {
    const reversed = generateSimilarQuestion(
      pattern({ operation: "addition", firstOperand: 8, secondOperand: 3, correctAnswer: 11 }),
      {
        strategy: "reversed",
        rng: () => 0.1,
      },
    );
    expect(reversed.operation).toBe("addition");
    expect(reversed.firstOperand).toBe(3);
    expect(reversed.secondOperand).toBe(8);

    const product = generateSimilarQuestion(pattern(), { strategy: "reversed", rng: () => 0.1 });
    expect(product.operation).toBe("multiplication");
    expect(product.firstOperand).toBe(7);
    expect(product.secondOperand).toBe(8);

    const subtraction = generateSimilarQuestion(
      pattern({
        operation: "subtraction",
        firstOperand: 9,
        secondOperand: 4,
        correctAnswer: 5,
      }),
      { strategy: "reversed", rng: () => 0.1 },
    );
    expect(
      subtraction.operation === "subtraction" &&
        subtraction.firstOperand < subtraction.secondOperand,
    ).toBe(false);
  });

  it("can use a fact family", () => {
    const related = generateSimilarQuestion(pattern(), { strategy: "fact-family", rng: () => 0.1 });
    expect(related.operation).toBe("division");
    expect(related.firstOperand).toBe(56);
  });
});

describe("mistake patterns", () => {
  it("creates and updates one pattern for the same question", () => {
    const created = upsertIncorrectPattern([], question(), "2024-02-01T00:00:00.000Z");
    expect(created).toHaveLength(1);
    expect(created[0]?.incorrectCount).toBe(1);
    const updated = upsertIncorrectPattern(created, question(), "2024-03-01T00:00:00.000Z");
    expect(updated).toHaveLength(1);
    expect(updated[0]?.incorrectCount).toBe(2);
    expect(updated[0]?.mastered).toBe(false);
    expect(updated[0]?.similarCorrectCount).toBe(0);
  });

  it("masters a pattern after three correct reviews and reopens it after a miss", () => {
    let current = pattern();
    current = applyReviewOutcome(current, true, 3, "2024-04-01T00:00:00.000Z");
    current = applyReviewOutcome(current, true, 3, "2024-04-02T00:00:00.000Z");
    expect(current.mastered).toBe(false);
    current = applyReviewOutcome(current, true, 3, "2024-04-03T00:00:00.000Z");
    expect(current.mastered).toBe(true);
    expect(current.similarCorrectCount).toBe(3);
    current = applyReviewOutcome(current, false, 3, "2024-05-01T00:00:00.000Z");
    expect(current.mastered).toBe(false);
    expect(current.similarCorrectCount).toBe(0);
    expect(current.incorrectCount).toBe(2);
  });

  it("prioritizes frequent recent misses and shuffles equal scores", () => {
    const quiet = pattern({ id: "quiet", incorrectCount: 1, similarCorrectCount: 2 });
    const loud = pattern({
      id: "loud",
      incorrectCount: 5,
      similarCorrectCount: 0,
      lastIncorrectAt: "2024-06-01T00:00:00.000Z",
    });
    const now = Date.parse("2024-06-02T00:00:00.000Z");
    expect(prioritizePatterns([quiet, loud], () => 0, now)[0]?.id).toBe("loud");

    const tiedA = pattern({ id: "a" });
    const tiedB = pattern({ id: "b" });
    const forward = prioritizePatterns([tiedA, tiedB], () => 0, now).map((item) => item.id);
    const backward = prioritizePatterns([tiedA, tiedB], () => 0.99, now).map((item) => item.id);
    expect(forward).not.toEqual(backward);
  });

  it("names the most missed operation and sorts facts", () => {
    const patterns = [
      pattern({ id: "one", incorrectCount: 2 }),
      pattern({ id: "two", operation: "addition", incorrectCount: 2 }),
      pattern({ id: "three", incorrectCount: 4, lastIncorrectAt: "2024-01-02T00:00:00.000Z" }),
    ];
    expect(mostMissedOperations(patterns)).toEqual(["multiplication"]);
    expect(topMissedFacts(patterns)[0]?.id).toBe("three");
    expect(mostMissedOperations([])).toEqual([]);
  });
});

describe("statistics", () => {
  it("handles zero attempts and records operation and difficulty totals", () => {
    expect(accuracy(0, 0)).toBe(0);
    const attempt = {
      id: "a",
      questionId: "q",
      operation: "division" as const,
      firstOperand: 8,
      secondOperand: 2,
      correctAnswer: 4,
      selectedAnswer: 4,
      selfReportedCorrect: true,
      difficulty: 2 as const,
      source: "regular" as const,
      attemptedAt: "2024-01-01T00:00:00.000Z",
      sessionId: "s",
    };
    const stats = recordAttemptStats(createEmptyStatistics(), attempt);
    expect(stats.attempted).toBe(1);
    expect(stats.correct).toBe(1);
    expect(stats.incorrect).toBe(0);
    expect(stats.byOperation.division.correct).toBe(1);
    expect(stats.byDifficulty[2].attempted).toBe(1);
    expect(accuracy(1, 1)).toBe(100);
  });
});

describe("practice results", () => {
  it("counts an attempt once and finishes a fixed session", () => {
    const session = createSession(
      { operations: ["addition"], difficulty: 1, sessionLength: 5, mode: "regular" },
      "2024-01-01T00:00:00.000Z",
    );
    session.attempted = 4;
    const first = buildResult(
      {
        session,
        question: question(),
        selectedAnswer: 4,
        attempts: [],
        mistakePatterns: [],
        statistics: createEmptyStatistics(),
        masteryThreshold: 3,
      },
      false,
      "2024-01-01T00:01:00.000Z",
    );
    expect(first?.finished).toBe(true);
    expect(first?.session.incorrect).toBe(1);
    expect(first?.mistakePatterns).toHaveLength(1);
    const duplicate = buildResult(
      {
        session: first!.session,
        question: question(),
        selectedAnswer: 4,
        attempts: [first!.attempt],
        mistakePatterns: first!.mistakePatterns,
        statistics: first!.statistics,
        masteryThreshold: 3,
      },
      true,
      "2024-01-01T00:02:00.000Z",
    );
    expect(duplicate).toBeNull();
  });
});
