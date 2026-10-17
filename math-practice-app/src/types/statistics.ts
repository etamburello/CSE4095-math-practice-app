import type { DifficultyLevel, MathOperation } from "./question";

export interface OperationStatistics {
  attempted: number;
  correct: number;
  incorrect: number;
}

export interface AppStatistics {
  attempted: number;
  correct: number;
  incorrect: number;
  byOperation: Record<MathOperation, OperationStatistics>;
  byDifficulty: Record<DifficultyLevel, OperationStatistics>;
}

export function emptyOperationStatistics(): OperationStatistics {
  return { attempted: 0, correct: 0, incorrect: 0 };
}

export function createEmptyStatistics(): AppStatistics {
  return {
    attempted: 0,
    correct: 0,
    incorrect: 0,
    byOperation: {
      addition: emptyOperationStatistics(),
      subtraction: emptyOperationStatistics(),
      multiplication: emptyOperationStatistics(),
      division: emptyOperationStatistics(),
    },
    byDifficulty: {
      1: emptyOperationStatistics(),
      2: emptyOperationStatistics(),
      3: emptyOperationStatistics(),
      4: emptyOperationStatistics(),
    },
  };
}
