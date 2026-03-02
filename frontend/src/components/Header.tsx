import { useStatsStore } from "../stores/statsStore";

export default function Header({
  onOpenSettings,
  onOpenShop,
}: {
  onOpenSettings: () => void;
  onOpenShop: () => void;
}) {
  const { gems, current_streak, longest_streak } = useStatsStore();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-warm-100">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <h1 className="text-xl font-extrabold text-warm-800 tracking-tight">
          Life<span className="text-warm-500">Gamified</span>
        </h1>

        {/* Stats bar */}
        <div className="flex items-center gap-4">
          {/* Streak */}
          <button
            className="flex items-center gap-1.5 group"
            title={`Longest streak: ${longest_streak} days`}
          >
            <span
              className={`text-xl ${
                current_streak > 0 ? "animate-flame" : "grayscale opacity-50"
              }`}
            >
              🔥
            </span>
            <span
              className={`text-sm font-bold ${
                current_streak > 0 ? "text-warm-700 streak-glow" : "text-warm-400"
              }`}
            >
              {current_streak}
            </span>
          </button>

          {/* Gems */}
          <button
            onClick={onOpenShop}
            className="flex items-center gap-1.5 bg-warm-50 px-3 py-1.5 rounded-full
                       hover:bg-warm-100 transition-colors cursor-pointer"
            title="Open Shop"
          >
            <span className="text-lg">💎</span>
            <span className="text-sm font-bold text-warm-700">{gems}</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full hover:bg-warm-100 transition-colors"
            title="Settings"
          >
            <svg
              className="w-5 h-5 text-warm-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
