interface GoalProgressBarProps {
  goal: string;
  progress: number;
  total: number;
}

export default function GoalProgressBar({ goal, progress, total }: GoalProgressBarProps) {
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;
  const done = progress >= total;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-navy-900 flex items-center gap-1">
          {done && <span className="text-green-500">✓</span>} {goal}
        </span>
        <span className="text-xs text-gray-400">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: done ? '#16a34a' : '#5265b0',
          }}
        />
      </div>
    </div>
  );
}
