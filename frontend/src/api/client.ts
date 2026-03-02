import type { Task, StatsResponse, Settings, PowerUpsResponse } from "../types";

const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Tasks
  getTasks: () => request<Task[]>("/tasks"),
  createTask: (title: string, parent_id?: string) =>
    request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify({ title, parent_id }),
    }),
  toggleTask: (id: string) =>
    request<Task>(`/tasks/${id}`, { method: "PATCH" }),
  deleteTask: (id: string) =>
    request<void>(`/tasks/${id}`, { method: "DELETE" }),

  // Stats
  getStats: () => request<StatsResponse>("/stats"),

  // Settings
  getSettings: () => request<Settings>("/settings"),
  updateSettings: (data: Partial<Settings>) =>
    request<Settings>("/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Power-ups
  getPowerUps: () => request<PowerUpsResponse>("/powerups"),
  buyFreeze: () =>
    request<{ message: string; gems: number; freezes_owned: number }>(
      "/powerups/freeze/buy",
      { method: "POST" }
    ),
  useFreeze: () =>
    request<{ message: string; date: string }>("/powerups/freeze/use", {
      method: "POST",
    }),
};
