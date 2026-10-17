import type { DifficultyLevel, MathOperation, Question } from "../types/question";
import type { SessionLength } from "../types/session";
import type { Rng } from "./math";

const SYMBOLS: Record<MathOperation, string> = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
  division: "÷",
};

const SPOKEN: Record<MathOperation, string> = {
  addition: "plus",
  subtraction: "minus",
  multiplication: "times",
  division: "divided by",
};

export const OPERATION_LABELS: Record<MathOperation, string> = {
  addition: "Addition",
  subtraction: "Subtraction",
  multiplication: "Multiplication",
  division: "Division",
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  1: "Beginner",
  2: "Easy",
  3: "Intermediate",
  4: "Advanced",
};

export const DIFFICULTY_DESCRIPTIONS: Record<DifficultyLevel, string> = {
  1: "Numbers from 0 to 10, with small products and quotients.",
  2: "Numbers up to 50, and facts through 10.",
  3: "Numbers up to 100, including facts through 12.",
  4: "Larger numbers up to 1,000 and bigger multiplication.",
};

export function operationSymbol(operation: MathOperation): string {
  return SYMBOLS[operation];
}

export function formatQuestion(
  operation: MathOperation,
  firstOperand: number,
  secondOperand: number,
): string {
  return `${firstOperand} ${SYMBOLS[operation]} ${secondOperand}`;
}

export function spokenQuestion(
  operation: MathOperation,
  firstOperand: number,
  secondOperand: number,
): string {
  return `${firstOperand} ${SPOKEN[operation]} ${secondOperand}`;
}

export function explainQuestion(question: Question): string {
  const spoken = spokenQuestion(question.operation, question.firstOperand, question.secondOperand);
  return `${spoken} equals ${question.correctAnswer}.`;
}

export function formatSessionLength(length: SessionLength): string {
  if (length === "continuous") {
    return "Continuous";
  }
  return `${length} questions`;
}

export function formatAccuracy(correct: number, attempted: number): string {
  if (attempted <= 0) {
    return "0%";
  }
  return `${Math.round((correct / attempted) * 100)}%`;
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const CORRECT_MESSAGES = ["Great job!", "Nice work!", "You got it!", "Wonderful!"];

const SUPPORT_MESSAGES = [
  "Keep practicing!",
  "You are improving!",
  "Nice try. Let's practice that idea.",
  "That is okay. You can learn this.",
];

export function feedbackMessage(correct: boolean, rng: Rng = Math.random): string {
  const messages = correct ? CORRECT_MESSAGES : SUPPORT_MESSAGES;
  return messages[Math.floor(rng() * messages.length)];
}
