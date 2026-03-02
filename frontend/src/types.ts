// ── Shared Frontend Types ────────────────────────────────

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  parent_id: string | null;
  created_at: string;
  completed_at: string | null;
  subtasks?: Task[];
}

export interface StatsResponse {
  gems: number;
  current_streak: number;
  longest_streak: number;
  freeze_count: number;
  today_completed: number;
  daily_goal: number;
  goal_met_today: boolean;
  streak_deadline: string;
}

export interface Settings {
  daily_goal: number;
  streak_deadline: string;
  notifications_enabled: boolean | number;
}

export interface PowerUpInfo {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  canAfford: boolean;
}

export interface PowerUpsResponse {
  available: PowerUpInfo[];
  gems: number;
  freezes_owned: number;
}
