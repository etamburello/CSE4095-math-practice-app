import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { DifficultySelector } from "../components/practice/DifficultySelector";
import { ModeSelector } from "../components/practice/ModeSelector";
import { OperationSelector } from "../components/practice/OperationSelector";
import { SessionLengthSelector } from "../components/practice/SessionLengthSelector";
import { useApp } from "../hooks/useApp";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { activePatterns } from "../services/mistakeService";
import type { DifficultyLevel, MathOperation } from "../types/question";
import type { PracticeMode, SessionLength } from "../types/session";

export default function PracticeSetupPage() {
  const { state, dispatch } = useApp();
  const practice = usePracticeSession();
  const [operations, setOperations] = useState<MathOperation[]>(state.settings.defaultOperations);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(state.settings.defaultDifficulty);
  const [sessionLength, setSessionLength] = useState<SessionLength>(
    state.settings.defaultSessionLength,
  );
  const [mode, setMode] = useState<PracticeMode>("regular");

  const active = useMemo(() => activePatterns(state.mistakePatterns), [state.mistakePatterns]);
  const levelCount = active.filter((pattern) => pattern.difficulty === difficulty).length;
  const reviewBlocked = mode === "mistake-review" && (active.length === 0 || levelCount === 0);
  const canStart = operations.length > 0 && !reviewBlocked;
  const inProgress = Boolean(state.currentSession && !state.currentSession.completedAt);

  return (
    <section className="setup">
      <h1>Practice setup</h1>
      {inProgress ? (
        <div className="banner">
          <p>You already have a practice session in progress.</p>
          <div className="home-actions">
            <Link className="button button-secondary" to="/practice/session">
              Continue
            </Link>
            <Button
              variant="ghost"
              onClick={() => dispatch({ type: "finish", completedAt: new Date().toISOString() })}
            >
              End that session
            </Button>
          </div>
        </div>
      ) : null}
      <OperationSelector selected={operations} onChange={setOperations} />
      <DifficultySelector selected={difficulty} onChange={setDifficulty} />
      <SessionLengthSelector selected={sessionLength} onChange={setSessionLength} />
      <ModeSelector
        selected={mode}
        activeCount={active.length}
        levelCount={levelCount}
        onChange={setMode}
      />
      {operations.length === 0 ? (
        <p className="form-error" role="alert">
          Choose at least one operation to start.
        </p>
      ) : null}
      {mode === "mistake-review" && active.length > 0 && levelCount === 0 ? (
        <p className="form-error" role="alert">
          No saved mistakes match this difficulty level yet. Try another level.
        </p>
      ) : null}
      <Button
        onClick={() =>
          practice.start({
            operations,
            difficulty,
            sessionLength,
            mode,
          })
        }
        disabled={!canStart}
      >
        Start Session
      </Button>
    </section>
  );
}
