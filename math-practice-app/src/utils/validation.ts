import type { MistakePattern } from "../types/mistake";
import {
  DIFFICULTY_LEVELS,
  MATH_OPERATIONS,
  type DifficultyLevel,
  type MathOperation,
  type Question,
  type QuestionSource,
} from "../types/question";
import type {
  ActiveSessionState,
  PracticeAttempt,
  PracticeMode,
  PracticeSession,
  SessionLength,
} from "../types/session";
import { DEFAULT_SETTINGS, type AppSettings } from "../types/settings";
import {
  createEmptyStatistics,
  type AppStatistics,
  type OperationStatistics,
} from "../types/statistics";
import { calculateAnswer, isWithinDifficulty } from "../services/difficulty";

const SOURCES: readonly QuestionSource[] = ["regular", "mistake-review"];
const MODES: readonly PracticeMode[] = ["regular", "mistake-review"];
const LENGTHS: readonly SessionLength[] = [5, 10, 20, "continuous"];

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isMathOperation(value: unknown): value is MathOperation {
  return typeof value === "string" && MATH_OPERATIONS.includes(value as MathOperation);
}

export function isDifficultyLevel(value: unknown): value is DifficultyLevel {
  return typeof value === "number" && DIFFICULTY_LEVELS.includes(value as DifficultyLevel);
}

export function isSessionLength(value: unknown): value is SessionLength {
  return LENGTHS.includes(value as SessionLength);
}

export function isQuestionSource(value: unknown): value is QuestionSource {
  return SOURCES.includes(value as QuestionSource);
}

export function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

export function isQuestion(value: unknown): value is Question {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.id !== "string" || value.id.length === 0) {
    return false;
  }
  if (!isMathOperation(value.operation) || !isDifficultyLevel(value.difficulty)) {
    return false;
  }
  if (
    !isInteger(value.firstOperand) ||
    !isInteger(value.secondOperand) ||
    !isInteger(value.correctAnswer)
  ) {
    return false;
  }
  if (typeof value.displayText !== "string") {
    return false;
  }
  if (!isQuestionSource(value.source)) {
    return false;
  }
  if (value.mistakePatternId !== undefined && typeof value.mistakePatternId !== "string") {
    return false;
  }
  if (!Array.isArray(value.choices) || value.choices.length !== 4) {
    return false;
  }
  if (!value.choices.every((choice) => isInteger(choice))) {
    return false;
  }
  return isValidQuestion(value as unknown as Question);
}

export function isValidQuestion(
  question: Question,
  options?: { allowNegative?: boolean },
): boolean {
  if (!isMathOperation(question.operation)) {
    return false;
  }
  if (!isDifficultyLevel(question.difficulty)) {
    return false;
  }
  if (
    !isInteger(question.firstOperand) ||
    !isInteger(question.secondOperand) ||
    !isInteger(question.correctAnswer)
  ) {
    return false;
  }
  if (question.operation === "division" && question.secondOperand === 0) {
    return false;
  }
  if (
    calculateAnswer(question.operation, question.firstOperand, question.secondOperand) !==
    question.correctAnswer
  ) {
    return false;
  }
  if (!isWithinDifficulty(question, options?.allowNegative ?? false)) {
    return false;
  }
  if (question.choices.length !== 4) {
    return false;
  }
  if (new Set(question.choices).size !== 4) {
    return false;
  }
  if (!question.choices.every((choice) => isInteger(choice))) {
    return false;
  }
  if (!question.choices.includes(question.correctAnswer)) {
    return false;
  }
  if (!options?.allowNegative && question.choices.some((choice) => choice < 0)) {
    return false;
  }
  if (question.operation === "division" && !Number.isInteger(question.correctAnswer)) {
    return false;
  }
  return true;
}

export function isPracticeAttempt(value: unknown): value is PracticeAttempt {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.questionId === "string" &&
    isMathOperation(value.operation) &&
    isInteger(value.firstOperand) &&
    isInteger(value.secondOperand) &&
    isInteger(value.correctAnswer) &&
    isInteger(value.selectedAnswer) &&
    typeof value.selfReportedCorrect === "boolean" &&
    isDifficultyLevel(value.difficulty) &&
    isQuestionSource(value.source) &&
    typeof value.attemptedAt === "string" &&
    typeof value.sessionId === "string"
  );
}

export function isPracticeSession(value: unknown): value is PracticeSession {
  if (!isRecord(value)) {
    return false;
  }
  if (
    typeof value.id !== "string" ||
    typeof value.startedAt !== "string" ||
    !isDifficultyLevel(value.difficulty) ||
    !isSessionLength(value.sessionLength) ||
    !MODES.includes(value.mode as PracticeMode)
  ) {
    return false;
  }
  if (value.completedAt !== undefined && typeof value.completedAt !== "string") {
    return false;
  }
  if (!Array.isArray(value.operations) || value.operations.length === 0) {
    return false;
  }
  if (!value.operations.every((operation) => isMathOperation(operation))) {
    return false;
  }
  return (
    isInteger(value.attempted) &&
    isInteger(value.correct) &&
    isInteger(value.incorrect) &&
    value.attempted >= 0 &&
    value.correct >= 0 &&
    value.incorrect >= 0
  );
}

export function isMistakePattern(value: unknown): value is MistakePattern {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    isMathOperation(value.operation) &&
    isInteger(value.firstOperand) &&
    isInteger(value.secondOperand) &&
    isInteger(value.correctAnswer) &&
    isDifficultyLevel(value.difficulty) &&
    isInteger(value.incorrectCount) &&
    isInteger(value.similarCorrectCount) &&
    value.incorrectCount >= 0 &&
    value.similarCorrectCount >= 0 &&
    typeof value.lastIncorrectAt === "string" &&
    typeof value.mastered === "boolean"
  );
}

export function isOperationStatistics(value: unknown): value is OperationStatistics {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isInteger(value.attempted) &&
    isInteger(value.correct) &&
    isInteger(value.incorrect) &&
    value.attempted >= 0 &&
    value.correct >= 0 &&
    value.incorrect >= 0
  );
}

export function isAppStatistics(value: unknown): value is AppStatistics {
  if (!isRecord(value) || !isOperationStatistics(value)) {
    return false;
  }
  const byOperation = value.byOperation;
  const byDifficulty = value.byDifficulty;
  if (!isRecord(byOperation) || !isRecord(byDifficulty)) {
    return false;
  }
  const operationsOk = MATH_OPERATIONS.every((operation) =>
    isOperationStatistics(byOperation[operation]),
  );
  const levelsOk = DIFFICULTY_LEVELS.every((level) =>
    isOperationStatistics(byDifficulty[String(level)]),
  );
  return operationsOk && levelsOk;
}

export function isAppSettings(value: unknown): value is AppSettings {
  if (!isRecord(value)) {
    return false;
  }
  if (
    typeof value.soundEffects !== "boolean" ||
    typeof value.cardAnimation !== "boolean" ||
    typeof value.showExplanations !== "boolean" ||
    typeof value.feedbackMessages !== "boolean" ||
    typeof value.allowNegativeAnswers !== "boolean"
  ) {
    return false;
  }
  if (!isSessionLength(value.defaultSessionLength)) {
    return false;
  }
  if (!isDifficultyLevel(value.defaultDifficulty)) {
    return false;
  }
  if (
    !Array.isArray(value.defaultOperations) ||
    value.defaultOperations.length === 0 ||
    !value.defaultOperations.every((operation) => isMathOperation(operation))
  ) {
    return false;
  }
  return (
    isInteger(value.masteryThreshold) && value.masteryThreshold >= 1 && value.masteryThreshold <= 10
  );
}

export function isActiveSession(value: unknown): value is ActiveSessionState {
  if (!isRecord(value)) {
    return false;
  }
  if (!isPracticeSession(value.session) || !isQuestion(value.question)) {
    return false;
  }
  if (!isInteger(value.questionIndex) || value.questionIndex < 0) {
    return false;
  }
  if (value.selectedAnswer !== null && !isInteger(value.selectedAnswer)) {
    return false;
  }
  return typeof value.isCardFlipped === "boolean";
}

export function sanitizeSettings(value: unknown): AppSettings {
  if (!isAppSettings(value)) {
    return { ...DEFAULT_SETTINGS };
  }
  return {
    ...value,
    defaultOperations: [...new Set(value.defaultOperations)],
  };
}

export function sanitizeStatistics(value: unknown): AppStatistics {
  if (!isAppStatistics(value)) {
    return createEmptyStatistics();
  }
  return value;
}
