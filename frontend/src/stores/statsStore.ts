import { create } from "zustand";
import { api } from "../api/client";
import type { StatsResponse } from "../types";

interface StatsStore extends StatsResponse {
  loading: boolean;
  fetchStats: () => Promise<void>;
}

export const useStatsStore = create<StatsStore>((set) => ({
  gems: 0,
  current_streak: 0,
  longest_streak: 0,
  freeze_count: 0,
  today_completed: 0,
  daily_goal: 4,
  goal_met_today: false,
  streak_deadline: "23:59",
  loading: false,

  fetchStats: async () => {
    set({ loading: true });
    try {
      const stats = await api.getStats();
      set({ ...stats, loading: false });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      set({ loading: false });
    }
  },
}));
