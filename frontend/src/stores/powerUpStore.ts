import { create } from "zustand";
import { api } from "../api/client";
import toast from "react-hot-toast";

interface PowerUpStore {
  freezesOwned: number;
  loading: boolean;
  fetchPowerUps: () => Promise<void>;
  buyFreeze: () => Promise<void>;
  useFreeze: () => Promise<void>;
}

export const usePowerUpStore = create<PowerUpStore>((set) => ({
  freezesOwned: 0,
  loading: false,

  fetchPowerUps: async () => {
    try {
      const data = await api.getPowerUps();
      set({ freezesOwned: data.freezes_owned });
    } catch (err) {
      console.error("Failed to fetch power-ups:", err);
    }
  },

  buyFreeze: async () => {
    set({ loading: true });
    try {
      const result = await api.buyFreeze();
      set({ freezesOwned: result.freezes_owned, loading: false });
      toast.success("Streak Freeze purchased! 🧊");
    } catch (err) {
      set({ loading: false });
      toast.error(err instanceof Error ? err.message : "Failed to buy freeze");
    }
  },

  useFreeze: async () => {
    set({ loading: true });
    try {
      await api.useFreeze();
      set((s) => ({ freezesOwned: s.freezesOwned - 1, loading: false }));
      toast.success("Streak freeze activated! 🧊");
    } catch (err) {
      set({ loading: false });
      toast.error(err instanceof Error ? err.message : "Failed to use freeze");
    }
  },
}));
