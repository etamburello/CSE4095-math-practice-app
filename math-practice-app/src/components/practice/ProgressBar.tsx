interface ProgressBarProps {
  completed: number;
  total: number;
  label: string;
}

export function ProgressBar({ completed, total, label }: ProgressBarProps) {
  const safeTotal = total > 0 ? total : 1;
  const percent = Math.min(100, Math.round((completed / safeTotal) * 100));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={completed}
      aria-label={label}
    >
      <span className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
