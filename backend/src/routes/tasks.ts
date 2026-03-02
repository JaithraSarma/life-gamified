import { Router, Request, Response } from "express";
import { getDb } from "../database";
import { v4 as uuidv4 } from "uuid";
import type { Task } from "../types";
import {
  activeTasksGauge,
  activeSubtasksGauge,
  tasksCompletedTotal,
  gemsGauge,
  streakGauge,
  todayCompletedGauge,
} from "../metrics";

const router = Router();

// ── Helper: today's date string ─────────────────────────
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Re-sync all Prometheus gauges from DB (called after mutations) */
function refreshGauges(): void {
  const db = getDb();
  const mainCount = (db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE completed = 0 AND parent_id IS NULL`).get() as any).c;
  const subCount  = (db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE completed = 0 AND parent_id IS NOT NULL`).get() as any).c;
  const stats     = db.prepare(`SELECT * FROM user_stats WHERE id = 1`).get() as any;
  const today     = todayStr();

  db.prepare(`INSERT OR IGNORE INTO daily_records (date, tasks_completed, goal_met) VALUES (?, 0, 0)`).run(today);
  const daily = db.prepare(`SELECT tasks_completed FROM daily_records WHERE date = ?`).get(today) as any;

  activeTasksGauge.set(mainCount);
  activeSubtasksGauge.set(subCount);
  gemsGauge.set(stats.gems);
  streakGauge.set(stats.current_streak);
  todayCompletedGauge.set(daily.tasks_completed);
}

// ── GET /api/tasks — list all tasks grouped by parent ───
router.get("/", (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM tasks ORDER BY created_at ASC`).all() as Task[];

  // Build hierarchy
  const mainTasks = rows.filter((t) => !t.parent_id).map((t) => ({
    ...t,
    completed: !!t.completed,
    subtasks: rows
      .filter((s) => s.parent_id === t.id)
      .map((s) => ({ ...s, completed: !!s.completed })),
  }));

  res.json(mainTasks);
});

// ── POST /api/tasks — create a task ─────────────────────
router.post("/", (req: Request, res: Response) => {
  const { title, parent_id } = req.body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  // If parent_id is provided, validate it exists and is a main task
  if (parent_id) {
    const db = getDb();
    const parent = db.prepare(`SELECT id, parent_id FROM tasks WHERE id = ?`).get(parent_id) as Task | undefined;
    if (!parent) {
      res.status(404).json({ error: "Parent task not found" });
      return;
    }
    if (parent.parent_id) {
      res.status(400).json({ error: "Cannot nest subtasks more than one level" });
      return;
    }
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare(`INSERT INTO tasks (id, title, parent_id) VALUES (?, ?, ?)`).run(id, title.trim(), parent_id || null);

  const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as Task;
  refreshGauges();
  res.status(201).json({ ...task, completed: !!task.completed });
});

// ── PATCH /api/tasks/:id — toggle completion ────────────
router.patch("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(req.params.id) as Task | undefined;

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const newCompleted = !task.completed;
  const completedAt = newCompleted ? new Date().toISOString() : null;

  db.prepare(`UPDATE tasks SET completed = ?, completed_at = ? WHERE id = ?`).run(
    newCompleted ? 1 : 0,
    completedAt,
    task.id
  );

  // ── Award / revoke gems ─────────────────────────────
  const isSubtask = !!task.parent_id;
  const gemDelta = isSubtask ? 2 : 10;

  if (newCompleted) {
    db.prepare(`UPDATE user_stats SET gems = gems + ? WHERE id = 1`).run(gemDelta);
  } else {
    // Revoke gems on un-complete, floor at 0
    db.prepare(`UPDATE user_stats SET gems = MAX(0, gems - ?) WHERE id = 1`).run(gemDelta);
  }

  // ── Update daily record ─────────────────────────────
  const today = todayStr();
  const settings = db.prepare(`SELECT daily_goal FROM settings WHERE id = 1`).get() as { daily_goal: number };

  // Ensure daily record exists
  db.prepare(`INSERT OR IGNORE INTO daily_records (date, tasks_completed, goal_met) VALUES (?, 0, 0)`).run(today);

  // Count today's completed tasks
  const countRow = db.prepare(`
    SELECT COUNT(*) as cnt FROM tasks
    WHERE completed = 1 AND DATE(completed_at) = ?
  `).get(today) as { cnt: number };

  const tasksToday = countRow.cnt;
  const goalMet = tasksToday >= settings.daily_goal ? 1 : 0;

  db.prepare(`UPDATE daily_records SET tasks_completed = ?, goal_met = ? WHERE date = ?`).run(
    tasksToday, goalMet, today
  );

  // ── Update streak ───────────────────────────────────
  if (goalMet && newCompleted) {
    // Check if streak was already counted today
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const yesterdayRecord = db.prepare(`SELECT goal_met FROM daily_records WHERE date = ?`).get(yesterdayStr) as { goal_met: number } | undefined;
    const yesterdayFroze = db.prepare(`SELECT id FROM powerup_log WHERE type = 'freeze' AND date_applied = ?`).get(yesterdayStr);

    const stats = db.prepare(`SELECT * FROM user_stats WHERE id = 1`).get() as any;
    let newStreak = stats.current_streak;

    // If this is the first time meeting goal today
    const prevDailyRecord = db.prepare(`SELECT goal_met FROM daily_records WHERE date = ? AND goal_met = 1`).get(today);
    if (!prevDailyRecord || tasksToday === settings.daily_goal) {
      if (yesterdayRecord?.goal_met || yesterdayFroze || stats.current_streak === 0) {
        newStreak = stats.current_streak + 1;
      } else {
        newStreak = 1; // Streak broken, start fresh
      }

      const longestStreak = Math.max(stats.longest_streak, newStreak);
      db.prepare(`UPDATE user_stats SET current_streak = ?, longest_streak = ? WHERE id = 1`).run(newStreak, longestStreak);
    }
  }

  if (newCompleted) {
    tasksCompletedTotal.inc();
  }

  const updated = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(task.id) as Task;
  refreshGauges();
  res.json({ ...updated, completed: !!updated.completed });
});

// ── DELETE /api/tasks/:id ───────────────────────────────
router.delete("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(req.params.id) as Task | undefined;

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  // Delete subtasks first (CASCADE should handle, but be explicit)
  db.prepare(`DELETE FROM tasks WHERE parent_id = ?`).run(task.id);
  db.prepare(`DELETE FROM tasks WHERE id = ?`).run(task.id);

  refreshGauges();
  res.status(204).send();
});

export default router;
