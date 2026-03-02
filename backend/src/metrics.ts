/**
 * Prometheus Metrics Module
 *
 * Exposes application-level metrics for monitoring:
 *   - HTTP request duration & count by method/route/status
 *   - Active task & subtask gauges
 *   - Gem balance & streak gauges
 *   - Node.js process metrics (memory, CPU, event loop)
 */
import client from "prom-client";
import { Request, Response, NextFunction } from "express";

// ── Default Node.js metrics (GC, heap, event loop, etc.) ─
client.collectDefaultMetrics({ prefix: "app_" });

// ── Custom Metrics ──────────────────────────────────────

/** Total HTTP requests handled, labelled by method, route, status */
export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"] as const,
});

/** Time taken to handle each request (seconds) */
export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

/** Current number of active (incomplete) tasks */
export const activeTasksGauge = new client.Gauge({
  name: "app_active_tasks",
  help: "Number of incomplete tasks",
});

/** Current number of active (incomplete) subtasks */
export const activeSubtasksGauge = new client.Gauge({
  name: "app_active_subtasks",
  help: "Number of incomplete subtasks",
});

/** Total completed tasks (cumulative counter) */
export const tasksCompletedTotal = new client.Counter({
  name: "app_tasks_completed_total",
  help: "Cumulative count of completed tasks",
});

/** Current gem balance */
export const gemsGauge = new client.Gauge({
  name: "app_gems_balance",
  help: "Current user gem balance",
});

/** Current streak length */
export const streakGauge = new client.Gauge({
  name: "app_current_streak",
  help: "Current streak length in days",
});

/** Tasks completed today (resets each day) */
export const todayCompletedGauge = new client.Gauge({
  name: "app_today_completed",
  help: "Tasks completed today",
});

// ── Express middleware — instrument every request ────────
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const end = httpRequestDuration.startTimer();

  res.on("finish", () => {
    // Normalise route: replace UUIDs with :id
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : req.path.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ":id");

    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    end(labels);
  });

  next();
}

/** Return the metrics registry (used by the /api/metrics route) */
export const register = client.register;
