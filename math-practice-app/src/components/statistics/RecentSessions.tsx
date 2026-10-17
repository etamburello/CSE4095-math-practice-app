import type { PracticeSession } from "../../types/session";
import { EmptyState } from "../common/EmptyState";
import {
  DIFFICULTY_LABELS,
  formatAccuracy,
  formatSessionLength,
  formatWhen,
  OPERATION_LABELS,
} from "../../utils/format";

export function RecentSessions({ sessions }: { sessions: PracticeSession[] }) {
  const completed = sessions.filter((session) => session.completedAt);
  return (
    <section className="stat-section" aria-labelledby="recent-sessions-heading">
      <h2 id="recent-sessions-heading">Recent sessions</h2>
      {completed.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          message="Completed practice sessions will appear here."
        />
      ) : (
        <div className="session-list">
          {completed.map((session) => (
            <article key={session.id} className="stat-card">
              <h3>{formatWhen(session.completedAt ?? session.startedAt)}</h3>
              <p>{session.operations.map((operation) => OPERATION_LABELS[operation]).join(", ")}</p>
              <p>
                Level {session.difficulty}: {DIFFICULTY_LABELS[session.difficulty]}
              </p>
              <p>{formatSessionLength(session.sessionLength)}</p>
              <p>Attempted: {session.attempted}</p>
              <p>Correct: {session.correct}</p>
              <p>Incorrect: {session.incorrect}</p>
              <p>Accuracy: {formatAccuracy(session.correct, session.attempted)}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
