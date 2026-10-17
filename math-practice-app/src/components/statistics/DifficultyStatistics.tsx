import type { AppStatistics } from "../../types/statistics";
import { DIFFICULTY_LEVELS } from "../../types/question";
import { DIFFICULTY_LABELS, formatAccuracy } from "../../utils/format";

export function DifficultyStatistics({ statistics }: { statistics: AppStatistics }) {
  return (
    <section className="stat-section" aria-labelledby="difficulty-stats-heading">
      <h2 id="difficulty-stats-heading">By difficulty</h2>
      <div className="stat-grid">
        {DIFFICULTY_LEVELS.map((level) => {
          const stats = statistics.byDifficulty[level];
          return (
            <article key={level} className="stat-card">
              <h3>
                Level {level}: {DIFFICULTY_LABELS[level]}
              </h3>
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
