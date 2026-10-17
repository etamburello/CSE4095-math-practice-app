import type { DifficultyLevel, MathOperation, Question } from "../types/question";

export function calculateAnswer(
  operation: MathOperation,
  firstOperand: number,
  secondOperand: number,
): number | null {
  switch (operation) {
    case "addition":
      return firstOperand + secondOperand;
    case "subtraction":
      return firstOperand - secondOperand;
    case "multiplication":
      return firstOperand * secondOperand;
    case "division":
      if (secondOperand === 0 || firstOperand % secondOperand !== 0) {
        return null;
      }
      return firstOperand / secondOperand;
    default:
      return null;
  }
}

export function allowsNegativeAnswers(level: DifficultyLevel, settingEnabled: boolean): boolean {
  return level === 4 && settingEnabled;
}

interface AdditionBounds {
  min: number;
  max: number;
  maxResult: number;
}

export function additionBounds(level: DifficultyLevel): AdditionBounds {
  switch (level) {
    case 1:
      return { min: 0, max: 10, maxResult: 20 };
    case 2:
      return { min: 0, max: 50, maxResult: 100 };
    case 3:
      return { min: 0, max: 100, maxResult: 200 };
    case 4:
      return { min: 0, max: 1000, maxResult: 2000 };
  }
}

export function subtractionBounds(level: DifficultyLevel): { min: number; max: number } {
  switch (level) {
    case 1:
      return { min: 0, max: 10 };
    case 2:
      return { min: 0, max: 50 };
    case 3:
      return { min: 0, max: 100 };
    case 4:
      return { min: 0, max: 1000 };
  }
}

function isOneDigit(value: number): boolean {
  return value >= 0 && value <= 9;
}

function isTwoDigit(value: number): boolean {
  return value >= 10 && value <= 99;
}

export function isValidMultiplication(
  first: number,
  second: number,
  level: DifficultyLevel,
): boolean {
  if (!Number.isInteger(first) || !Number.isInteger(second)) {
    return false;
  }
  if (level === 1) {
    return first >= 0 && first <= 5 && second >= 0 && second <= 5;
  }
  if (level === 2) {
    return first >= 0 && first <= 10 && second >= 0 && second <= 10;
  }
  if (level === 3) {
    return (
      (isOneDigit(first) && isOneDigit(second)) ||
      (isOneDigit(first) && isTwoDigit(second)) ||
      (isTwoDigit(first) && isOneDigit(second))
    );
  }
  const advancedOne = (value: number) => value >= 2 && value <= 9;
  return (
    (isTwoDigit(first) && advancedOne(second)) ||
    (advancedOne(first) && isTwoDigit(second)) ||
    (isTwoDigit(first) && isTwoDigit(second))
  );
}

export function isValidDivision(
  dividend: number,
  divisor: number,
  level: DifficultyLevel,
): boolean {
  if (!Number.isInteger(dividend) || !Number.isInteger(divisor) || divisor === 0) {
    return false;
  }
  if (dividend % divisor !== 0) {
    return false;
  }
  const quotient = dividend / divisor;
  if (!Number.isInteger(quotient) || quotient < 0) {
    return false;
  }
  if (level === 1) {
    return divisor >= 1 && divisor <= 5 && quotient <= 5;
  }
  if (level === 2) {
    return divisor >= 1 && divisor <= 10 && quotient <= 10;
  }
  if (level === 3) {
    return divisor >= 1 && divisor <= 12 && dividend <= 144;
  }
  return divisor >= 2 && divisor <= 30 && dividend > 144 && dividend <= 2500;
}

export function isWithinDifficulty(question: Question, allowNegative: boolean): boolean {
  const { operation, firstOperand: a, secondOperand: b, difficulty } = question;
  if (operation === "addition") {
    const bounds = additionBounds(difficulty);
    return (
      a >= bounds.min &&
      a <= bounds.max &&
      b >= bounds.min &&
      b <= bounds.max &&
      a + b <= bounds.maxResult &&
      question.correctAnswer >= 0
    );
  }
  if (operation === "subtraction") {
    const bounds = subtractionBounds(difficulty);
    const inRange = a >= bounds.min && a <= bounds.max && b >= bounds.min && b <= bounds.max;
    if (!inRange) {
      return false;
    }
    if (question.correctAnswer < 0) {
      return allowNegative && difficulty === 4;
    }
    return a >= b;
  }
  if (operation === "multiplication") {
    return isValidMultiplication(a, b, difficulty) && question.correctAnswer >= 0;
  }
  return isValidDivision(a, b, difficulty);
}
