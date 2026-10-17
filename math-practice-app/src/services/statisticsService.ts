import type { PracticeAttempt } from "../types/session";
import type { AppStatistics, OperationStatistics } from "../types/statistics";

export function accuracy(correct: number, attempted: number): number {
  if (attempted <= 0) {
    return 0;
  }
  return (correct / attempted) * 100;
}

function addResult(stats: OperationStatistics, correct: boolean): OperationStatistics {
  return {
    attempted: stats.attempted + 1,
    correct: stats.correct + (correct ? 1 : 0),
    incorrect: stats.incorrect + (correct ? 0 : 1),
  };
}

export function recordAttemptStats(
  statistics: AppStatistics,
  attempt: PracticeAttempt,
): AppStatistics {
  return {
    attempted: statistics.attempted + 1,
    correct: statistics.correct + (attempt.selfReportedCorrect ? 1 : 0),
    incorrect: statistics.incorrect + (attempt.selfReportedCorrect ? 0 : 1),
    byOperation: {
      ...statistics.byOperation,
      [attempt.operation]: addResult(
        statistics.byOperation[attempt.operation],
        attempt.selfReportedCorrect,
      ),
    },
    byDifficulty: {
      ...statistics.byDifficulty,
      [attempt.difficulty]: addResult(
        statistics.byDifficulty[attempt.difficulty],
        attempt.selfReportedCorrect,
      ),
    },
  };
}

export function statisticsFromAttempts(attempts: readonly PracticeAttempt[]): AppStatistics {
  return attempts.reduce((stats, attempt) => recordAttemptStats(stats, attempt), {
    attempted: 0,
    correct: 0,
    incorrect: 0,
    byOperation: {
      addition: { attempted: 0, correct: 0, incorrect: 0 },
      subtraction: { attempted: 0, correct: 0, incorrect: 0 },
      multiplication: { attempted: 0, correct: 0, incorrect: 0 },
      division: { attempted: 0, correct: 0, incorrect: 0 },
    },
    byDifficulty: {
      1: { attempted: 0, correct: 0, incorrect: 0 },
      2: { attempted: 0, correct: 0, incorrect: 0 },
      3: { attempted: 0, correct: 0, incorrect: 0 },
      4: { attempted: 0, correct: 0, incorrect: 0 },
    },
  });
}
