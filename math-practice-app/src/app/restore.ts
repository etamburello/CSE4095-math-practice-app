import type { LoadedData } from "../services/storageService";
import { MAX_STORED_SESSIONS } from "../services/storageService";
import { createNextQuestion, isSessionComplete } from "../services/practiceService";
import { createEmptyStatistics } from "../types/statistics";
import type { AppState } from "../types/state";
import type { PracticeSession } from "../types/session";

function withSummary(sessions: PracticeSession[], completed: PracticeSession): PracticeSession[] {
  return [completed, ...sessions.filter((session) => session.id !== completed.id)].slice(
    0,
    MAX_STORED_SESSIONS,
  );
}

export function restoreState(loaded: LoadedData): AppState {
  const state: AppState = {
    settings: loaded.settings,
    currentSession: null,
    currentQuestion: null,
    currentQuestionIndex: 0,
    selectedAnswer: null,
    isCardFlipped: false,
    feedbackMessage: null,
    attempts: loaded.attempts,
    sessions: loaded.sessions,
    mistakePatterns: loaded.mistakePatterns,
    statistics: loaded.statistics ?? createEmptyStatistics(),
    summarySession: null,
    storageWarning: loaded.warning,
  };
  const active = loaded.activeSession;
  if (!active) {
    return state;
  }

  const alreadyRecorded = loaded.attempts.some(
    (attempt) =>
      attempt.sessionId === active.session.id && attempt.questionId === active.question.id,
  );

  if (active.session.completedAt || isSessionComplete(active.session)) {
    const completed: PracticeSession = {
      ...active.session,
      completedAt: active.session.completedAt ?? new Date().toISOString(),
    };
    return {
      ...state,
      sessions: withSummary(loaded.sessions, completed),
      summarySession: completed,
    };
  }

  if (alreadyRecorded) {
    return {
      ...state,
      currentSession: active.session,
      currentQuestion: createNextQuestion(active.session, loaded.mistakePatterns, active.question, {
        allowNegative: loaded.settings.allowNegativeAnswers,
      }),
      currentQuestionIndex: active.questionIndex + 1,
    };
  }

  return {
    ...state,
    currentSession: active.session,
    currentQuestion: active.question,
    currentQuestionIndex: active.questionIndex,
    selectedAnswer: active.selectedAnswer,
    isCardFlipped: active.isCardFlipped,
  };
}
