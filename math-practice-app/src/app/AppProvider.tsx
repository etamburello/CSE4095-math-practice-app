import { useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { AppContext } from "./context";
import { reducer } from "./reducer";
import { restoreState } from "./restore";
import { loadAll, saveAll, type PersistedSnapshot } from "../services/storageService";
import { DEFAULT_SETTINGS } from "../types/settings";
import { createEmptyStatistics } from "../types/statistics";
import type { AppState } from "../types/state";

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function createInitialState(): AppState {
  const storage = browserStorage();
  if (!storage) {
    return restoreState({
      settings: { ...DEFAULT_SETTINGS, defaultOperations: [...DEFAULT_SETTINGS.defaultOperations] },
      sessions: [],
      attempts: [],
      mistakePatterns: [],
      statistics: createEmptyStatistics(),
      activeSession: null,
      warning:
        "This browser is not saving practice data. You can keep practicing during this visit.",
    });
  }
  return restoreState(loadAll(storage));
}

function snapshot(state: AppState): PersistedSnapshot {
  const activeSession =
    state.currentSession && state.currentQuestion
      ? {
          session: state.currentSession,
          question: state.currentQuestion,
          questionIndex: state.currentQuestionIndex,
          selectedAnswer: state.selectedAnswer,
          isCardFlipped: state.isCardFlipped,
        }
      : null;
  return {
    settings: state.settings,
    sessions: state.sessions,
    attempts: state.attempts,
    mistakePatterns: state.mistakePatterns,
    statistics: state.statistics,
    activeSession,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const storage = browserStorage();
    if (!storage) {
      return;
    }
    const warning = saveAll(storage, snapshot(state));
    if (warning && warning !== state.storageWarning) {
      dispatch({ type: "setWarning", warning });
    }
  }, [state]);

  useEffect(() => {
    const save = () => {
      const storage = browserStorage();
      if (storage) {
        saveAll(storage, snapshot(stateRef.current));
      }
    };
    window.addEventListener("beforeunload", save);
    return () => window.removeEventListener("beforeunload", save);
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
