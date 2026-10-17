import type { MathOperation } from "../types/question";
import type { Rng } from "../utils/math";
import { shuffle } from "../utils/shuffle";

const MAX_FILL_STEPS = 80;

function accept(
  value: number,
  correct: number,
  chosen: Set<number>,
  allowNegative: boolean,
): boolean {
  if (!Number.isInteger(value) || !Number.isFinite(value)) {
    return false;
  }
  if (value === correct || chosen.has(value)) {
    return false;
  }
  if (!allowNegative && value < 0) {
    return false;
  }
  return true;
}

function operationDistractors(
  operation: MathOperation,
  first: number,
  second: number,
  correct: number,
): number[] {
  switch (operation) {
    case "addition": {
      const missedCarry =
        (first % 10) + (second % 10) >= 10 ? [correct - 10, correct + 10] : [correct + 10];
      return [correct + 1, correct - 1, first + second + 1, ...missedCarry];
    }
    case "subtraction":
      return [correct + 1, correct - 1, first + second, second - first, correct + 10, correct - 10];
    case "multiplication":
      return [
        first * (second + 1),
        first * (second - 1),
        (first + 1) * second,
        (first - 1) * second,
        correct + first,
        correct - first,
        correct + second,
        first + second,
      ];
    case "division":
      return [correct + 1, correct - 1, correct + 2, correct - 2, second, first, correct + second];
    default:
      return [];
  }
}

export function generateDistractors(
  operation: MathOperation,
  first: number,
  second: number,
  correct: number,
  allowNegative: boolean,
  rng: Rng = Math.random,
): number[] {
  const chosen = new Set<number>();
  const candidates = shuffle(
    operationDistractors(operation, first, second, correct).concat([
      correct + 1,
      correct - 1,
      correct + 2,
      correct - 2,
      correct + 10,
      correct - 10,
      correct + 3,
      correct - 3,
    ]),
    rng,
  );

  for (const candidate of candidates) {
    if (chosen.size === 3) {
      break;
    }
    if (accept(candidate, correct, chosen, allowNegative)) {
      chosen.add(candidate);
    }
  }

  let step = 1;
  while (chosen.size < 3 && step <= MAX_FILL_STEPS) {
    const plus = correct + step;
    const minus = correct - step;
    if (accept(plus, correct, chosen, allowNegative)) {
      chosen.add(plus);
    }
    if (chosen.size < 3 && accept(minus, correct, chosen, allowNegative)) {
      chosen.add(minus);
    }
    step += 1;
  }

  return [...chosen].slice(0, 3);
}

export function generateChoices(
  operation: MathOperation,
  first: number,
  second: number,
  correct: number,
  allowNegative: boolean,
  rng: Rng = Math.random,
): number[] {
  const distractors = generateDistractors(operation, first, second, correct, allowNegative, rng);
  return shuffle([correct, ...distractors], rng);
}
