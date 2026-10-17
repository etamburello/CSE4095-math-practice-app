import { useMemo } from "react";
import { useApp } from "./useApp";
import { accuracy } from "../services/statisticsService";
import {
  activePatterns,
  masteredPatterns,
  mostMissedOperations,
  topMissedFacts,
} from "../services/mistakeService";

export function useStatistics() {
  const { state } = useApp();
  return useMemo(() => {
    const reviewAttempts = state.attempts.filter((attempt) => attempt.source === "mistake-review");
    return {
      statistics: state.statistics,
      accuracy: accuracy(state.statistics.correct, state.statistics.attempted),
      sessions: state.sessions,
      activeMistakes: activePatterns(state.mistakePatterns),
      masteredMistakes: masteredPatterns(state.mistakePatterns),
      mostMissed: mostMissedOperations(state.mistakePatterns),
      topFacts: topMissedFacts(state.mistakePatterns),
      reviewAttempted: reviewAttempts.length,
      reviewCorrect: reviewAttempts.filter((attempt) => attempt.selfReportedCorrect).length,
    };
  }, [state.attempts, state.mistakePatterns, state.sessions, state.statistics]);
}
