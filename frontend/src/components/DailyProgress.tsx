import { useStatsStore } from "../stores/statsStore";

export default function DailyProgress() {
  const { today_completed, daily_goal, goal_met_today } = useStatsStore();
  const progress = Math.min((today_completed / daily_goal) * 100, 100);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-warm-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-warm-700">Daily Progress</span>
        <span className="text-sm font-bold text-warm-600">
          {today_completed}/{daily_goal}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-warm-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            goal_met_today
              ? "bg-gradient-to-r from-sage to-green-400"
              : "bg-gradient-to-r from-warm-400 to-warm-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {goal_met_today && (
        <p className="text-xs text-sage font-semibold mt-2 flex items-center gap-1">
          <span>✅</span> Daily goal reached! Streak maintained!
        </p>
      )}
    </div>
  );
}
