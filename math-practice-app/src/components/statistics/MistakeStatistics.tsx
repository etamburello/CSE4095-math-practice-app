import type { MistakePattern } from "../../types/mistake";
import type { MathOperation } from "../../types/question";
import { EmptyState } from "../common/EmptyState";
import { formatQuestion, formatWhen, OPERATION_LABELS } from "../../utils/format";

interface MistakeStatisticsProps {
  active: MistakePattern[];
  mastered: MistakePattern[];
  mostMissed: MathOperation[];
  topFacts: MistakePattern[];
  reviewAttempted: number;
  reviewCorrect: number;
  masteryThreshold: number;
}

export function MistakeStatistics({
  active,
  mastered,
  mostMissed,
  topFacts,
  reviewAttempted,
  reviewCorrect,
  masteryThreshold,
}: MistakeStatisticsProps) {
  const missedLabel =
    mostMissed.length === 0
      ? "None yet"
      : mostMissed.map((operation) => OPERATION_LABELS[operation]).join(" and ");

  return (
    <section className="stat-section" aria-labelledby="mistake-stats-heading">
      <h2 id="mistake-stats-heading">Mistake review</h2>
      <div className="stat-grid">
        <article className="stat-card">
          <h3>Active mistakes</h3>
          <p>{active.length}</p>
        </article>
        <article className="stat-card">
          <h3>Mastered patterns</h3>
          <p>{mastered.length}</p>
        </article>
        <article className="stat-card">
          <h3>Similar questions practiced</h3>
          <p>{reviewAttempted}</p>
        </article>
        <article className="stat-card">
          <h3>Review questions correct</h3>
          <p>{reviewCorrect}</p>
        </article>
      </div>
      <p className="selector-help">Most frequently missed operation: {missedLabel}</p>
      {topFacts.length === 0 ? (
        <EmptyState
          title="No missed facts yet"
          message="Questions you mark wrong will be listed here."
        />
      ) : (
        <div className="fact-list">
          <h3>Frequently missed facts</h3>
          <ul>
            {topFacts.map((pattern) => (
              <li key={pattern.id}>
                <span>
                  {formatQuestion(pattern.operation, pattern.firstOperand, pattern.secondOperand)}
                </span>
                <span>
                  Wrong {pattern.incorrectCount} time{pattern.incorrectCount === 1 ? "" : "s"}
                </span>
                <span>
                  Mastery {pattern.similarCorrectCount} of {masteryThreshold}
                  {pattern.mastered ? " (mastered)" : ""}
                </span>
                <span>Last miss {formatWhen(pattern.lastIncorrectAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {mastered.length > 0 ? (
        <div className="fact-list">
          <h3>Mastered patterns</h3>
          <ul>
            {mastered.map((pattern) => (
              <li key={pattern.id}>
                <span>
                  {formatQuestion(pattern.operation, pattern.firstOperand, pattern.secondOperand)}
                </span>
                <span>Mastered</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
