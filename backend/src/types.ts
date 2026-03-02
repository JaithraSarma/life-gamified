// ── Shared Types ─────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  parent_id: string | null;
  created_at: string;
  completed_at: string | null;
  subtasks?: Task[];
}

export interface UserStats {
  gems: number;
  current_streak: number;
  longest_streak: number;
  freeze_count: number;
}

export interface DailyRecord {
  id: number;
  date: string;
  tasks_completed: number;
  goal_met: boolean;
}

export interface Settings {
  daily_goal: number;
  streak_deadline: string;       // HH:mm format
  notifications_enabled: boolean;
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

export interface StatsResponse extends UserStats {
  today_completed: number;
  daily_goal: number;
  goal_met_today: boolean;
  streak_deadline: string;
}
