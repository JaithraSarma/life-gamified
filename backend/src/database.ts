import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "life-gamified.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      parent_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      gems INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      freeze_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS daily_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      tasks_completed INTEGER DEFAULT 0,
      goal_met INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      daily_goal INTEGER DEFAULT 4,
      streak_deadline TEXT DEFAULT '23:59',
      notifications_enabled INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS powerup_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      used_at TEXT DEFAULT (datetime('now')),
      date_applied TEXT NOT NULL
    );

    -- Seed default rows if they don't exist
    INSERT OR IGNORE INTO user_stats (id, gems, current_streak, longest_streak, freeze_count)
    VALUES (1, 0, 0, 0, 0);

    INSERT OR IGNORE INTO settings (id, daily_goal, streak_deadline, notifications_enabled)
    VALUES (1, 4, '23:59', 1);
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
