import { useState } from "react";
import { Button } from "../components/common/Button";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { DifficultyStatistics } from "../components/statistics/DifficultyStatistics";
import { MistakeStatistics } from "../components/statistics/MistakeStatistics";
import { OperationStatistics } from "../components/statistics/OperationStatistics";
import { RecentSessions } from "../components/statistics/RecentSessions";
import { StatisticsOverview } from "../components/statistics/StatisticsOverview";
import { useApp } from "../hooks/useApp";
import { useStatistics } from "../hooks/useStatistics";

export default function StatisticsPage() {
  const stats = useStatistics();
  const { state, dispatch } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <section className="statistics-page">
      <h1>Statistics</h1>
      <StatisticsOverview statistics={stats.statistics} />
      <OperationStatistics statistics={stats.statistics} />
      <DifficultyStatistics statistics={stats.statistics} />
      <MistakeStatistics
        active={stats.activeMistakes}
        mastered={stats.masteredMistakes}
        mostMissed={stats.mostMissed}
        topFacts={stats.topFacts}
        reviewAttempted={stats.reviewAttempted}
        reviewCorrect={stats.reviewCorrect}
        masteryThreshold={state.settings.masteryThreshold}
      />
      <RecentSessions sessions={stats.sessions} />
      <Button variant="danger" onClick={() => setConfirmReset(true)}>
        Reset Statistics
      </Button>
      {confirmReset ? (
        <ConfirmDialog
          title="Reset statistics?"
          message="Are you sure you want to erase all practice history and statistics?"
          confirmLabel="Erase history"
          tone="danger"
          onConfirm={() => {
            dispatch({ type: "resetStatistics" });
            setConfirmReset(false);
          }}
          onCancel={() => setConfirmReset(false)}
        />
      ) : null}
    </section>
  );
}
