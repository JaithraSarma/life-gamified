import { useState } from "react";
import { useStatsStore } from "../stores/statsStore";

export default function StreakTimer() {
  const { streak_deadline, current_streak, goal_met_today } = useStatsStore();
  const [timeLeft, setTimeLeft] = useState("");
  const [urgent, setUrgent] = useState(false);

  // Calculate time remaining until deadline
  useState(() => {
    const updateTimer = () => {
      const now = new Date();
      const [hours, minutes] = streak_deadline.split(":").map(Number);
      const deadline = new Date();
      deadline.setHours(hours, minutes, 0, 0);

      // If deadline has passed, show next day
      if (now > deadline) {
        deadline.setDate(deadline.getDate() + 1);
      }

      const diff = deadline.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      setUrgent(h === 0 && m < 60);

      // Send notification if < 30min and goal not met
      if (h === 0 && m === 30 && s === 0 && !goal_met_today && current_streak > 0) {
        sendNotification();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  });

  const sendNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("⏰ Life Gamified", {
        body: `Only 30 minutes left! Complete your tasks to keep your ${current_streak}-day streak alive!`,
        icon: "🔥",
      });
    }
  };

  if (goal_met_today) return null;
  if (current_streak === 0 && !goal_met_today) {
    return (
      <div className="bg-warm-50 rounded-2xl px-4 py-3 border border-warm-100 text-center">
        <p className="text-sm text-warm-600">
          Complete your daily goal to start a streak! 🔥
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl px-4 py-3 border text-center transition-colors ${
        urgent
          ? "bg-red-50 border-red-200"
          : "bg-warm-50 border-warm-100"
      }`}
    >
      <p className={`text-xs font-medium ${urgent ? "text-red-500" : "text-warm-500"}`}>
        {urgent ? "⚠️ HURRY!" : "⏰"} Time to complete daily goal
      </p>
      <p
        className={`text-2xl font-extrabold tracking-wider mt-1 ${
          urgent ? "text-red-600" : "text-warm-700"
        }`}
      >
        {timeLeft}
      </p>
    </div>
  );
}
