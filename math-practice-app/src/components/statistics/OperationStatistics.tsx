import type { AppStatistics } from "../../types/statistics";
import { MATH_OPERATIONS } from "../../types/question";
import { formatAccuracy, OPERATION_LABELS } from "../../utils/format";

export function OperationStatistics({ statistics }: { statistics: AppStatistics }) {
  return (
    <section className="stat-section" aria-labelledby="operation-stats-heading">
      <h2 id="operation-stats-heading">By operation</h2>
      <div className="stat-grid">
        {MATH_OPERATIONS.map((operation) => {
          const stats = statistics.byOperation[operation];
          return (
            <article key={operation} className="stat-card">
              <h3>{OPERATION_LABELS[operation]}</h3>
              <p>Attempted: {stats.attempted}</p>
              <p>Correct: {stats.correct}</p>
              <p>Incorrect: {stats.incorrect}</p>
              <p>Accuracy: {formatAccuracy(stats.correct, stats.attempted)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
