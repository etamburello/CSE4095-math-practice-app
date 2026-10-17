import { formatAccuracy } from "../../utils/format";
import type { AppStatistics } from "../../types/statistics";
import { EmptyState } from "../common/EmptyState";

export function StatisticsOverview({ statistics }: { statistics: AppStatistics }) {
  if (statistics.attempted === 0) {
    return (
      <EmptyState
        title="No practice yet"
        message="Finish a practice session and your totals will show up here."
      />
    );
  }
  return (
    <div className="stat-grid">
      <Stat label="Attempted" value={String(statistics.attempted)} />
      <Stat label="Correct" value={String(statistics.correct)} />
      <Stat label="Incorrect" value={String(statistics.incorrect)} />
      <Stat label="Accuracy" value={formatAccuracy(statistics.correct, statistics.attempted)} />
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="stat-card">
      <h3>{label}</h3>
      <p>{value}</p>
    </article>
  );
}
