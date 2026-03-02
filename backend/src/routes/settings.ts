import { Router, Request, Response } from "express";
import { getDb } from "../database";
import type { Settings } from "../types";

const router = Router();

// ── GET /api/settings ───────────────────────────────────
router.get("/", (_req: Request, res: Response) => {
  const db = getDb();
  const settings = db.prepare(`SELECT * FROM settings WHERE id = 1`).get() as Settings;
  res.json(settings);
});

// ── PATCH /api/settings ─────────────────────────────────
router.patch("/", (req: Request, res: Response) => {
  const db = getDb();
  const { daily_goal, streak_deadline, notifications_enabled } = req.body;

  const current = db.prepare(`SELECT * FROM settings WHERE id = 1`).get() as Settings;

  const updated = {
    daily_goal: daily_goal !== undefined ? Number(daily_goal) : current.daily_goal,
    streak_deadline: streak_deadline || current.streak_deadline,
    notifications_enabled:
      notifications_enabled !== undefined
        ? notifications_enabled
          ? 1
          : 0
        : current.notifications_enabled
          ? 1
          : 0,
  };

  // Validate
  if (updated.daily_goal < 1 || updated.daily_goal > 50) {
    res.status(400).json({ error: "daily_goal must be between 1 and 50" });
    return;
  }

  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!timeRegex.test(updated.streak_deadline)) {
    res.status(400).json({ error: "streak_deadline must be in HH:mm format" });
    return;
  }

  db.prepare(`
    UPDATE settings
    SET daily_goal = ?, streak_deadline = ?, notifications_enabled = ?
    WHERE id = 1
  `).run(updated.daily_goal, updated.streak_deadline, updated.notifications_enabled);

  const result = db.prepare(`SELECT * FROM settings WHERE id = 1`).get() as Settings;
  res.json(result);
});

export default router;
