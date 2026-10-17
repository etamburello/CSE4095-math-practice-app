import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "./useApp";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { feedbackMessage } from "../utils/format";
import {
  buildResult,
  canRecord,
  createNextQuestion,
  createSession,
  feedbackDelayMs,
  type SessionConfig,
} from "../services/practiceService";
import { playResultSound } from "../services/sound";

export function usePracticeSession() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const reducedMotion = usePrefersReducedMotion();
  const stateRef = useRef(state);
  const reporting = useRef(false);
  const timer = useRef<number | null>(null);
  const startRequested = useRef(false);
  const summaryRequested = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      startRequested.current &&
      state.currentSession &&
      !state.currentSession.completedAt &&
      state.currentQuestion
    ) {
      startRequested.current = false;
      navigate("/practice/session");
    }
  }, [navigate, state.currentQuestion, state.currentSession]);

  useEffect(() => {
    if (summaryRequested.current && state.summarySession) {
      summaryRequested.current = false;
      navigate("/practice/summary");
    }
  }, [navigate, state.summarySession]);

  const start = (config: SessionConfig) => {
    const current = stateRef.current;
    const session = createSession(config, new Date().toISOString());
    const question = createNextQuestion(session, current.mistakePatterns, null, {
      allowNegative: current.settings.allowNegativeAnswers,
    });
    reporting.current = false;
    startRequested.current = true;
    dispatch({ type: "start", session, question });
  };

  const selectAnswer = (answer: number) => {
    dispatch({ type: "selectAnswer", answer });
  };

  const flip = () => {
    dispatch({ type: "flipCard" });
  };

  const finish = (options?: { summary?: boolean }) => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    reporting.current = false;
    if (options?.summary !== false) {
      summaryRequested.current = true;
    }
    dispatch({ type: "finish", completedAt: new Date().toISOString() });
  };

  const report = (correct: boolean) => {
    const current = stateRef.current;
    if (
      reporting.current ||
      !canRecord({
        session: current.currentSession,
        question: current.currentQuestion,
        selectedAnswer: current.selectedAnswer,
        isCardFlipped: current.isCardFlipped,
        feedbackMessage: current.feedbackMessage,
      })
    ) {
      return;
    }
    if (!current.currentSession || !current.currentQuestion || current.selectedAnswer === null) {
      return;
    }
    const update = buildResult(
      {
        session: current.currentSession,
        question: current.currentQuestion,
        selectedAnswer: current.selectedAnswer,
        attempts: current.attempts,
        mistakePatterns: current.mistakePatterns,
        statistics: current.statistics,
        masteryThreshold: current.settings.masteryThreshold,
      },
      correct,
      new Date().toISOString(),
    );
    if (!update) {
      return;
    }
    reporting.current = true;
    if (current.settings.soundEffects) {
      playResultSound(correct);
    }
    const message = current.settings.feedbackMessages ? feedbackMessage(correct) : "";
    dispatch({ type: "record", update, message });
    const previous = current.currentQuestion;
    const delay = feedbackDelayMs(current.settings.feedbackMessages, reducedMotion);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      reporting.current = false;
      if (update.finished) {
        summaryRequested.current = true;
        dispatch({ type: "finish", completedAt: new Date().toISOString() });
        return;
      }
      const question = createNextQuestion(update.session, update.mistakePatterns, previous, {
        allowNegative: stateRef.current.settings.allowNegativeAnswers,
      });
      dispatch({ type: "advance", question });
    }, delay);
  };

  return { state, start, selectAnswer, flip, report, finish };
}
