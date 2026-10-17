import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { useApp } from "../hooks/useApp";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { activePatterns } from "../services/mistakeService";
import { countMistakeReviews } from "../services/practiceService";
import { DIFFICULTY_LABELS, formatAccuracy, OPERATION_LABELS } from "../utils/format";

export default function SessionSummaryPage() {
  const { state } = useApp();
  const practice = usePracticeSession();
  const navigate = useNavigate();
  const session = state.summarySession ?? state.sessions.find((item) => item.completedAt) ?? null;

  if (!session) {
    return (
      <EmptyState
        title="No summary yet"
        message="Finish a practice session to see how you did."
        action={<Button onClick={() => navigate("/practice/setup")}>Start Practice</Button>}
      />
    );
  }

  const reviewCount = countMistakeReviews(state.attempts, session.id);
  const hasMistakes = activePatterns(state.mistakePatterns).some(
    (pattern) => pattern.difficulty === session.difficulty,
  );

  return (
    <section className="summary">
      <h1>Session summary</h1>
      <div className="stat-grid">
        <article className="stat-card">
          <h2>Attempted</h2>
          <p>{session.attempted}</p>
        </article>
        <article className="stat-card">
          <h2>Correct</h2>
          <p>{session.correct}</p>
        </article>
        <article className="stat-card">
          <h2>Incorrect</h2>
          <p>{session.incorrect}</p>
        </article>
        <article className="stat-card">
          <h2>Accuracy</h2>
          <p>{formatAccuracy(session.correct, session.attempted)}</p>
        </article>
      </div>
      <p>
        Operations: {session.operations.map((operation) => OPERATION_LABELS[operation]).join(", ")}
      </p>
      <p>
        Difficulty: Level {session.difficulty}, {DIFFICULTY_LABELS[session.difficulty]}
      </p>
      <p>Mistake-review questions: {reviewCount}</p>
      <div className="home-actions">
        <Button
          onClick={() =>
            practice.start({
              operations: session.operations,
              difficulty: session.difficulty,
              sessionLength: session.sessionLength,
              mode: session.mode,
            })
          }
        >
          Practice Again
        </Button>
        <Button
          variant="secondary"
          disabled={!hasMistakes}
          onClick={() =>
            practice.start({
              operations: session.operations,
              difficulty: session.difficulty,
              sessionLength: session.sessionLength,
              mode: "mistake-review",
            })
          }
        >
          Practice Mistakes
        </Button>
        <Button variant="ghost" onClick={() => navigate("/practice/setup")}>
          Change Settings
        </Button>
        <Button variant="ghost" onClick={() => navigate("/statistics")}>
          View Statistics
        </Button>
        <Button variant="ghost" onClick={() => navigate("/")}>
          Return Home
        </Button>
      </div>
    </section>
  );
}
