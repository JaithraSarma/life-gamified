import express from "express";
import cors from "cors";
import taskRoutes from "./routes/tasks";
import statsRoutes from "./routes/stats";
import settingsRoutes from "./routes/settings";
import powerupRoutes from "./routes/powerups";
import { getDb, closeDb } from "./database";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// ── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  try {
    getDb(); // Ensure DB is connected
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "unhealthy" });
  }
});

// ── Routes ──────────────────────────────────────────────
app.use("/api/tasks", taskRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/powerups", powerupRoutes);

// ── Error handler ───────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ───────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`🎮 Life Gamified API running on http://localhost:${PORT}`);
  getDb(); // Initialize database
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down...");
  closeDb();
  server.close();
});

process.on("SIGINT", () => {
  console.log("Shutting down...");
  closeDb();
  server.close();
});

export default app;
