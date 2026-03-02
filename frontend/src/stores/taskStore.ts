import { create } from "zustand";
import { api } from "../api/client";
import type { Task } from "../types";
import toast from "react-hot-toast";

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (title: string, parentId?: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const tasks = await api.getTasks();
      set({ tasks, loading: false });
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      set({ loading: false });
    }
  },

  addTask: async (title: string, parentId?: string) => {
    try {
      await api.createTask(title, parentId);
      await get().fetchTasks();
      toast.success(parentId ? "Sub-task added!" : "Task added! 🎯");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add task");
    }
  },

  toggleTask: async (id: string) => {
    try {
      const result = await api.toggleTask(id);
      await get().fetchTasks();
      if (result.completed) {
        const isSubtask = !!result.parent_id;
        toast.success(`+${isSubtask ? 2 : 10} gems! 💎`, { duration: 1500 });
      }
    } catch (err) {
      toast.error("Failed to update task");
      console.error(err);
    }
  },

  deleteTask: async (id: string) => {
    try {
      await api.deleteTask(id);
      await get().fetchTasks();
      toast.success("Task removed");
    } catch (err) {
      toast.error("Failed to delete task");
      console.error(err);
    }
  },
}));
