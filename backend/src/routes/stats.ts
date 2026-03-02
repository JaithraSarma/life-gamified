import { Router, Request, Response } from "express";
import { getDb } from "../database";
import type { StatsResponse, Settings } from "../types";

const router = Router();

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── GET /api/stats ──────────────────────────────────────
router.get("/", (_req: Request, res: Response) => {
  const db = getDb();
  const today = todayStr();

  const stats = db.prepare(`SELECT * FROM user_stats WHERE id = 1`).get() as any;
  const settings = db.prepare(`SELECT * FROM settings WHERE id = 1`).get() as Settings;

  // Ensure daily record exists for today
  db.prepare(`INSERT OR IGNORE INTO daily_records (date, tasks_completed, goal_met) VALUES (?, 0, 0)`).run(today);
  const daily = db.prepare(`SELECT * FROM daily_records WHERE date = ?`).get(today) as any;

  // ── Check streak continuity ───────────────────────
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const yesterdayRecord = db.prepare(`SELECT goal_met FROM daily_records WHERE date = ?`).get(yesterdayStr) as { goal_met: number } | undefined;
  const yesterdayFroze = db.prepare(`SELECT id FROM powerup_log WHERE type = 'freeze' AND date_applied = ?`).get(yesterdayStr);

  let currentStreak = stats.current_streak;

  // If yesterday wasn't met and no freeze was used, streak resets
  if (currentStreak > 0 && !daily.goal_met) {
    if (!yesterdayRecord?.goal_met && !yesterdayFroze) {
      currentStreak = 0;
      db.prepare(`UPDATE user_stats SET current_streak = 0 WHERE id = 1`).run();
    }
  }

  const response: StatsResponse = {
    gems: stats.gems,
    current_streak: currentStreak,
    longest_streak: stats.longest_streak,
    freeze_count: stats.freeze_count,
    today_completed: daily.tasks_completed,
    daily_goal: settings.daily_goal,
    goal_met_today: !!daily.goal_met,
    streak_deadline: settings.streak_deadline,
  };

  res.json(response);
});

export default router;
