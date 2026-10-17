import type { MistakePattern } from "../types/mistake";
import type { MathOperation, Question } from "../types/question";
import type {
  PracticeAttempt,
  PracticeMode,
  PracticeSession,
  SessionLength,
} from "../types/session";
import type { AppStatistics } from "../types/statistics";
import { createId } from "../utils/ids";
import type { Rng } from "../utils/math";
import {
  updatePatternById,
  upsertIncorrectPattern,
  prioritizePatterns,
  activePatterns,
} from "./mistakeService";
import { generateQuestionForOperations, type GenerateOptions } from "./questionGenerator";
import { generateSimilarQuestion } from "./similarQuestionGenerator";
import { recordAttemptStats } from "./statisticsService";

export interface SessionConfig {
  operations: MathOperation[];
  difficulty: PracticeSession["difficulty"];
  sessionLength: SessionLength;
  mode: PracticeMode;
}

export function createSession(config: SessionConfig, now: string): PracticeSession {
  return {
    id: createId(),
    startedAt: now,
    operations: [...config.operations],
    difficulty: config.difficulty,
    sessionLength: config.sessionLength,
    mode: config.mode,
    attempted: 0,
    correct: 0,
    incorrect: 0,
  };
}

export function isSessionComplete(session: PracticeSession): boolean {
  return session.sessionLength !== "continuous" && session.attempted >= session.sessionLength;
}

export function canRecord(input: {
  session: PracticeSession | null;
  question: Question | null;
  selectedAnswer: number | null;
  isCardFlipped: boolean;
  feedbackMessage: string | null;
}): boolean {
  return Boolean(
    input.session &&
    input.question &&
    input.selectedAnswer !== null &&
    input.isCardFlipped &&
    input.feedbackMessage === null &&
    !input.session.completedAt,
  );
}

export interface ResultUpdate {
  attempt: PracticeAttempt;
  session: PracticeSession;
  statistics: AppStatistics;
  mistakePatterns: MistakePattern[];
  finished: boolean;
}

export function buildResult(
  input: {
    session: PracticeSession;
    question: Question;
    selectedAnswer: number;
    attempts: readonly PracticeAttempt[];
    mistakePatterns: readonly MistakePattern[];
    statistics: AppStatistics;
    masteryThreshold: number;
  },
  selfReportedCorrect: boolean,
  now: string,
): ResultUpdate | null {
  const alreadyRecorded = input.attempts.some(
    (attempt) => attempt.sessionId === input.session.id && attempt.questionId === input.question.id,
  );
  if (alreadyRecorded) {
    return null;
  }

  const attempt: PracticeAttempt = {
    id: createId(),
    questionId: input.question.id,
    operation: input.question.operation,
    firstOperand: input.question.firstOperand,
    secondOperand: input.question.secondOperand,
    correctAnswer: input.question.correctAnswer,
    selectedAnswer: input.selectedAnswer,
    selfReportedCorrect,
    difficulty: input.question.difficulty,
    source: input.question.source,
    attemptedAt: now,
    sessionId: input.session.id,
  };

  const session: PracticeSession = {
    ...input.session,
    attempted: input.session.attempted + 1,
    correct: input.session.correct + (selfReportedCorrect ? 1 : 0),
    incorrect: input.session.incorrect + (selfReportedCorrect ? 0 : 1),
  };

  let mistakePatterns = [...input.mistakePatterns];
  if (input.question.source === "mistake-review" && input.question.mistakePatternId) {
    const exists = mistakePatterns.some(
      (pattern) => pattern.id === input.question.mistakePatternId,
    );
    if (exists) {
      mistakePatterns = updatePatternById(
        mistakePatterns,
        input.question.mistakePatternId,
        selfReportedCorrect,
        input.masteryThreshold,
        now,
      );
    } else if (!selfReportedCorrect) {
      mistakePatterns = upsertIncorrectPattern(mistakePatterns, input.question, now);
    }
  } else if (!selfReportedCorrect) {
    mistakePatterns = upsertIncorrectPattern(mistakePatterns, input.question, now);
  }

  return {
    attempt,
    session,
    statistics: recordAttemptStats(input.statistics, attempt),
    mistakePatterns,
    finished: isSessionComplete(session),
  };
}

export function createNextQuestion(
  session: PracticeSession,
  patterns: readonly MistakePattern[],
  previous: Question | null,
  options: GenerateOptions = {},
): Question {
  const avoid = previous
    ? {
        operation: previous.operation,
        firstOperand: previous.firstOperand,
        secondOperand: previous.secondOperand,
      }
    : undefined;
  const generationOptions = { ...options, avoid };

  if (session.mode === "mistake-review") {
    const atLevel = activePatterns(patterns).filter(
      (pattern) => pattern.difficulty === session.difficulty,
    );
    const pool = atLevel.length > 0 ? atLevel : activePatterns(patterns);
    if (pool.length > 0) {
      const ranked = prioritizePatterns(pool, options.rng ?? Math.random);
      return generateSimilarQuestion(ranked[0], generationOptions);
    }
  }

  return generateQuestionForOperations(session.operations, session.difficulty, generationOptions);
}

export function countMistakeReviews(
  attempts: readonly PracticeAttempt[],
  sessionId: string,
): number {
  return attempts.filter(
    (attempt) => attempt.sessionId === sessionId && attempt.source === "mistake-review",
  ).length;
}

export function feedbackDelayMs(feedbackMessages: boolean, reducedMotion: boolean): number {
  if (!feedbackMessages) {
    return 0;
  }
  return reducedMotion ? 250 : 900;
}

export function pickReviewPattern(
  patterns: readonly MistakePattern[],
  rng: Rng,
): MistakePattern | null {
  const ranked = prioritizePatterns(activePatterns(patterns), rng);
  return ranked[0] ?? null;
}
