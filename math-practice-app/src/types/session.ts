import type { DifficultyLevel, MathOperation, Question } from "./question";

export type SessionLength = 5 | 10 | 20 | "continuous";

export type PracticeMode = "regular" | "mistake-review";

export interface PracticeAttempt {
  id: string;
  questionId: string;
  operation: MathOperation;
  firstOperand: number;
  secondOperand: number;
  correctAnswer: number;
  selectedAnswer: number;
  selfReportedCorrect: boolean;
  difficulty: DifficultyLevel;
  source: "regular" | "mistake-review";
  attemptedAt: string;
  sessionId: string;
}

export interface PracticeSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  operations: MathOperation[];
  difficulty: DifficultyLevel;
  sessionLength: SessionLength;
  mode: PracticeMode;
  attempted: number;
  correct: number;
  incorrect: number;
}

export interface ActiveSessionState {
  session: PracticeSession;
  question: Question;
  questionIndex: number;
  selectedAnswer: number | null;
  isCardFlipped: boolean;
}

export const SESSION_LENGTHS: readonly SessionLength[] = [5, 10, 20, "continuous"];
