import { useStatsStore } from "../stores/statsStore";
import { usePowerUpStore } from "../stores/powerUpStore";

export default function PowerUpShop({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { gems, freeze_count } = useStatsStore();
  const { freezesOwned, buyFreeze, useFreeze, loading } = usePowerUpStore();
  const totalFreezes = freeze_count || freezesOwned;

  if (!open) return null;

  const FREEZE_COST = 50;
  const canAfford = gems >= FREEZE_COST;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-warm-800">Power-Up Shop</h2>
          <div className="flex items-center gap-1.5 bg-warm-50 px-3 py-1.5 rounded-full">
            <span>💎</span>
            <span className="text-sm font-bold text-warm-700">{gems}</span>
          </div>
        </div>

        {/* Streak Freeze Card */}
        <div className="bg-gradient-to-br from-frost/20 to-blue-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🧊</div>
            <div className="flex-1">
              <h3 className="font-bold text-warm-800">Streak Freeze</h3>
              <p className="text-sm text-warm-500 mt-1">
                Protects your streak for one missed day. Use it before the
                deadline when you can't meet your daily goal.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs bg-white px-2 py-1 rounded-lg text-warm-600 font-medium">
                  Cost: 💎 {FREEZE_COST}
                </span>
                <span className="text-xs bg-white px-2 py-1 rounded-lg text-warm-600 font-medium">
                  Owned: 🧊 {totalFreezes}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={async () => {
                await buyFreeze();
                // Refetch stats to update gem count
                useStatsStore.getState().fetchStats();
              }}
              disabled={!canAfford || loading}
              className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                canAfford
                  ? "bg-frost text-white hover:bg-blue-400"
                  : "bg-warm-100 text-warm-400 cursor-not-allowed"
              }`}
            >
              {loading ? "..." : canAfford ? "Buy Freeze" : "Not enough gems"}
            </button>
            {totalFreezes > 0 && (
              <button
                onClick={async () => {
                  await useFreeze();
                  useStatsStore.getState().fetchStats();
                }}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm
                           bg-blue-50 text-frost border border-frost
                           hover:bg-blue-100 transition-colors"
              >
                Use Today
              </button>
            )}
          </div>
        </div>

        {/* Future power-ups teaser */}
        <div className="mt-4 bg-warm-50 rounded-2xl p-4 border border-warm-100 text-center">
          <p className="text-sm text-warm-400">
            🚀 More power-ups coming soon!
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-3 rounded-xl border border-warm-200
                     text-warm-600 font-medium hover:bg-warm-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
