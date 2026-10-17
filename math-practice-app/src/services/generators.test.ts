import { describe, expect, it } from "vitest";
import { generateChoices } from "../services/distractors";
import { generateQuestion } from "../services/questionGenerator";
import { DIFFICULTY_LEVELS, MATH_OPERATIONS } from "../types/question";
import { isValidQuestion } from "../utils/validation";

describe("question generation", () => {
  it("creates a valid question for every operation and difficulty", () => {
    for (const operation of MATH_OPERATIONS) {
      for (const difficulty of DIFFICULTY_LEVELS) {
        const question = generateQuestion(operation, difficulty, { rng: () => 0.3 });
        expect(isValidQuestion(question)).toBe(true);
        expect(question.operation).toBe(operation);
        expect(question.difficulty).toBe(difficulty);
        expect(question.choices).toHaveLength(4);
        expect(new Set(question.choices).size).toBe(4);
        expect(question.choices).toContain(question.correctAnswer);
      }
    }
  });

  it("keeps addition inside the result limit", () => {
    for (let index = 0; index < 40; index += 1) {
      const question = generateQuestion("addition", 1);
      expect(question.firstOperand).toBeGreaterThanOrEqual(0);
      expect(question.firstOperand).toBeLessThanOrEqual(10);
      expect(question.secondOperand).toBeLessThanOrEqual(10);
      expect(question.correctAnswer).toBeLessThanOrEqual(20);
    }
  });

  it("does not produce negative subtraction answers by default", () => {
    for (const difficulty of DIFFICULTY_LEVELS) {
      for (let index = 0; index < 30; index += 1) {
        const question = generateQuestion("subtraction", difficulty);
        expect(question.firstOperand).toBeGreaterThanOrEqual(question.secondOperand);
        expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("can produce negative advanced subtraction when that option is on", () => {
    const answers = Array.from(
      { length: 80 },
      () => generateQuestion("subtraction", 4, { allowNegative: true }).correctAnswer,
    );
    expect(answers.some((answer) => answer < 0)).toBe(true);
  });

  it("covers every multiplication difficulty range", () => {
    const questions = Array.from({ length: 80 }, () => generateQuestion("multiplication", 3));
    expect(
      questions.every((question) => question.firstOperand <= 99 && question.secondOperand <= 99),
    ).toBe(true);
    expect(
      questions.some((question) => question.firstOperand <= 9 && question.secondOperand <= 9),
    ).toBe(true);
    expect(
      questions.some(
        (question) =>
          (question.firstOperand <= 9 && question.secondOperand >= 10) ||
          (question.secondOperand <= 9 && question.firstOperand >= 10),
      ),
    ).toBe(true);

    const advanced = Array.from({ length: 40 }, () => generateQuestion("multiplication", 4));
    expect(
      advanced.every((question) => question.firstOperand >= 2 && question.secondOperand >= 2),
    ).toBe(true);
    expect(
      advanced.some((question) => question.firstOperand >= 10 && question.secondOperand >= 10),
    ).toBe(true);
  });

  it("never divides by zero and only uses whole-number quotients", () => {
    for (const difficulty of DIFFICULTY_LEVELS) {
      for (let index = 0; index < 40; index += 1) {
        const question = generateQuestion("division", difficulty);
        expect(question.secondOperand).not.toBe(0);
        expect(question.firstOperand % question.secondOperand).toBe(0);
        expect(Number.isInteger(question.correctAnswer)).toBe(true);
        expect(question.choices.every((choice) => Number.isInteger(choice) && choice >= 0)).toBe(
          true,
        );
      }
    }
  });

  it("does not leave the correct choice in one predictable position", () => {
    const positions = new Set(
      Array.from({ length: 30 }, () => {
        const question = generateQuestion("addition", 2);
        return question.choices.indexOf(question.correctAnswer);
      }),
    );
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe("generateChoices", () => {
  it("builds four unique choices around a small answer", () => {
    const choices = generateChoices("addition", 0, 0, 0, false, () => 0.2);
    expect(choices).toHaveLength(4);
    expect(new Set(choices).size).toBe(4);
    expect(choices).toContain(0);
    expect(choices.every((choice) => choice >= 0)).toBe(true);
  });
});
