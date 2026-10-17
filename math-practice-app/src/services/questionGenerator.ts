import type { DifficultyLevel, MathOperation, Question, QuestionSource } from "../types/question";
import { createId } from "../utils/ids";
import { pickOne, randomInt, type Rng } from "../utils/math";
import { formatQuestion } from "../utils/format";
import { isValidQuestion } from "../utils/validation";
import {
  additionBounds,
  allowsNegativeAnswers,
  isValidDivision,
  isValidMultiplication,
  subtractionBounds,
} from "./difficulty";
import { generateChoices } from "./distractors";

export interface GenerateOptions {
  rng?: Rng;
  allowNegative?: boolean;
  avoid?: {
    operation: MathOperation;
    firstOperand: number;
    secondOperand: number;
  };
  source?: QuestionSource;
  mistakePatternId?: string;
}

const MAX_GENERATION_ATTEMPTS = 12;

function sameQuestion(
  operation: MathOperation,
  first: number,
  second: number,
  avoid: GenerateOptions["avoid"],
): boolean {
  if (!avoid) {
    return false;
  }
  return (
    avoid.operation === operation && avoid.firstOperand === first && avoid.secondOperand === second
  );
}

function warnDev(message: string, detail?: unknown): void {
  if (import.meta.env.DEV) {
    console.warn(message, detail);
  }
}

function withChoices(
  operation: MathOperation,
  first: number,
  second: number,
  correct: number,
  difficulty: DifficultyLevel,
  allowNegative: boolean,
  rng: Rng,
  source: QuestionSource,
  mistakePatternId?: string,
): Question {
  return {
    id: createId(),
    operation,
    firstOperand: first,
    secondOperand: second,
    displayText: formatQuestion(operation, first, second),
    correctAnswer: correct,
    choices: generateChoices(operation, first, second, correct, allowNegative, rng),
    difficulty,
    source,
    ...(mistakePatternId ? { mistakePatternId } : {}),
  };
}

function generateAddition(
  level: DifficultyLevel,
  rng: Rng,
): { first: number; second: number; correct: number } | null {
  const bounds = additionBounds(level);
  const first = randomInt(bounds.min, bounds.max, rng);
  const maxSecond = Math.min(bounds.max, bounds.maxResult - first);
  if (maxSecond < bounds.min) {
    return null;
  }
  const second = randomInt(bounds.min, maxSecond, rng);
  return { first, second, correct: first + second };
}

function generateSubtraction(
  level: DifficultyLevel,
  allowNegative: boolean,
  rng: Rng,
): { first: number; second: number; correct: number } {
  const bounds = subtractionBounds(level);
  let first = randomInt(bounds.min, bounds.max, rng);
  let second = randomInt(bounds.min, bounds.max, rng);
  const negatives = allowsNegativeAnswers(level, allowNegative);
  if (negatives && rng() < 0.4 && first !== second) {
    if (first > second) {
      const swap = first;
      first = second;
      second = swap;
    }
  } else if (first < second) {
    const swap = first;
    first = second;
    second = swap;
  }
  return { first, second, correct: first - second };
}

function generateMultiplication(
  level: DifficultyLevel,
  rng: Rng,
): { first: number; second: number; correct: number } {
  let first: number;
  let second: number;
  if (level === 1) {
    first = randomInt(0, 5, rng);
    second = randomInt(0, 5, rng);
  } else if (level === 2) {
    first = randomInt(0, 10, rng);
    second = randomInt(0, 10, rng);
  } else if (level === 3) {
    if (rng() < 0.5) {
      first = randomInt(0, 9, rng);
      second = randomInt(0, 9, rng);
    } else {
      first = randomInt(2, 9, rng);
      second = randomInt(10, 99, rng);
    }
  } else if (rng() < 0.5) {
    first = randomInt(10, 99, rng);
    second = randomInt(2, 9, rng);
  } else {
    first = randomInt(10, 99, rng);
    second = randomInt(10, 99, rng);
  }
  if (rng() < 0.5) {
    const swap = first;
    first = second;
    second = swap;
  }
  return { first, second, correct: first * second };
}

function generateDivision(
  level: DifficultyLevel,
  rng: Rng,
): { first: number; second: number; correct: number } | null {
  let divisor: number;
  let quotient: number;
  if (level === 1) {
    divisor = randomInt(1, 5, rng);
    quotient = randomInt(0, 5, rng);
  } else if (level === 2) {
    divisor = randomInt(1, 10, rng);
    quotient = randomInt(0, 10, rng);
  } else if (level === 3) {
    divisor = randomInt(1, 12, rng);
    quotient = randomInt(0, Math.floor(144 / divisor), rng);
  } else {
    divisor = randomInt(2, 30, rng);
    const minQuotient = Math.max(2, Math.ceil(145 / divisor));
    const maxQuotient = Math.max(minQuotient, Math.floor(2500 / divisor));
    quotient = randomInt(minQuotient, maxQuotient, rng);
  }
  const dividend = divisor * quotient;
  if (!isValidDivision(dividend, divisor, level)) {
    return null;
  }
  return { first: dividend, second: divisor, correct: quotient };
}

function rawOperands(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  allowNegative: boolean,
  rng: Rng,
): { first: number; second: number; correct: number } | null {
  switch (operation) {
    case "addition":
      return generateAddition(difficulty, rng);
    case "subtraction":
      return generateSubtraction(difficulty, allowNegative, rng);
    case "multiplication": {
      const product = generateMultiplication(difficulty, rng);
      return isValidMultiplication(product.first, product.second, difficulty) ? product : null;
    }
    case "division":
      return generateDivision(difficulty, rng);
    default:
      return null;
  }
}

function fallbackQuestion(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  source: QuestionSource,
  mistakePatternId: string | undefined,
  rng: Rng,
): Question {
  const samples: Record<MathOperation, { first: number; second: number; correct: number }> = {
    addition: { first: 1, second: 1, correct: 2 },
    subtraction: { first: 2, second: 1, correct: 1 },
    multiplication:
      difficulty === 4
        ? { first: 12, second: 12, correct: 144 }
        : { first: 2, second: 2, correct: 4 },
    division:
      difficulty === 4
        ? { first: 160, second: 10, correct: 16 }
        : { first: 4, second: 2, correct: 2 },
  };
  const sample = samples[operation];
  const question = withChoices(
    operation,
    sample.first,
    sample.second,
    sample.correct,
    difficulty,
    false,
    rng,
    source,
    mistakePatternId,
  );
  if (!isValidQuestion(question)) {
    warnDev("Fallback question failed validation", question);
  }
  return question;
}

export function generateQuestion(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  options: GenerateOptions = {},
): Question {
  const rng = options.rng ?? Math.random;
  const allowNegative = options.allowNegative ?? false;
  const source = options.source ?? "regular";

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const raw = rawOperands(operation, difficulty, allowNegative, rng);
    if (!raw) {
      continue;
    }
    if (sameQuestion(operation, raw.first, raw.second, options.avoid)) {
      continue;
    }
    const question = withChoices(
      operation,
      raw.first,
      raw.second,
      raw.correct,
      difficulty,
      allowsNegativeAnswers(difficulty, allowNegative),
      rng,
      source,
      options.mistakePatternId,
    );
    if (
      isValidQuestion(question, { allowNegative: allowsNegativeAnswers(difficulty, allowNegative) })
    ) {
      return question;
    }
    warnDev("Discarded an invalid generated question", question);
  }

  warnDev("Question generation used a fallback", { operation, difficulty });
  return fallbackQuestion(operation, difficulty, source, options.mistakePatternId, rng);
}

export function generateQuestionForOperations(
  operations: readonly MathOperation[],
  difficulty: DifficultyLevel,
  options: GenerateOptions = {},
): Question {
  if (operations.length === 0) {
    return generateQuestion("addition", difficulty, options);
  }
  const rng = options.rng ?? Math.random;
  const operation = pickOne(operations, rng);
  return generateQuestion(operation, difficulty, { ...options, rng });
}
