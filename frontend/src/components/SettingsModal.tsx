import { useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import toast from "react-hot-toast";

export default function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { daily_goal, streak_deadline, notifications_enabled, updateSettings } =
    useSettingsStore();

  const [goal, setGoal] = useState(daily_goal);
  const [deadline, setDeadline] = useState(streak_deadline);
  const [notifs, setNotifs] = useState(!!notifications_enabled);

  if (!open) return null;

  const handleSave = async () => {
    await updateSettings({
      daily_goal: goal,
      streak_deadline: deadline,
      notifications_enabled: notifs,
    });

    // Request notification permission if enabling
    if (notifs && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    toast.success("Settings saved!");
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-warm-800 mb-6">Settings</h2>

        {/* Daily Goal */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-warm-700 mb-2">
            Daily Task Goal
          </label>
          <p className="text-xs text-warm-400 mb-2">
            Minimum tasks to complete each day to maintain your streak
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGoal(Math.max(1, goal - 1))}
              className="w-10 h-10 rounded-xl bg-warm-100 text-warm-600 font-bold
                         hover:bg-warm-200 transition-colors"
            >
              -
            </button>
            <span className="text-2xl font-extrabold text-warm-700 w-12 text-center">
              {goal}
            </span>
            <button
              onClick={() => setGoal(Math.min(50, goal + 1))}
              className="w-10 h-10 rounded-xl bg-warm-100 text-warm-600 font-bold
                         hover:bg-warm-200 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Streak Deadline */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-warm-700 mb-2">
            Streak Deadline
          </label>
          <p className="text-xs text-warm-400 mb-2">
            Complete your daily goal before this time to keep your streak
          </p>
          <input
            type="time"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-warm-200
                       focus:outline-none focus:ring-2 focus:ring-warm-300 bg-warm-50"
          />
        </div>

        {/* Notifications */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-warm-700">Notifications</p>
              <p className="text-xs text-warm-400">
                Get alerted before streak deadline
              </p>
            </div>
            <button
              onClick={() => setNotifs(!notifs)}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                notifs ? "bg-warm-500" : "bg-warm-200"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
                  notifs ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-warm-200
                       text-warm-600 font-medium hover:bg-warm-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 rounded-xl bg-warm-500 text-white font-semibold
                       hover:bg-warm-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
