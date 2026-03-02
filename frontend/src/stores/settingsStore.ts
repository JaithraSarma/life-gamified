import { create } from "zustand";
import { api } from "../api/client";
import type { Settings } from "../types";

interface SettingsStore extends Settings {
  loading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  daily_goal: 4,
  streak_deadline: "23:59",
  notifications_enabled: true,
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const settings = await api.getSettings();
      set({ ...settings, loading: false });
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      set({ loading: false });
    }
  },

  updateSettings: async (data: Partial<Settings>) => {
    try {
      const updated = await api.updateSettings(data);
      set({ ...updated });
    } catch (err) {
      console.error("Failed to update settings:", err);
    }
  },
}));
