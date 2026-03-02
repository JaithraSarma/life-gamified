import { useEffect, useState } from "react";
import Header from "./components/Header";
import DailyProgress from "./components/DailyProgress";
import StreakTimer from "./components/StreakTimer";
import TaskList from "./components/TaskList";
import AddTaskModal from "./components/AddTaskModal";
import PowerUpShop from "./components/PowerUpShop";
import SettingsModal from "./components/SettingsModal";
import { useTaskStore } from "./stores/taskStore";
import { useStatsStore } from "./stores/statsStore";
import { useSettingsStore } from "./stores/settingsStore";
import { usePowerUpStore } from "./stores/powerUpStore";

export default function App() {
  const [showAddTask, setShowAddTask] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const fetchStats = useStatsStore((s) => s.fetchStats);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const fetchPowerUps = usePowerUpStore((s) => s.fetchPowerUps);

  // Initial data fetch
  useEffect(() => {
    fetchTasks();
    fetchStats();
    fetchSettings();
    fetchPowerUps();
  }, [fetchTasks, fetchStats, fetchSettings, fetchPowerUps]);

  // Refresh stats whenever tasks change
  const tasks = useTaskStore((s) => s.tasks);
  useEffect(() => {
    fetchStats();
    fetchPowerUps();
  }, [tasks, fetchStats, fetchPowerUps]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="min-h-screen">
      <Header
        onOpenSettings={() => setShowSettings(true)}
        onOpenShop={() => setShowShop(true)}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">
        {/* Timer & Daily Progress */}
        <StreakTimer />
        <DailyProgress />

        {/* Task List */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-warm-700 uppercase tracking-wider">
              Tasks
            </h2>
          </div>
          <TaskList />
        </div>
      </main>

      {/* FAB — Add task */}
      <button
        onClick={() => setShowAddTask(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-warm-500 text-white rounded-2xl
                   shadow-lg shadow-warm-500/30 flex items-center justify-center
                   hover:bg-warm-600 hover:shadow-xl hover:scale-105
                   active:scale-95 transition-all z-20"
        title="Add new task"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Modals */}
      <AddTaskModal open={showAddTask} onClose={() => setShowAddTask(false)} />
      <PowerUpShop open={showShop} onClose={() => setShowShop(false)} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
