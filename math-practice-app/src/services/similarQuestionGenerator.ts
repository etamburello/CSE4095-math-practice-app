import type { MistakePattern } from "../types/mistake";
import type { DifficultyLevel, MathOperation, Question } from "../types/question";
import { formatQuestion } from "../utils/format";
import { createId } from "../utils/ids";
import { pickOne, type Rng } from "../utils/math";
import { shuffle } from "../utils/shuffle";
import { isValidQuestion } from "../utils/validation";
import { additionBounds, allowsNegativeAnswers, subtractionBounds } from "./difficulty";
import { generateChoices } from "./distractors";
import type { GenerateOptions } from "./questionGenerator";

export type SimilarityStrategy = "nearby" | "reversed" | "fact-family";

const STRATEGIES: readonly SimilarityStrategy[] = ["nearby", "reversed", "fact-family"];

interface Draft {
  operation: MathOperation;
  first: number;
  second: number;
  correct: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function nearby(pattern: MistakePattern, rng: Rng): Draft | null {
  const delta = pickOne([-2, -1, 1, 2], rng);
  const changeFirst = rng() < 0.5;
  if (pattern.operation === "addition") {
    const bounds = additionBounds(pattern.difficulty);
    let first = pattern.firstOperand;
    let second = pattern.secondOperand;
    if (changeFirst) {
      first = clamp(first + delta, bounds.min, bounds.max);
    } else {
      second = clamp(second + delta, bounds.min, bounds.max);
    }
    if (first + second > bounds.maxResult) {
      second = clamp(bounds.maxResult - first, bounds.min, bounds.max);
    }
    if (first + second > bounds.maxResult) {
      return null;
    }
    return { operation: "addition", first, second, correct: first + second };
  }
  if (pattern.operation === "subtraction") {
    const bounds = subtractionBounds(pattern.difficulty);
    let first = pattern.firstOperand;
    let second = pattern.secondOperand;
    if (changeFirst) {
      first = clamp(first + delta, bounds.min, bounds.max);
    } else {
      second = clamp(second + delta, bounds.min, bounds.max);
    }
    if (first < second) {
      return null;
    }
    return { operation: "subtraction", first, second, correct: first - second };
  }
  if (pattern.operation === "multiplication") {
    let first = pattern.firstOperand;
    let second = pattern.secondOperand;
    if (changeFirst) {
      first = Math.max(0, first + delta);
    } else {
      second = Math.max(0, second + delta);
    }
    return { operation: "multiplication", first, second, correct: first * second };
  }
  const quotient = pattern.correctAnswer + delta;
  if (quotient < 0) {
    return null;
  }
  const divisor = pattern.secondOperand;
  if (divisor === 0) {
    return null;
  }
  return {
    operation: "division",
    first: divisor * quotient,
    second: divisor,
    correct: quotient,
  };
}

function reversed(pattern: MistakePattern): Draft | null {
  if (pattern.operation !== "addition" && pattern.operation !== "multiplication") {
    return null;
  }
  if (pattern.firstOperand === pattern.secondOperand) {
    return null;
  }
  return {
    operation: pattern.operation,
    first: pattern.secondOperand,
    second: pattern.firstOperand,
    correct: pattern.correctAnswer,
  };
}

function factFamily(pattern: MistakePattern, rng: Rng): Draft | null {
  const a = pattern.firstOperand;
  const b = pattern.secondOperand;
  const c = pattern.correctAnswer;
  if (pattern.operation === "addition") {
    return rng() < 0.5
      ? { operation: "subtraction", first: c, second: a, correct: b }
      : { operation: "subtraction", first: c, second: b, correct: a };
  }
  if (pattern.operation === "subtraction") {
    return rng() < 0.5
      ? { operation: "addition", first: b, second: c, correct: a }
      : { operation: "addition", first: c, second: b, correct: a };
  }
  if (pattern.operation === "multiplication") {
    if (a === 0 || b === 0 || c === 0) {
      return null;
    }
    return rng() < 0.5
      ? { operation: "division", first: c, second: a, correct: b }
      : { operation: "division", first: c, second: b, correct: a };
  }
  if (b === 0 || c === 0) {
    return null;
  }
  return rng() < 0.5
    ? { operation: "multiplication", first: b, second: c, correct: a }
    : { operation: "multiplication", first: c, second: b, correct: a };
}

function draftFor(strategy: SimilarityStrategy, pattern: MistakePattern, rng: Rng): Draft | null {
  switch (strategy) {
    case "nearby":
      return nearby(pattern, rng);
    case "reversed":
      return reversed(pattern);
    case "fact-family":
      return factFamily(pattern, rng);
    default:
      return null;
  }
}

function toQuestion(
  draft: Draft,
  difficulty: DifficultyLevel,
  patternId: string,
  allowNegative: boolean,
  rng: Rng,
): Question {
  return {
    id: createId(),
    operation: draft.operation,
    firstOperand: draft.first,
    secondOperand: draft.second,
    displayText: formatQuestion(draft.operation, draft.first, draft.second),
    correctAnswer: draft.correct,
    choices: generateChoices(
      draft.operation,
      draft.first,
      draft.second,
      draft.correct,
      allowNegative,
      rng,
    ),
    difficulty,
    source: "mistake-review",
    mistakePatternId: patternId,
  };
}

function isSameAsPattern(draft: Draft, pattern: MistakePattern): boolean {
  return (
    draft.operation === pattern.operation &&
    draft.first === pattern.firstOperand &&
    draft.second === pattern.secondOperand
  );
}

export function generateSimilarQuestion(
  pattern: MistakePattern,
  options: GenerateOptions & { strategy?: SimilarityStrategy } = {},
): Question {
  const rng = options.rng ?? Math.random;
  const difficulty = pattern.difficulty;
  const allowNegative = allowsNegativeAnswers(difficulty, options.allowNegative ?? false);
  const strategies = options.strategy
    ? [
        options.strategy,
        ...shuffle(
          STRATEGIES.filter((item) => item !== options.strategy),
          rng,
        ),
      ]
    : shuffle(STRATEGIES, rng);

  let fallback: Question | null = null;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const strategy = strategies[attempt % strategies.length];
    const draft = draftFor(strategy, pattern, rng);
    if (!draft) {
      continue;
    }
    const question = toQuestion(draft, difficulty, pattern.id, allowNegative, rng);
    if (!isValidQuestion(question, { allowNegative })) {
      continue;
    }
    const same =
      isSameAsPattern(draft, pattern) ||
      (options.avoid &&
        options.avoid.operation === draft.operation &&
        options.avoid.firstOperand === draft.first &&
        options.avoid.secondOperand === draft.second);
    if (!same) {
      return question;
    }
    fallback = question;
  }

  if (fallback && isValidQuestion(fallback, { allowNegative })) {
    return fallback;
  }

  const safe = toQuestion(
    {
      operation: pattern.operation,
      first: pattern.firstOperand,
      second: pattern.secondOperand,
      correct: pattern.correctAnswer,
    },
    difficulty,
    pattern.id,
    allowNegative,
    rng,
  );
  return safe;
}
