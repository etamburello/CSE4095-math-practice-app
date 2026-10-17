import { DEFAULT_SETTINGS } from "../types/settings";
import type { AppSettings } from "../types/settings";
import type { Question } from "../types/question";
import type { PracticeSession } from "../types/session";
import { createEmptyStatistics } from "../types/statistics";
import type { AppState } from "../types/state";
import type { ResultUpdate } from "../services/practiceService";

export const MAX_SESSION_HISTORY = 40;
export const MAX_ATTEMPT_HISTORY = 3000;

export type Action =
  | { type: "selectAnswer"; answer: number }
  | { type: "flipCard" }
  | { type: "record"; update: ResultUpdate; message: string | null }
  | { type: "advance"; question: Question }
  | { type: "finish"; completedAt: string }
  | { type: "start"; session: PracticeSession; question: Question }
  | { type: "updateSettings"; settings: AppSettings }
  | { type: "resetStatistics" }
  | { type: "clearAll" }
  | { type: "setWarning"; warning: string | null };

function rememberSession(state: AppState, session: PracticeSession): PracticeSession[] {
  return [session, ...state.sessions.filter((item) => item.id !== session.id)].slice(
    0,
    MAX_SESSION_HISTORY,
  );
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "selectAnswer": {
      if (
        !state.currentQuestion ||
        state.isCardFlipped ||
        state.feedbackMessage ||
        !state.currentQuestion.choices.includes(action.answer)
      ) {
        return state;
      }
      return { ...state, selectedAnswer: action.answer };
    }
    case "flipCard": {
      if (state.selectedAnswer === null || state.isCardFlipped || state.feedbackMessage) {
        return state;
      }
      return { ...state, isCardFlipped: true };
    }
    case "record": {
      if (!state.currentSession || !state.currentQuestion) {
        return state;
      }
      return {
        ...state,
        currentSession: action.update.session,
        attempts: [...state.attempts, action.update.attempt].slice(-MAX_ATTEMPT_HISTORY),
        statistics: action.update.statistics,
        mistakePatterns: action.update.mistakePatterns,
        feedbackMessage: action.message,
      };
    }
    case "advance": {
      if (!state.currentSession) {
        return state;
      }
      return {
        ...state,
        currentQuestion: action.question,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        selectedAnswer: null,
        isCardFlipped: false,
        feedbackMessage: null,
      };
    }
    case "finish": {
      if (!state.currentSession) {
        return state;
      }
      const completed: PracticeSession = {
        ...state.currentSession,
        completedAt: action.completedAt,
      };
      return {
        ...state,
        currentSession: null,
        currentQuestion: null,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        isCardFlipped: false,
        feedbackMessage: null,
        summarySession: completed,
        sessions: completed.attempted > 0 ? rememberSession(state, completed) : state.sessions,
      };
    }
    case "start":
      return {
        ...state,
        currentSession: action.session,
        currentQuestion: action.question,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        isCardFlipped: false,
        feedbackMessage: null,
      };
    case "updateSettings":
      return { ...state, settings: action.settings };
    case "resetStatistics":
      return {
        ...state,
        attempts: [],
        sessions: [],
        mistakePatterns: [],
        statistics: createEmptyStatistics(),
        summarySession: null,
        currentSession: null,
        currentQuestion: null,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        isCardFlipped: false,
        feedbackMessage: null,
      };
    case "clearAll":
      return {
        ...state,
        settings: {
          ...DEFAULT_SETTINGS,
          defaultOperations: [...DEFAULT_SETTINGS.defaultOperations],
        },
        attempts: [],
        sessions: [],
        mistakePatterns: [],
        statistics: createEmptyStatistics(),
        summarySession: null,
        currentSession: null,
        currentQuestion: null,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        isCardFlipped: false,
        feedbackMessage: null,
        storageWarning: null,
      };
    case "setWarning":
      return { ...state, storageWarning: action.warning };
    default:
      return state;
  }
}
