import { Router, Request, Response } from "express";
import { getDb } from "../database";

const router = Router();

const FREEZE_COST = 50;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── GET /api/powerups — list available powerups ─────────
router.get("/", (_req: Request, res: Response) => {
  const db = getDb();
  const stats = db.prepare(`SELECT gems, freeze_count FROM user_stats WHERE id = 1`).get() as {
    gems: number;
    freeze_count: number;
  };

  res.json({
    available: [
      {
        id: "freeze",
        name: "Streak Freeze",
        description: "Protects your streak for one missed day",
        cost: FREEZE_COST,
        icon: "🧊",
        canAfford: stats.gems >= FREEZE_COST,
      },
    ],
    gems: stats.gems,
    freezes_owned: stats.freeze_count,
  });
});

// ── POST /api/powerups/freeze — buy a streak freeze ─────
router.post("/freeze/buy", (_req: Request, res: Response) => {
  const db = getDb();
  const stats = db.prepare(`SELECT gems, freeze_count FROM user_stats WHERE id = 1`).get() as {
    gems: number;
    freeze_count: number;
  };

  if (stats.gems < FREEZE_COST) {
    res.status(400).json({ error: "Not enough gems", required: FREEZE_COST, current: stats.gems });
    return;
  }

  db.prepare(`UPDATE user_stats SET gems = gems - ?, freeze_count = freeze_count + 1 WHERE id = 1`).run(FREEZE_COST);

  const updated = db.prepare(`SELECT gems, freeze_count FROM user_stats WHERE id = 1`).get() as any;
  res.json({ message: "Streak Freeze purchased!", gems: updated.gems, freezes_owned: updated.freeze_count });
});

// ── POST /api/powerups/freeze/use — use a freeze today ──
router.post("/freeze/use", (_req: Request, res: Response) => {
  const db = getDb();
  const stats = db.prepare(`SELECT freeze_count FROM user_stats WHERE id = 1`).get() as { freeze_count: number };

  if (stats.freeze_count <= 0) {
    res.status(400).json({ error: "No streak freezes available. Buy one first!" });
    return;
  }

  const today = todayStr();

  // Check if already used today
  const existing = db.prepare(`SELECT id FROM powerup_log WHERE type = 'freeze' AND date_applied = ?`).get(today);
  if (existing) {
    res.status(400).json({ error: "Streak freeze already active for today" });
    return;
  }

  db.prepare(`UPDATE user_stats SET freeze_count = freeze_count - 1 WHERE id = 1`).run();
  db.prepare(`INSERT INTO powerup_log (type, date_applied) VALUES ('freeze', ?)`).run(today);

  res.json({ message: "Streak freeze activated for today! 🧊", date: today });
});

export default router;
