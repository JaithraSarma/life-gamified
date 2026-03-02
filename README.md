# 🎮 Life Gamified

> A Duolingo-inspired productivity app that turns your to-do list into an RPG. Complete tasks to earn gems, maintain daily streaks, buy power-ups, and level up your real life.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-000000?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?logo=terraform&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?logo=grafana&logoColor=white)
![Azure DevOps](https://img.shields.io/badge/Azure_DevOps-0078D7?logo=azuredevops&logoColor=white)

---

## Table of Contents

1.  [What This Project Is](#what-this-project-is)
2.  [Core Concepts & Game Mechanics](#core-concepts--game-mechanics)
3.  [Tech Stack — Why Each Tool Was Chosen](#tech-stack--why-each-tool-was-chosen)
4.  [Project Structure — Every File Explained](#project-structure--every-file-explained)
5.  [Architecture Overview](#architecture-overview)
6.  [Database Schema](#database-schema)
7.  [API Reference — Every Endpoint](#api-reference--every-endpoint)
8.  [UI→Backend Workflow — Every Click Traced](#uibackend-workflow--every-click-traced)
9.  [Frontend Deep Dive](#frontend-deep-dive)
10. [Backend Deep Dive](#backend-deep-dive)
11. [Monitoring & Observability](#monitoring--observability)
12. [Docker & Docker Compose](#docker--docker-compose)
13. [Kubernetes (K8s)](#kubernetes-k8s)
14. [Terraform — Infrastructure as Code](#terraform--infrastructure-as-code)
15. [CI/CD — GitHub Actions](#cicd--github-actions)
16. [CI/CD — Azure DevOps](#cicd--azure-devops)
17. [How to Run Everything](#how-to-run-everything)
18. [Scripts & Utilities](#scripts--utilities)
19. [Testing](#testing)
20. [Troubleshooting](#troubleshooting)

---

## What This Project Is

**Life Gamified** is a full-stack productivity application inspired by the gamification mechanics of apps like **Duolingo**. Instead of learning languages, you're completing real-life tasks. The app rewards you for consistency:

- **Gems (💎)**: You earn 10 gems for completing a main task and 2 gems for a subtask. Un-completing a task revokes the gems.
- **Streaks (🔥)**: Complete your daily goal before the deadline to keep your streak alive. Miss a day and your streak resets to zero — unless you use a **Streak Freeze**.
- **Daily Progress Bar**: A visual bar shows how many tasks you've completed today vs. your daily goal.
- **Streak Timer**: A countdown clock that ticks down to your streak deadline, with a browser notification 30 minutes before deadline if you haven't met your goal yet.
- **Power-Up Shop**: Spend gems to buy Streak Freezes that protect your streak on off days.

The project isn't just the app — it includes a **complete production-grade DevOps pipeline**: Docker multi-stage builds, Kubernetes deployments, Terraform infrastructure-as-code, **dual CI/CD pipelines with both GitHub Actions and Azure DevOps**, and a Prometheus + Grafana monitoring stack with 14 custom dashboard panels.

---

## Core Concepts & Game Mechanics

### Gem Economy

| Action             | Gems   |
|--------------------|--------|
| Complete a **task**    | **+10** 💎 |
| Complete a **subtask** | **+2** 💎  |
| Un-complete a task     | Gems revoked (floor at 0) |
| Buy a Streak Freeze    | **−50** 💎 |

Gems are stored in the `user_stats` table and tracked in real time. Every gem change is reflected instantly in the header and in the Prometheus `app_gems_balance` gauge.

### Streak System

1. **Daily Goal**: A configurable number of tasks you must complete per day (default: 4).
2. **Streak Deadline**: The time by which you must meet your goal (default: 23:59). Configurable in settings.
3. **Streak Growth**: When you meet your daily goal, your streak increments by 1. If yesterday's goal was also met (or a freeze was used), the streak continues. Otherwise it resets to 1.
4. **Streak Freeze**: A power-up that retroactively protects your streak if you missed yesterday's goal. Costs 50 gems to buy; one use protects one day.

### Task Hierarchy

Tasks can have **one level of nesting**:

```
📋 Main Task (parent_id = null)
  └── 📌 Subtask 1 (parent_id = main_task_id)
  └── 📌 Subtask 2 (parent_id = main_task_id)
```

You cannot nest a subtask under another subtask — the backend enforces `parent.parent_id must be null`.

---

## Tech Stack — Why Each Tool Was Chosen

| Layer         | Technology                     | Why                                                                                    |
|---------------|--------------------------------|----------------------------------------------------------------------------------------|
| **Frontend**  | React 18 + TypeScript          | Component-based UI with type safety. Hooks for state, effects.                        |
| **Bundler**   | Vite v7                        | Sub-second HMR, native ESM dev server, instant builds.                                |
| **Styling**   | Tailwind CSS v3.4              | Utility-first — no CSS files to manage, responsive by default.                        |
| **State**     | Zustand                        | Minimal boilerplate, no Provider wrappers, works with async actions.                  |
| **Toasts**    | react-hot-toast                | Declarative toast notifications for gem awards, errors, etc.                          |
| **Backend**   | Express + TypeScript           | Battle-tested HTTP framework, rich middleware ecosystem, TypeScript for safety.        |
| **Database**  | SQLite (better-sqlite3)        | Zero-config, single-file DB, synchronous API (perfect for single-user app), WAL mode. |
| **IDs**       | uuid (v4)                      | Collision-resistant unique IDs without auto-increment coupling.                       |
| **Metrics**   | prom-client                    | Official Prometheus client for Node.js — exposes `/metrics` in Prometheus text format.|
| **Container** | Docker (multi-stage builds)    | Reproducible builds, separate build/runtime stages = small images.                    |
| **Orchestration** | Docker Compose             | One command to spin up 4 services (backend, frontend, Prometheus, Grafana).           |
| **K8s**       | Kubernetes (Docker Desktop)    | Practice production-grade orchestration: replicas, PVC, Ingress, liveness probes.     |
| **IaC**       | Terraform + Docker Provider    | Declarative infra — `plan → apply → destroy` lifecycle for containers.                |
| **CI**        | GitHub Actions + Azure DevOps  | Dual-platform CI: lint, test, build, Docker build, Trivy security scan on both.       |
| **CD**        | GHCR + Azure Container Registry| Push images to GHCR (GitHub) and ACR (Azure), deploy to K8s (gated).                 |
| **Monitoring**| Prometheus v3.3.0              | Pull-based metrics scraping every 15s, PromQL query language.                         |
| **Dashboards**| Grafana v11.6.0                | 14-panel provisioned dashboard, auto-configured datasource, zero manual setup.        |

---

## Project Structure — Every File Explained

```
Life Gamified/
│
├── README.md                           ← You are here. The master guide.
│
├── ─── FRONTEND ─────────────────────────────────────────────
├── frontend/
│   ├── package.json                    ← NPM manifest: deps, scripts (dev, build, lint, preview)
│   ├── tsconfig.json                   ← TypeScript config: strict mode, JSX, path aliases
│   ├── tsconfig.node.json              ← TS config for Vite config file itself
│   ├── vite.config.ts                  ← Vite config: React plugin, dev server proxy (/api → backend:3001)
│   ├── tailwind.config.js              ← Tailwind config: custom colors (warm-*, frost, streak, gem)
│   ├── postcss.config.js               ← PostCSS: just Tailwind + autoprefixer
│   ├── index.html                      ← HTML shell: <div id="root">, loads /src/main.tsx
│   ├── Dockerfile                      ← Multi-stage: Node 20 build → Nginx serve
│   ├── nginx.conf                      ← Nginx: SPA fallback, /api proxy, static asset caching
│   │
│   └── src/
│       ├── main.tsx                    ← ReactDOM.createRoot → renders <App />
│       ├── App.tsx                     ← Root component: fetches all data, manages 3 modals, renders layout
│       ├── index.css                   ← Tailwind directives + custom component classes (modal, card, etc.)
│       │
│       ├── api/
│       │   └── client.ts              ← HTTP client: generic request<T>() + all API endpoint functions
│       │
│       ├── components/
│       │   ├── Header.tsx             ← Top bar: brand name, streak count, gem count, shop/settings buttons
│       │   ├── DailyProgress.tsx      ← Progress bar: today_completed / daily_goal
│       │   ├── StreakTimer.tsx         ← Countdown to streak deadline + browser notification at 30min
│       │   ├── TaskList.tsx           ← Renders active tasks, then completed tasks (uses TaskItem)
│       │   ├── TaskItem.tsx           ← Single task row: checkbox, title, subtask bar, expand, add, delete
│       │   ├── AddTaskModal.tsx       ← Modal: text input → addTask(title) → POST /api/tasks
│       │   ├── PowerUpShop.tsx        ← Modal: buy/use streak freezes, shows gem balance
│       │   └── SettingsModal.tsx      ← Modal: daily goal (+/- buttons), deadline picker, notification toggle
│       │
│       ├── stores/
│       │   ├── taskStore.ts           ← Zustand: tasks[], fetchTasks, addTask, toggleTask, deleteTask
│       │   ├── statsStore.ts          ← Zustand: gems, streak, today_completed, daily_goal, fetchStats
│       │   ├── settingsStore.ts       ← Zustand: daily_goal, deadline, notifications, fetchSettings, update
│       │   └── powerUpStore.ts        ← Zustand: freezesOwned, fetchPowerUps, buyFreeze, useFreeze
│       │
│       └── types.ts                   ← Frontend type definitions (mirrors backend types)
│
├── ─── BACKEND ──────────────────────────────────────────────
├── backend/
│   ├── package.json                    ← NPM manifest: scripts (dev, build, test, start)
│   ├── tsconfig.json                   ← TypeScript strict config, outDir=dist
│   ├── Dockerfile                      ← Multi-stage: build TS → run with Node 20 Alpine
│   │
│   └── src/
│       ├── index.ts                   ← Express app: cors, JSON, metricsMiddleware, routes, /api/health, /api/metrics
│       ├── database.ts                ← SQLite setup: WAL mode, foreign keys, 5-table schema, seed data
│       ├── types.ts                   ← Shared TypeScript interfaces (Task, UserStats, Settings, etc.)
│       ├── metrics.ts                 ← prom-client: counters, histograms, gauges, middleware, registry
│       │
│       └── routes/
│           ├── tasks.ts               ← CRUD: GET (list+hierarchy), POST (create), PATCH (toggle), DELETE
│           ├── stats.ts               ← GET: gems, streak, today_completed, goal_met, streak continuity check
│           ├── settings.ts            ← GET + PATCH: daily_goal, streak_deadline, notifications
│           └── powerups.ts            ← GET (list), POST freeze/buy (spend gems), POST freeze/use (activate)
│
├── ─── MONITORING ───────────────────────────────────────────
├── monitoring/
│   ├── prometheus.yml                  ← Scrape config: backend:3001/api/metrics every 15s + self-scrape
│   ├── grafana-dashboard.json          ← 14-panel dashboard: gems, streak, HTTP stats, heap, etc.
│   ├── grafana-datasource.yml          ← Auto-provision Prometheus as Grafana datasource
│   └── grafana-dashboard-provider.yml  ← Auto-load dashboard JSON on Grafana startup
│
├── ─── DOCKER ───────────────────────────────────────────────
├── docker-compose.yml                  ← 4 services: backend, frontend, prometheus, grafana + 2 volumes
│
├── ─── KUBERNETES ───────────────────────────────────────────
├── k8s/
│   ├── namespace.yaml                  ← Namespace: life-gamified
│   ├── backend-deployment.yaml         ← Deployment (2 replicas) + Service + PVC (1Gi)
│   ├── frontend-deployment.yaml        ← Deployment (2 replicas) + Service
│   └── ingress.yaml                    ← Ingress: /api→backend, /→frontend
│
├── ─── TERRAFORM ────────────────────────────────────────────
├── infra/
│   └── terraform/
│       ├── main.tf                     ← Docker provider: network, images, containers, volume
│       └── variables.tf                ← Configurable: docker_host, ports, environment
│
├── ─── CI/CD (GitHub Actions) ───────────────────────────────
├── .github/
│   └── workflows/
│       ├── ci.yml                      ← CI: lint → test → build → docker build → Trivy scan
│       └── cd.yml                      ← CD: build+push to GHCR → deploy to K8s (gated)
│
├── ─── CI/CD (Azure DevOps) ────────────────────────────────
├── azure-pipelines/
│   ├── ci-pipeline.yml                 ← CI: lint → test → build → docker build → Trivy scan
│   ├── cd-pipeline.yml                 ← CD: build+push to ACR → deploy to K8s (staged)
│   └── templates/
│       ├── install-node.yml            ← Reusable template: Node.js setup
│       └── docker-build-push.yml       ← Reusable template: Docker build + ACR push
│
├── ─── SCRIPTS ──────────────────────────────────────────────
├── scripts/
│   ├── deploy-k8s.ps1                  ← PowerShell: build images → apply K8s manifests → wait for rollout
│   ├── teardown-k8s.ps1                ← PowerShell: delete namespace → clean up
│   └── generate-traffic.ps1            ← PowerShell: simulate user traffic for monitoring demo
│
└── ─── DOCS ─────────────────────────────────────────────────
    └── docs/
        └── DEVOPS_PIPELINE.md          ← Step-by-step DevOps pipeline exercise guide
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                           │
│                                                                 │
│  React App (Vite)                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ TaskList  │ │ Header   │ │  Daily   │ │  Streak  │          │
│  │ TaskItem  │ │ Gems 💎  │ │ Progress │ │  Timer ⏱ │          │
│  └────┬─────┘ │ Streak🔥 │ └────┬─────┘ └────┬─────┘          │
│       │       └──────────┘      │             │                 │
│  ┌────▼──────────────────────────▼─────────────▼──────┐         │
│  │               Zustand Stores                        │         │
│  │  taskStore · statsStore · settingsStore · powerUp   │         │
│  └────────────────────┬───────────────────────────────┘         │
│                       │                                         │
│  ┌────────────────────▼───────────────────────────────┐         │
│  │              api/client.ts — fetch()                │         │
│  │   GET/POST/PATCH/DELETE → /api/tasks,stats,etc.    │         │
│  └────────────────────┬───────────────────────────────┘         │
└───────────────────────┼─────────────────────────────────────────┘
                        │ HTTP (JSON)
                        ▼
┌───────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND (:3001)                    │
│                                                               │
│  Middleware Chain:                                             │
│  cors() → express.json() → metricsMiddleware → routes         │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ /api/tasks       │  │ /api/stats       │                   │
│  │  GET / POST /    │  │  GET             │                   │
│  │  PATCH / DELETE   │  │  (streak check)  │                   │
│  └────────┬─────────┘  └────────┬─────────┘                   │
│  ┌────────┴─────────┐  ┌────────┴─────────┐                   │
│  │ /api/settings    │  │ /api/powerups    │                   │
│  │  GET / PATCH     │  │  GET / buy / use │                   │
│  └────────┬─────────┘  └────────┬─────────┘                   │
│           │                     │                              │
│  ┌────────▼─────────────────────▼──────────┐                   │
│  │           database.ts (SQLite)          │                   │
│  │  WAL mode · Foreign keys · 5 tables     │                   │
│  └─────────────────────────────────────────┘                   │
│                                                               │
│  ┌─────────────────────────────────────────┐                   │
│  │  /api/metrics (prom-client)             │                   │
│  │  Counters · Histograms · Gauges         │                   │
│  └────────────────────┬────────────────────┘                   │
└───────────────────────┼───────────────────────────────────────┘
                        │ Prometheus scrape (every 15s)
                        ▼
┌───────────────────────────────────────────────────────────────┐
│  PROMETHEUS (:9090)  ─────────────►  GRAFANA (:3000)          │
│  Scrapes /api/metrics                14-panel dashboard       │
│  Stores time-series                  Auto-provisioned         │
└───────────────────────────────────────────────────────────────┘
```

---

## Database Schema

SQLite database with **WAL** (Write-Ahead Logging) for concurrent reads and **foreign keys** enforced.

### Table: `tasks`

| Column       | Type    | Description                                                |
|--------------|---------|------------------------------------------------------------|
| id           | TEXT PK | UUID v4 — unique task identifier                          |
| title        | TEXT    | Task name (NOT NULL)                                       |
| completed    | INTEGER | 0 = incomplete, 1 = complete                              |
| parent_id    | TEXT FK | NULL for main tasks, references `tasks.id` for subtasks   |
| created_at   | TEXT    | ISO datetime, auto-set via `datetime('now')`               |
| completed_at | TEXT    | ISO datetime when completed, NULL if not                   |

**Foreign key**: `parent_id → tasks(id) ON DELETE CASCADE` — deleting a main task automatically deletes all its subtasks.

### Table: `user_stats`

Single row (enforced by `CHECK (id = 1)`):

| Column         | Type    | Default | Description                        |
|----------------|---------|---------|------------------------------------|
| id             | INTEGER | 1       | Always 1 (singleton)               |
| gems           | INTEGER | 0       | Current gem balance                |
| current_streak | INTEGER | 0       | Current consecutive days           |
| longest_streak | INTEGER | 0       | All-time best streak               |
| freeze_count   | INTEGER | 0       | Streak Freezes owned               |

### Table: `daily_records`

One row per calendar day:

| Column          | Type    | Description                            |
|-----------------|---------|----------------------------------------|
| id              | INTEGER | Auto-increment PK                      |
| date            | TEXT    | `YYYY-MM-DD` format (UNIQUE)           |
| tasks_completed | INTEGER | Count of tasks completed that day      |
| goal_met        | INTEGER | 1 if tasks_completed ≥ daily_goal      |

### Table: `settings`

Single row (enforced by `CHECK (id = 1)`):

| Column                 | Type    | Default | Description                      |
|------------------------|---------|---------|----------------------------------|
| id                     | INTEGER | 1       | Always 1 (singleton)             |
| daily_goal             | INTEGER | 4       | Tasks needed per day (1–50)      |
| streak_deadline        | TEXT    | "23:59" | HH:mm deadline for daily goal   |
| notifications_enabled  | INTEGER | 1       | Whether to show browser alerts   |

### Table: `powerup_log`

One row per power-up usage:

| Column       | Type    | Description                              |
|--------------|---------|------------------------------------------|
| id           | INTEGER | Auto-increment PK                        |
| type         | TEXT    | Power-up type (currently only `"freeze"`)|
| used_at      | TEXT    | ISO datetime of when it was used         |
| date_applied | TEXT    | `YYYY-MM-DD` the freeze protects         |

### Entity Relationship

```
tasks ──────── tasks (self-referencing via parent_id)
               │
               │  completed_at date used for daily_records counting
               ▼
daily_records ← counted from tasks WHERE completed_at date matches
               │
               │  goal_met determines streak continuation
               ▼
user_stats ──── streak, gems, freeze_count
               │
               │  freeze_count modified by powerup actions
               ▼
powerup_log ── records freeze activations per date
               │
settings ───── daily_goal, streak_deadline (used by stats & PATCH routes)
```

---

## API Reference — Every Endpoint

### `GET /api/health`

**Purpose**: Health check for Docker, K8s liveness probes, and load balancers.

**Response** (200):
```json
{ "status": "healthy", "timestamp": "2025-01-15T10:30:00.000Z" }
```
**Response** (503): If database connection fails.

---

### `GET /api/metrics`

**Purpose**: Prometheus scraping endpoint. Returns metrics in Prometheus text exposition format.

**Response** (200): `text/plain` — prom-client registry output including:
- `http_requests_total{method, route, status_code}` — Counter
- `http_request_duration_seconds{method, route, status_code}` — Histogram
- `app_active_tasks` — Gauge
- `app_active_subtasks` — Gauge
- `app_tasks_completed_total` — Counter
- `app_gems_balance` — Gauge
- `app_current_streak` — Gauge
- `app_today_completed` — Gauge
- `app_nodejs_*` — Default Node.js metrics (heap, GC, event loop, etc.)

---

### `GET /api/tasks`

**Purpose**: Fetch all tasks as a hierarchical tree (main tasks with nested subtasks).

**Response** (200):
```json
[
  {
    "id": "abc-123",
    "title": "Morning workout",
    "completed": false,
    "parent_id": null,
    "created_at": "2025-01-15T08:00:00.000Z",
    "completed_at": null,
    "subtasks": [
      {
        "id": "def-456",
        "title": "Push-ups",
        "completed": true,
        "parent_id": "abc-123",
        "created_at": "2025-01-15T08:01:00.000Z",
        "completed_at": "2025-01-15T08:30:00.000Z"
      }
    ]
  }
]
```

**Backend logic**:
1. `SELECT * FROM tasks ORDER BY created_at ASC`
2. Filter main tasks (`parent_id IS NULL`)
3. For each main task, attach its subtasks (`parent_id = main.id`)
4. Convert `completed` from `0/1` to `true/false`

---

### `POST /api/tasks`

**Purpose**: Create a new task or subtask.

**Request body**:
```json
{ "title": "Read for 30 minutes", "parent_id": "abc-123" }
```
- `title` (required): Non-empty string
- `parent_id` (optional): ID of parent task. If provided, must be a main task (not a subtask itself).

**Response** (201): The created task object.

**Validation**:
- Empty title → 400 `"Title is required"`
- parent_id doesn't exist → 404 `"Parent task not found"`
- parent_id is itself a subtask → 400 `"Cannot nest subtasks more than one level"`

**Backend logic**:
1. Validate title is non-empty string
2. If `parent_id` provided, check parent exists AND parent.parent_id is null
3. Generate UUID v4
4. `INSERT INTO tasks (id, title, parent_id) VALUES (?, ?, ?)`
5. Call `refreshGauges()` to update Prometheus metrics
6. Return the created task with 201

---

### `PATCH /api/tasks/:id`

**Purpose**: Toggle a task's completion state. This is the most complex endpoint — it handles gems, daily records, and streak logic.

**Response** (200): The updated task object.

**Backend logic (step by step)**:

1. **Find task**: `SELECT * FROM tasks WHERE id = :id` → 404 if not found
2. **Toggle**: Flip `completed` (0→1 or 1→0), set `completed_at` to now or null
3. **Update DB**: `UPDATE tasks SET completed = ?, completed_at = ? WHERE id = ?`
4. **Gem calculation**: Subtask = 2 gems, Main task = 10 gems
5. **Award/Revoke gems**:
   - Completing → `UPDATE user_stats SET gems = gems + ?`
   - Un-completing → `UPDATE user_stats SET gems = MAX(0, gems - ?)`
6. **Daily record**:
   - Ensure today's row exists: `INSERT OR IGNORE INTO daily_records ...`
   - Count today's completions: `SELECT COUNT(*) FROM tasks WHERE completed = 1 AND DATE(completed_at) = today`
   - Calculate `goal_met`: `tasks_completed >= daily_goal ? 1 : 0`
   - `UPDATE daily_records SET tasks_completed = ?, goal_met = ?`
7. **Streak update** (only when `goalMet AND newCompleted`):
   - Check yesterday's record and freeze status
   - If yesterday was met OR a freeze was used → `streak + 1`
   - If streak was 0 → `streak = 1` (starting fresh)
   - Otherwise → `streak = 1` (broken, restart)
   - Update `longest_streak = MAX(current, new)`
8. **Metrics**: `tasksCompletedTotal.inc()` if completing
9. **Refresh gauges**: Update all Prometheus gauges from DB
10. **Return**: Updated task object

---

### `DELETE /api/tasks/:id`

**Purpose**: Delete a task and all its subtasks.

**Response** (204): No content.

**Backend logic**:
1. Find task → 404 if not found
2. `DELETE FROM tasks WHERE parent_id = ?` (explicit subtask cleanup)
3. `DELETE FROM tasks WHERE id = ?`
4. Call `refreshGauges()` to update Prometheus metrics

---

### `GET /api/stats`

**Purpose**: Get current user statistics with live streak continuity check.

**Response** (200):
```json
{
  "gems": 42,
  "current_streak": 5,
  "longest_streak": 12,
  "freeze_count": 2,
  "today_completed": 3,
  "daily_goal": 4,
  "goal_met_today": false,
  "streak_deadline": "23:59"
}
```

**Backend logic**:
1. Fetch `user_stats` and `settings`
2. Ensure today's `daily_records` row exists
3. **Streak continuity check**: If yesterday wasn't met AND no freeze was used → reset streak to 0
4. Combine everything into `StatsResponse`

---

### `GET /api/settings`

**Purpose**: Fetch current app settings.

**Response** (200):
```json
{
  "daily_goal": 4,
  "streak_deadline": "23:59",
  "notifications_enabled": true
}
```

---

### `PATCH /api/settings`

**Purpose**: Update one or more settings.

**Request body** (all fields optional):
```json
{
  "daily_goal": 5,
  "streak_deadline": "22:00",
  "notifications_enabled": false
}
```

**Validation**:
- `daily_goal` must be 1–50 → 400
- `streak_deadline` must match `HH:mm` (regex `/^([01]\d|2[0-3]):[0-5]\d$/`) → 400

---

### `GET /api/powerups`

**Purpose**: List available power-ups and current inventory.

**Response** (200):
```json
{
  "available": [
    {
      "id": "freeze",
      "name": "Streak Freeze",
      "description": "Protects your streak for one missed day",
      "cost": 50,
      "icon": "🧊",
      "canAfford": true
    }
  ],
  "gems": 120,
  "freezes_owned": 2
}
```

---

### `POST /api/powerups/freeze/buy`

**Purpose**: Spend 50 gems to buy a Streak Freeze.

**Response** (200):
```json
{ "message": "Streak Freeze purchased!", "gems": 70, "freezes_owned": 3 }
```

**Error** (400): `"Not enough gems"` with `required` and `current` fields.

**Backend logic**:
1. Check `gems >= 50`
2. `UPDATE user_stats SET gems = gems - 50, freeze_count = freeze_count + 1`
3. Return updated balance

---

### `POST /api/powerups/freeze/use`

**Purpose**: Activate a Streak Freeze for today.

**Response** (200):
```json
{ "message": "Streak freeze activated for today! 🧊", "date": "2025-01-15" }
```

**Errors**:
- 400 `"No streak freezes available"` — if `freeze_count <= 0`
- 400 `"Streak freeze already active for today"` — if already used today

**Backend logic**:
1. Check `freeze_count > 0`
2. Check no existing entry in `powerup_log` for today
3. `UPDATE user_stats SET freeze_count = freeze_count - 1`
4. `INSERT INTO powerup_log (type, date_applied) VALUES ('freeze', today)`

---

## UI→Backend Workflow — Every Click Traced

This section traces **exactly what happens** when a user interacts with every element in the app — from the click event through React, Zustand, the API client, the Express route, the database queries, and back.

---

### 1. Page Load (App Mounts)

```
App.tsx useEffect (mount)
  ├── taskStore.fetchTasks()
  │     └── api.getTasks()
  │           └── GET /api/tasks
  │                 └── SELECT * FROM tasks ORDER BY created_at ASC
  │                 └── Build hierarchy (filter main → attach subtasks)
  │                 └── Response: Task[] with nested subtasks
  │
  ├── statsStore.fetchStats()
  │     └── api.getStats()
  │           └── GET /api/stats
  │                 └── SELECT * FROM user_stats, settings, daily_records
  │                 └── Streak continuity check (yesterday met or freeze used?)
  │                 └── Response: { gems, current_streak, today_completed, ... }
  │
  ├── settingsStore.fetchSettings()
  │     └── api.getSettings()
  │           └── GET /api/settings
  │                 └── SELECT * FROM settings WHERE id = 1
  │                 └── Response: { daily_goal, streak_deadline, notifications_enabled }
  │
  └── powerUpStore.fetchPowerUps()
        └── api.getPowerUps()
              └── GET /api/powerups
                    └── SELECT gems, freeze_count FROM user_stats
                    └── Response: { available: [...], gems, freezes_owned }
```

Additionally, whenever the `tasks` array in Zustand changes, a secondary `useEffect` re-fetches stats and power-ups to keep gem/streak counts current.

---

### 2. Click the "+" FAB Button (Add Task)

```
User clicks floating "+" button (bottom-right of screen)
  │
  └── App.tsx: setShowAddTask(true)
        └── Renders <AddTaskModal open={true} />
              │
              User types task title, presses Enter or clicks "Add Task"
              │
              └── AddTaskModal: calls addTask(title.trim())
                    │
                    └── taskStore.addTask(title)
                          │
                          ├── api.createTask(title)
                          │     └── POST /api/tasks { title }
                          │           │
                          │           ├── Validate: title non-empty
                          │           ├── Generate UUID v4
                          │           ├── INSERT INTO tasks (id, title, parent_id) VALUES (uuid, title, NULL)
                          │           ├── SELECT * FROM tasks WHERE id = uuid
                          │           ├── refreshGauges() → update all Prometheus gauges
                          │           └── Response 201: { id, title, completed: false, ... }
                          │
                          ├── taskStore.fetchTasks() (re-fetch all)
                          │     └── GET /api/tasks → full hierarchy
                          │
                          └── toast.success("Task added! 🎯")
```

---

### 3. Click a Task's Checkbox (Toggle Completion)

```
User clicks the checkbox circle on a TaskItem
  │
  └── TaskItem.tsx: onClick → toggleTask(task.id)
        │
        └── taskStore.toggleTask(id)
              │
              ├── api.toggleTask(id)
              │     └── PATCH /api/tasks/:id
              │           │
              │           ├── SELECT * FROM tasks WHERE id = :id
              │           ├── Flip completed: 0↔1, set completed_at
              │           ├── UPDATE tasks SET completed, completed_at
              │           │
              │           ├── Gem calculation:
              │           │   If completing: UPDATE user_stats SET gems = gems + (10 or 2)
              │           │   If un-completing: UPDATE user_stats SET gems = MAX(0, gems - delta)
              │           │
              │           ├── Daily record update:
              │           │   INSERT OR IGNORE INTO daily_records for today
              │           │   COUNT today's completed tasks
              │           │   UPDATE daily_records SET tasks_completed, goal_met
              │           │
              │           ├── Streak update (if goal just met AND completing):
              │           │   Check yesterday's goal_met and freeze status
              │           │   UPDATE user_stats SET current_streak, longest_streak
              │           │
              │           ├── tasksCompletedTotal.inc() (Prometheus counter)
              │           ├── refreshGauges() → sync all Prometheus gauges
              │           └── Response 200: updated task object
              │
              ├── taskStore.fetchTasks() (re-fetch all)
              │     └── GET /api/tasks → full hierarchy
              │
              └── If result.completed:
                    toast.success("+10 gems! 💎") or ("+2 gems! 💎" for subtask)
```

**What the user sees**: The checkbox fills with a green checkmark, the task fades slightly, a toast pops up showing gems earned, the gem count in the header updates, the daily progress bar advances, and (if the goal is met) the streak count increments.

---

### 4. Click the Trash Icon (Delete Task)

```
User clicks the red trash icon on a TaskItem
  │
  └── TaskItem.tsx: onClick → deleteTask(task.id)
        │
        └── taskStore.deleteTask(id)
              │
              ├── api.deleteTask(id)
              │     └── DELETE /api/tasks/:id
              │           │
              │           ├── SELECT * FROM tasks WHERE id = :id → 404 if missing
              │           ├── DELETE FROM tasks WHERE parent_id = :id (subtasks first)
              │           ├── DELETE FROM tasks WHERE id = :id
              │           ├── refreshGauges() → sync all Prometheus gauges
              │           └── Response 204 (no content)
              │
              ├── taskStore.fetchTasks() (re-fetch all)
              └── toast.success("Task deleted")
```

---

### 5. Expand a Task & Add a Subtask

```
User clicks the chevron "▶" icon on a TaskItem that has subtasks (or to expand)
  │
  └── TaskItem.tsx: setExpanded(!expanded)
        └── Toggles visibility of subtask section (local React state)

User clicks the "+" icon inside the expanded subtask area
  │
  └── TaskItem.tsx: setAdding(true)
        └── Renders an inline <input> below the subtasks

User types subtask title, presses Enter
  │
  └── TaskItem.tsx: calls addTask(input.trim(), task.id)
        │
        └── taskStore.addTask(title, parentId)
              │
              ├── api.createTask(title, parentId)
              │     └── POST /api/tasks { title, parent_id: parentId }
              │           │
              │           ├── Validate: title non-empty
              │           ├── Validate: parent exists (SELECT WHERE id = parentId)
              │           ├── Validate: parent.parent_id IS NULL (no double nesting)
              │           ├── Generate UUID v4
              │           ├── INSERT INTO tasks (id, title, parent_id) VALUES (uuid, title, parentId)
              │           ├── refreshGauges()
              │           └── Response 201: created subtask
              │
              ├── taskStore.fetchTasks() (re-fetch all)
              └── toast.success("Sub-task added!")
```

---

### 6. Click the 💎 Gem Counter (Open Shop)

```
User clicks the gem display in the Header
  │
  └── Header.tsx: onOpenShop()
        └── App.tsx: setShowShop(true)
              └── Renders <PowerUpShop open={true} />
                    │
                    Displays: current gem count, freeze cost (50), freezes owned
```

---

### 7. Click "Buy Freeze" in the Shop

```
User clicks "Buy Freeze" button (enabled only if gems >= 50)
  │
  └── PowerUpShop.tsx: onClick
        │
        ├── powerUpStore.buyFreeze()
        │     └── api.buyFreeze()
        │           └── POST /api/powerups/freeze/buy
        │                 │
        │                 ├── SELECT gems, freeze_count FROM user_stats
        │                 ├── Check gems >= 50 → 400 if not
        │                 ├── UPDATE user_stats SET gems = gems - 50, freeze_count = freeze_count + 1
        │                 └── Response 200: { message, gems: newBalance, freezes_owned: newCount }
        │
        └── statsStore.fetchStats() (refresh gem count in header)
              └── GET /api/stats → re-read everything

User sees: gem count drops by 50, freeze count increments, toast "Streak Freeze purchased! 🧊"
```

---

### 8. Click "Use Today" in the Shop

```
User clicks "Use Today" button (visible only if totalFreezes > 0)
  │
  └── PowerUpShop.tsx: onClick
        │
        ├── powerUpStore.useFreeze()
        │     └── api.useFreeze()
        │           └── POST /api/powerups/freeze/use
        │                 │
        │                 ├── SELECT freeze_count → 400 if 0
        │                 ├── Check powerup_log for today → 400 if already used
        │                 ├── UPDATE user_stats SET freeze_count = freeze_count - 1
        │                 ├── INSERT INTO powerup_log (type, date_applied) VALUES ('freeze', today)
        │                 └── Response 200: { message, date: "2025-01-15" }
        │
        └── statsStore.fetchStats()

User sees: freeze count decrements, toast "Streak freeze activated! 🧊"
```

---

### 9. Click the ⚙ Settings Gear

```
User clicks the settings gear icon in the Header
  │
  └── Header.tsx: onOpenSettings()
        └── App.tsx: setShowSettings(true)
              └── Renders <SettingsModal open={true} />
                    │
                    Local state initialized from settingsStore:
                    goal = daily_goal, deadline = streak_deadline, notifs = notifications_enabled
```

---

### 10. Change Settings & Click "Save"

```
User adjusts daily goal (+ / - buttons), picks deadline time, toggles notifications
  │
  └── SettingsModal.tsx handleSave():
        │
        ├── settingsStore.updateSettings({ daily_goal, streak_deadline, notifications_enabled })
        │     └── api.updateSettings(data)
        │           └── PATCH /api/settings { daily_goal: 5, streak_deadline: "22:00", notifications_enabled: true }
        │                 │
        │                 ├── SELECT * FROM settings WHERE id = 1 (current values)
        │                 ├── Merge: only override fields that are provided
        │                 ├── Validate: daily_goal 1–50, deadline matches HH:mm regex
        │                 ├── UPDATE settings SET daily_goal, streak_deadline, notifications_enabled
        │                 └── Response 200: updated settings object
        │
        ├── If notifications enabled: request browser Notification permission
        ├── toast.success("Settings saved!")
        └── onClose() → hides modal
```

---

### 11. Streak Timer Reaches 30 Minutes Remaining

```
StreakTimer.tsx countdown effect (runs every second):
  │
  ├── Calculates seconds until streak_deadline today
  │
  ├── If remaining <= 30 minutes AND !goal_met_today AND current_streak > 0:
  │     └── Sends browser Notification:
  │           title: "⏰ Streak Warning!"
  │           body: "30 minutes left! Complete X more tasks to keep your Y-day streak!"
  │           (notification only sent once via hasNotified ref)
  │
  └── Renders countdown display: "Xh Xm" remaining (or "Goal reached! 🎉" if met)
```

---

### 12. Daily Progress Bar Updates

```
DailyProgress.tsx reads from statsStore:
  │
  ├── today_completed / daily_goal → percentage
  ├── Renders: progress bar with animation, "X / Y" text
  └── If goal_met_today: shows "Daily goal reached! 🎯" with confetti style
```

This component re-renders automatically because `App.tsx`'s secondary `useEffect` re-fetches stats whenever the `tasks` array changes.

---

## Frontend Deep Dive

### State Management with Zustand

The app uses **four Zustand stores**, each responsible for one domain:

#### `taskStore.ts`
- **State**: `tasks: Task[]`, `loading: boolean`
- **Actions**:
  - `fetchTasks()` → `GET /api/tasks` → sets `tasks`
  - `addTask(title, parentId?)` → `POST /api/tasks` → re-fetches → toast
  - `toggleTask(id)` → `PATCH /api/tasks/:id` → re-fetches → toast with gem count
  - `deleteTask(id)` → `DELETE /api/tasks/:id` → re-fetches → toast

Every action that mutates data calls `fetchTasks()` afterward to ensure the local state matches the server.

#### `statsStore.ts`
- **State**: All fields from `StatsResponse` + `loading`
- **Actions**: `fetchStats()` → `GET /api/stats` → spreads entire response into state

#### `settingsStore.ts`
- **State**: `daily_goal`, `streak_deadline`, `notifications_enabled`, `loading`
- **Actions**:
  - `fetchSettings()` → `GET /api/settings`
  - `updateSettings(data)` → `PATCH /api/settings` → re-fetch

#### `powerUpStore.ts`
- **State**: `freezesOwned`, `loading`
- **Actions**:
  - `fetchPowerUps()` → `GET /api/powerups` → sets `freezesOwned`
  - `buyFreeze()` → `POST /api/powerups/freeze/buy` → updates `freezesOwned` → toast
  - `useFreeze()` → `POST /api/powerups/freeze/use` → decrements locally → toast

### API Client (`api/client.ts`)

A single generic `request<T>()` function handles all HTTP communication:

```typescript
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(body.error);
  if (res.status === 204) return undefined as T;
  return res.json();
}
```

All API functions (`getTasks`, `createTask`, etc.) are methods on the exported `api` object, each calling `request<T>()` with the appropriate method, path, and body.

### Component Hierarchy

```
App
├── Header (gems, streak, shop button, settings button)
├── DailyProgress (progress bar)
├── StreakTimer (countdown)
├── TaskList
│   └── TaskItem (×N)
│       ├── Checkbox (toggle)
│       ├── Title
│       ├── Subtask progress bar
│       ├── Expand/Collapse chevron
│       ├── Add subtask (+) → inline input
│       ├── Delete (trash icon)
│       └── Subtasks section (when expanded)
│           └── Subtask item (×N) — checkbox + title + delete
├── AddTaskModal (FAB → modal → input → create)
├── PowerUpShop (buy/use freezes)
└── SettingsModal (daily goal, deadline, notifications)
```

### Nginx Configuration

The frontend is served by Nginx in production (Docker). The `nginx.conf` provides:

1. **SPA Fallback**: `try_files $uri $uri/ /index.html` — all routes serve `index.html` so React Router works.
2. **API Proxy**: `location /api/` → `proxy_pass http://backend:3001` — the frontend container proxies `/api` requests to the backend container using Docker's internal DNS.
3. **Static Asset Caching**: `expires 1y` with `Cache-Control: public, immutable` for `.js`, `.css`, images.

---

## Backend Deep Dive

### Express Middleware Chain

Every request flows through this pipeline (in order):

```
Request → cors() → express.json() → metricsMiddleware → route handler → error handler
```

1. **cors()**: Allows cross-origin requests (needed for Vite dev server on different port).
2. **express.json()**: Parses JSON request bodies.
3. **metricsMiddleware**: Starts a Prometheus histogram timer, then on `res.finish`, records the method, normalized route, status code, and duration.
4. **Route handler**: One of the 4 routers (`tasks`, `stats`, `settings`, `powerups`).
5. **Error handler**: Catches unhandled errors, logs them, returns 500.

### Route Registration

```typescript
app.use("/api/tasks",    taskRoutes);     // CRUD for tasks
app.use("/api/stats",    statsRoutes);    // Read-only stats
app.use("/api/settings", settingsRoutes); // Settings read/write
app.use("/api/powerups", powerupRoutes);  // Power-up shop
```

### Metrics Instrumentation (`metrics.ts`)

Using `prom-client`, the backend exposes:

| Metric                          | Type      | Labels                          | Purpose                          |
|---------------------------------|-----------|---------------------------------|----------------------------------|
| `http_requests_total`           | Counter   | method, route, status_code      | Total HTTP request count         |
| `http_request_duration_seconds` | Histogram | method, route, status_code      | Request latency (10 buckets)     |
| `app_active_tasks`              | Gauge     | —                               | Incomplete main tasks            |
| `app_active_subtasks`           | Gauge     | —                               | Incomplete subtasks              |
| `app_tasks_completed_total`     | Counter   | —                               | Cumulative completed tasks       |
| `app_gems_balance`              | Gauge     | —                               | Current gem count                |
| `app_current_streak`            | Gauge     | —                               | Current streak days              |
| `app_today_completed`           | Gauge     | —                               | Tasks completed today            |
| `app_nodejs_*`                  | Various   | —                               | Node.js heap, GC, event loop     |

The **`metricsMiddleware`** normalizes routes by replacing UUIDs with `:id` to prevent cardinality explosion:
```
/api/tasks/550e8400-e29b-41d4-a716-446655440000  →  /api/tasks/:id
```

The **`refreshGauges()`** function (called after every mutation in tasks.ts) re-queries the database and sets all gauge values to match:
```typescript
function refreshGauges(): void {
  // COUNT incomplete main tasks → activeTasksGauge.set()
  // COUNT incomplete subtasks → activeSubtasksGauge.set()
  // SELECT gems, streak → gemsGauge.set(), streakGauge.set()
  // SELECT today's completed count → todayCompletedGauge.set()
}
```

### Database Initialization (`database.ts`)

On first access (`getDb()`):
1. Opens/creates the SQLite file at `DB_PATH` (env var or `./life-gamified.db`)
2. Enables **WAL mode** (`journal_mode = WAL`) for better concurrent read performance
3. Enables **foreign keys** (`foreign_keys = ON`) for cascading deletes
4. Runs `initSchema()` which creates all 5 tables if they don't exist
5. Seeds default rows: `user_stats` (id=1, 0 gems, 0 streak) and `settings` (id=1, goal=4, deadline=23:59)

The database is a singleton — `getDb()` returns the same instance on every call.

---

## Monitoring & Observability

### How Metrics Flow

```
Backend (prom-client)          Prometheus                    Grafana
      │                            │                            │
      │  /api/metrics (text)       │                            │
      │◄───────────────────────────│  Scrape every 15s          │
      │────────────────────────────►│                            │
      │                            │  Store time-series          │
      │                            │                            │
      │                            │  PromQL queries             │
      │                            │◄───────────────────────────│
      │                            │────────────────────────────►│
      │                            │                 14-panel dashboard
```

### Prometheus Configuration

```yaml
global:
  scrape_interval: 15s        # How often to pull metrics
  evaluation_interval: 15s    # How often to evaluate alerting rules

scrape_configs:
  - job_name: "life-gamified-backend"
    metrics_path: /api/metrics    # NOT /metrics (custom path)
    static_configs:
      - targets: ["backend:3001"] # Docker DNS name

  - job_name: "prometheus"        # Self-monitoring
    static_configs:
      - targets: ["localhost:9090"]
```

### Grafana Dashboard (14 Panels)

The dashboard is **auto-provisioned** — no manual setup. When Grafana starts, it reads:
1. `grafana-datasource.yml` → connects to Prometheus at `http://prometheus:9090`
2. `grafana-dashboard-provider.yml` → tells Grafana to load dashboards from `/etc/grafana/provisioning/dashboards/`
3. `grafana-dashboard.json` → the 14-panel dashboard

**Panel Breakdown:**

| # | Panel                    | Type       | PromQL Query                                                        | What It Shows                              |
|---|--------------------------|------------|--------------------------------------------------------------------|--------------------------------------------|
| 1 | Backend Up/Down          | Stat       | `up{job="life-gamified-backend"}`                                   | 1 = green "UP", 0 = red "DOWN"             |
| 2 | Gem Balance              | Stat       | `app_gems_balance`                                                  | Current gems (green >50)                    |
| 3 | Current Streak           | Stat       | `app_current_streak`                                                | Streak days (thresholds: 3, 7)             |
| 4 | Active Tasks             | Stat       | `app_active_tasks`                                                  | Incomplete main tasks count                |
| 5 | Active Subtasks          | Stat       | `app_active_subtasks`                                               | Incomplete subtasks count                  |
| 6 | Today Completed          | Stat       | `app_today_completed`                                               | Tasks done today                           |
| 7 | HTTP Request Rate        | Timeseries | `sum(rate(http_requests_total[1m])) by (route)`                     | Requests/sec per API route                 |
| 8 | HTTP Duration Percentiles| Timeseries | `histogram_quantile(0.50/0.95/0.99, ...)`                          | p50, p95, p99 latency in seconds           |
| 9 | HTTP Status Codes        | Timeseries | `sum(rate(http_requests_total[1m])) by (status_code)`               | Stacked bars: 200=green, 201=blue, etc.    |
| 10| Tasks Completed          | Timeseries | `app_tasks_completed_total`                                         | Cumulative completed tasks over time       |
| 11| Gem Balance Over Time    | Timeseries | `app_gems_balance`                                                  | Gems trend line                            |
| 12| Node.js Heap Used        | Timeseries | `app_nodejs_heap_size_used_bytes / 1048576`                         | Heap MB used vs total                      |
| 13| Event Loop Lag           | Timeseries | `app_nodejs_eventloop_lag_seconds`                                  | Event loop delay (performance)             |
| 14| Active Connections       | Timeseries | `app_nodejs_active_handles_total`                                   | Open handles (sockets, timers)             |

---

## Docker & Docker Compose

### Backend Dockerfile (Multi-Stage)

```dockerfile
# Stage 1: BUILD — compile TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                    # Install ALL deps (including devDependencies)
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build             # tsc → dist/

# Stage 2: RUNTIME — production-only
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl   # For health check
RUN mkdir -p /data && chown node:node /data   # ← CRITICAL: volume permission fix
COPY package*.json ./
RUN npm ci --omit=dev         # Only production deps
COPY --from=builder /app/dist ./dist
EXPOSE 3001
USER node                     # Run as non-root (security)
CMD ["node", "dist/index.js"]
```

**Why multi-stage?** The build stage needs TypeScript, dev dependencies, and generates `dist/`. The runtime stage only copies the compiled JS and production dependencies — resulting in a much smaller image.

**Why `mkdir -p /data && chown node:node /data`?** Docker volumes mount as root by default. Since we run as `USER node`, the `/data` directory (where SQLite lives) must be owned by `node` or the database can't be created. Without this line, the container starts but SQLite throws `SQLITE_CANTOPEN`.

### Frontend Dockerfile (Multi-Stage)

```dockerfile
# Stage 1: BUILD — Vite build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build             # vite build → dist/

# Stage 2: SERVE — Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

The built React app is served as static files by Nginx, which also handles the `/api` reverse proxy.

### Docker Compose — 4 Services

```
docker-compose.yml
├── backend       Port 3001   Builds from ./backend, health checked, persists DB in named volume
├── frontend      Port 5173   Builds from ./frontend, waits for backend health
├── prometheus    Port 9090   Mounts prometheus.yml, waits for backend health
└── grafana       Port 3000   Mounts dashboard + datasource configs, anonymous access enabled
```

**Volumes**:
- `db-data` — Persistent SQLite database (survives `docker compose down`)
- `grafana-data` — Grafana state (dashboards, users, etc.)

**Health check**: Backend exposes `GET /api/health`. Docker checks it every 30s. The `frontend`, `prometheus`, and `grafana` services all wait for backend to be healthy before starting.

**Networking**: All 4 containers are on the same Docker Compose default network. They reference each other by service name (`backend`, `prometheus`, etc.).

---

## Kubernetes (K8s)

The K8s setup runs on **Docker Desktop's built-in Kubernetes** cluster. It's designed for local practice, using `imagePullPolicy: Never` so it pulls from the local Docker image store.

### Manifests

| File                         | Resources Created                          |
|------------------------------|--------------------------------------------|
| `namespace.yaml`             | `Namespace: life-gamified`                 |
| `backend-deployment.yaml`    | `Deployment` (2 replicas) + `Service` (ClusterIP) + `PersistentVolumeClaim` (1Gi) |
| `frontend-deployment.yaml`   | `Deployment` (2 replicas) + `Service` (ClusterIP) |
| `ingress.yaml`               | `Ingress` with nginx class: `/api→backend`, `/→frontend` |

### Backend Deployment Details

- **Replicas**: 2 (so there are 2 backend pods running)
- **Image**: `life-gamified-backend:latest` (`imagePullPolicy: Never` = use local Docker images)
- **Environment**: `NODE_ENV=production`, `PORT=3001`, `DB_PATH=/data/life-gamified.db`
- **Volume**: PVC `backend-pvc` (1Gi) mounted at `/data` — shared SQLite storage
- **Resources**:
  - Requests: 100m CPU, 128Mi memory
  - Limits: 500m CPU, 256Mi memory
- **Probes**:
  - Liveness: `GET /api/health` every 30s (initial delay 10s)
  - Readiness: `GET /api/health` every 10s (initial delay 5s)

### Frontend Deployment Details

- **Replicas**: 2
- **Image**: `life-gamified-frontend:latest` (`imagePullPolicy: Never`)
- **Resources**: 50m/64Mi (requests) → 200m/128Mi (limits) — it's just Nginx serving static files
- **Probes**: `GET /` (the HTML page)

### How Ingress Routes Traffic

```
life-gamified.local/api/*  →  backend:3001
life-gamified.local/*      →  frontend:80
```

To use the Ingress locally, add `127.0.0.1 life-gamified.local` to your hosts file and install an Nginx Ingress Controller. Without the ingress controller, you'd use `kubectl port-forward` instead.

### Deploy Script (`scripts/deploy-k8s.ps1`)

The PowerShell script automates:
1. Build Docker images (backend + frontend)
2. `kubectl apply -f k8s/namespace.yaml`
3. `kubectl apply -f k8s/` (all manifests)
4. `kubectl rollout status` on both deployments — waits until all pods are ready

### Teardown Script (`scripts/teardown-k8s.ps1`)

1. `kubectl delete namespace life-gamified`
2. Waits for full cleanup

---

## Terraform — Infrastructure as Code

Terraform manages Docker resources declaratively using the `kreuzwerker/docker` provider.

### What It Creates

| Resource                        | Type             | Purpose                                          |
|---------------------------------|------------------|--------------------------------------------------|
| `docker_network.app_network`    | Network          | Internal network for container communication     |
| `docker_image.backend`          | Image            | Builds backend image from `./backend/Dockerfile` |
| `docker_image.frontend`         | Image            | Builds frontend image from `./frontend/Dockerfile`|
| `docker_container.backend`      | Container        | Runs backend with env vars, health check, volume |
| `docker_container.frontend`     | Container        | Runs frontend with port mapping, depends on backend|
| `docker_volume.db_data`         | Volume           | Persistent storage for SQLite DB                 |

### Variables

| Variable        | Default                              | Description                    |
|-----------------|--------------------------------------|--------------------------------|
| `docker_host`   | `npipe:////.//pipe//docker_engine`   | Docker daemon socket (Windows) |
| `backend_port`  | `3001`                               | External port for API          |
| `frontend_port` | `5173`                               | External port for UI           |
| `environment`   | `dev`                                | Must be dev/staging/production |

### Terraform Lifecycle

```bash
cd infra/terraform

terraform init       # Download Docker provider plugin
terraform plan       # Preview: what will be created/changed?
terraform apply      # Create all resources (type "yes")

# Verify
docker ps            # See the running containers
curl localhost:3001/api/health

terraform destroy    # Tear down everything (type "yes")
```

**Key difference from Docker Compose**: Terraform is **declarative** — you describe the desired state and Terraform figures out what to create/update/delete. It maintains a `terraform.tfstate` file tracking what it manages.

---

## CI/CD — GitHub Actions

### CI Pipeline (`.github/workflows/ci.yml`)

**Triggers**: Push to `main`/`develop`, pull requests to `main`.

```
┌─────────────────────────────────┐
│  lint-and-test-backend          │
│  ├── npm ci                     │
│  ├── npm run lint (non-blocking)│
│  ├── npm test (8 tests)         │
│  └── npm run build              │
└──────────────┬──────────────────┘
               │
┌──────────────┴──────────────────┐
│  lint-and-build-frontend        │
│  ├── npm ci                     │
│  ├── npm run lint (non-blocking)│
│  └── npm run build              │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│  docker-build (needs both above)│
│  ├── docker build backend       │
│  └── docker build frontend      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  security-scan (parallel)       │
│  ├── Trivy scan backend         │
│  └── Trivy scan frontend        │
│  (HIGH + CRITICAL severity)     │
└─────────────────────────────────┘
```

### CD Pipeline (`.github/workflows/cd.yml`)

**Triggers**: Push to `main`, version tags (`v*`).

```
┌──────────────────────────────────────┐
│  build-and-push                      │
│  ├── Login to GHCR                   │
│  ├── Build + push backend to GHCR    │
│  │   Tags: sha, tag, latest          │
│  └── Build + push frontend to GHCR   │
│      Tags: sha, tag, latest          │
└──────────────┬───────────────────────┘
               │
               │ if: main branch AND vars.DEPLOY_ENABLED == 'true'
               ▼
┌──────────────────────────────────────┐
│  deploy (environment: production)    │
│  ├── Setup kubectl                   │
│  ├── Configure kubeconfig from secret│
│  ├── sed: replace image tags in YAML │
│  ├── sed: imagePullPolicy → Always   │
│  └── kubectl apply -f k8s/          │
└──────────────────────────────────────┘
```

**GHCR (GitHub Container Registry)**: Images are pushed to `ghcr.io/jaithrasarma/life-gamified/backend` and `.../frontend` with commit SHA tags.

**Deploy guard**: The deploy job only runs if:
1. We're on the `main` branch
2. The GitHub repository variable `DEPLOY_ENABLED` is set to `'true'`

This prevents accidental deployments. For local practice, the deploy step is effectively a no-op since `DEPLOY_ENABLED` isn't set.

---

## CI/CD — Azure DevOps

The project includes a **parallel Azure DevOps pipeline** alongside GitHub Actions, demonstrating multi-platform CI/CD expertise.

> **Note**: The CI pipeline is **completely free** (no Azure subscription needed — only an Azure DevOps account at [dev.azure.com](https://dev.azure.com)). The CD pipeline requires an Azure subscription (free trial $200 credit works) for Azure Container Registry.

### Pipeline Files

```
azure-pipelines/
├── ci-pipeline.yml              # CI: lint → test → build → Docker build → Trivy scan
├── cd-pipeline.yml              # CD: build & push to ACR → deploy to K8s (staged)
└── templates/
    ├── install-node.yml         # Reusable: Node.js setup
    └── docker-build-push.yml   # Reusable: Docker build + ACR push
```

### CI Pipeline (`azure-pipelines/ci-pipeline.yml`)

**Triggers**: Push to `main`/`develop`, pull requests to `main`.

```
┌──────────────────────────────────────┐
│  Stage: BuildAndTest                 │
│  ├── Job: Backend                    │
│  │   ├── npm ci                      │
│  │   ├── npm run lint (non-blocking) │
│  │   ├── npm test (8 tests)          │
│  │   └── npm run build               │
│  └── Job: Frontend                   │
│      ├── npm ci                      │
│      ├── npm run lint (non-blocking) │
│      └── npm run build               │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│  Stage: DockerBuild                  │
│  ├── docker build backend            │
│  └── docker build frontend           │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Stage: SecurityScan (parallel)      │
│  ├── Install Trivy                   │
│  ├── Scan backend (HIGH,CRITICAL)    │
│  └── Scan frontend (HIGH,CRITICAL)   │
└──────────────────────────────────────┘
```

### CD Pipeline (`azure-pipelines/cd-pipeline.yml`)

**Triggers**: Push to `main`, version tags (`v*`).

```
┌──────────────────────────────────────┐
│  Stage: BuildAndPush                 │
│  ├── Job: PushBackend                │
│  │   └── Build + push to ACR        │
│  └── Job: PushFrontend               │
│      └── Build + push to ACR        │
└──────────────┬───────────────────────┘
               │
               │ condition: main branch only
               ▼
┌──────────────────────────────────────┐
│  Stage: Deploy                       │
│  ├── Create namespace                │
│  ├── sed: replace image tags         │
│  ├── KubernetesManifest@1 deploy     │
│  ├── Verify rollout — backend        │
│  └── Verify rollout — frontend       │
└──────────────────────────────────────┘
```

**ACR (Azure Container Registry)**: Images are pushed to `lifegamifiedacr.azurecr.io/life-gamified/backend` and `.../frontend` with build ID tags.

**Environment approvals**: The deploy stage uses Azure DevOps `environment` resources, enabling manual approval gates before production deploys.

### Dual Pipeline Comparison

| Feature              | GitHub Actions           | Azure DevOps             |
|----------------------|--------------------------|--------------------------|
| Config location      | `.github/workflows/`     | `azure-pipelines/`       |
| Container registry   | GHCR                     | Azure Container Registry |
| Trigger syntax       | `on: push/pr`            | `trigger/pr`             |
| Pipeline language    | GitHub Actions YAML      | Azure Pipelines YAML     |
| Deploy mechanism     | `kubectl apply`          | `KubernetesManifest@1`   |
| Deploy guard         | `vars.DEPLOY_ENABLED`    | Environment approvals    |
| Reusable components  | N/A                      | `templates/` (2 templates) |
| Free tier            | 2,000 min/month          | 1,800 min/month          |

> **Full setup guide**: See [docs/AZURE_DEVOPS_SETUP.md](docs/AZURE_DEVOPS_SETUP.md) for step-by-step instructions on creating the Azure DevOps organization, connecting your repo, and configuring service connections.

---

## How to Run Everything

### Prerequisites

- **Node.js 20+** and **npm**
- **Docker Desktop** (with Kubernetes enabled for K8s)
- **Terraform** (for IaC)
- **Git** and **gh** CLI (for GitHub push)
- **Azure DevOps account** (optional, for Azure Pipelines — see [setup guide](docs/AZURE_DEVOPS_SETUP.md))

### 1. Local Development (Fastest)

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev          # http://localhost:3001

# Terminal 2: Frontend
cd frontend
npm install
npm run dev          # http://localhost:5173 (proxies /api to :3001)
```

### 2. Docker Compose (4 Services)

```bash
docker compose up -d --build

# Services:
#   Backend:     http://localhost:3001
#   Frontend:    http://localhost:5173
#   Prometheus:  http://localhost:9090
#   Grafana:     http://localhost:3000 (admin/admin)

# Check health
docker compose ps

# View logs
docker compose logs backend -f

# Tear down
docker compose down        # Keep data
docker compose down -v     # Delete volumes too
```

### 3. Kubernetes

```powershell
# Build images first
docker build -t life-gamified-backend:latest ./backend
docker build -t life-gamified-frontend:latest ./frontend

# Deploy
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/

# Check
kubectl get pods -n life-gamified
kubectl get svc -n life-gamified

# Port-forward to access
kubectl port-forward svc/backend 3001:3001 -n life-gamified
kubectl port-forward svc/frontend 8080:80 -n life-gamified

# Or use the script:
.\scripts\deploy-k8s.ps1

# Teardown
.\scripts\teardown-k8s.ps1
```

### 4. Terraform

```bash
cd infra/terraform

terraform init
terraform plan
terraform apply     # Type "yes"

# Verify
docker ps
curl http://localhost:3001/api/health

# Destroy
terraform destroy   # Type "yes"
```

### 5. Run Tests

```bash
cd backend
npm test             # 8 tests: health, tasks CRUD, stats, settings, powerups
```

### 6. Generate Traffic for Monitoring

```powershell
.\scripts\generate-traffic.ps1 -Rounds 10
```

This creates realistic user activity (create tasks, subtasks, toggle, delete) so Prometheus and Grafana dashboards have data to display.

---

## Scripts & Utilities

### `scripts/deploy-k8s.ps1`

Builds Docker images and deploys to local K8s cluster. Handles namespace creation, applies all manifests, and waits for rollout completion.

### `scripts/teardown-k8s.ps1`

Deletes the `life-gamified` namespace and all its resources in one command.

### `scripts/generate-traffic.ps1`

Simulates a real user session against the running backend:

- **Accepts**: `-Rounds N` (default 5)
- **Each round**:
  1. Creates 2–3 tasks with 1–2 subtasks each
  2. Fetches the full task list
  3. Toggles 3 random tasks (earning gems)
  4. Checks stats
  5. Occasionally deletes a task
  6. 2-second delay between rounds
- **Outputs**: Progress log and final summary (gems, streak, task counts)

---

## Testing

Test file: `backend/src/__tests__/api.test.ts`

Tests use **Vitest** with the Express app directly (no server startup needed).

| Test                        | What It Verifies                                          |
|-----------------------------|-----------------------------------------------------------|
| `GET /api/health`           | Returns 200 with `{ status: "healthy" }`                  |
| `POST /api/tasks`           | Creates task, returns 201 with UUID                       |
| `GET /api/tasks`            | Returns array with the created task                       |
| `PATCH /api/tasks/:id`      | Toggles completion, confirms `completed: true`            |
| `DELETE /api/tasks/:id`     | Returns 204, subsequent GET shows empty                   |
| `GET /api/stats`            | Returns stats object with all expected fields             |
| `GET /api/settings`         | Returns settings with defaults                            |
| `PATCH /api/settings`       | Updates `daily_goal`, confirms new value                  |

Run with:
```bash
cd backend
npm test
```

---

## Troubleshooting

### Backend container unhealthy

**Symptom**: `docker compose ps` shows backend as "unhealthy".
**Cause**: SQLite can't write to `/data` because Docker volume mounts as root but container runs as `USER node`.
**Fix**: The Dockerfile includes `RUN mkdir -p /data && chown node:node /data` before `USER node`. If you modified the Dockerfile, ensure this line is present.

### Grafana/Prometheus dashboards are empty

**Symptom**: Panels show "No data".
**Checks**:
1. Go to **Prometheus** → Status → Targets. Both targets should show "UP".
2. In Prometheus, query `up{job="life-gamified-backend"}` — should return 1.
3. Query `http_requests_total` — should have entries.
4. If no data: run the traffic generator script to create activity.
5. If targets are down: check `prometheus.yml` has `metrics_path: /api/metrics` and target is `backend:3001`.

### K8s pods in CrashLoopBackOff

**Symptom**: Pods keep restarting.
**Checks**:
1. `kubectl logs <pod-name> -n life-gamified` — check error message.
2. Ensure Docker images were built locally (`docker images | grep life-gamified`).
3. Ensure `imagePullPolicy: Never` is set — otherwise K8s tries to pull from a registry.

### Port already in use

**Symptom**: `EADDRINUSE` or Docker bind error.
**Fix**: Stop the conflicting process or change the port in `docker-compose.yml` / `variables.tf`.

### Frontend shows "Failed to fetch"

**Symptom**: Toast errors on page load.
**Cause**: Backend isn't running or Vite proxy isn't configured.
**Fix**: Ensure backend is healthy on `:3001`. In dev mode, `vite.config.ts` should proxy `/api` to `http://localhost:3001`.

---

## License

MIT

---

**Built as a DevOps learning project** — covering full-stack TypeScript, containerization, orchestration, infrastructure-as-code, CI/CD pipelines, and production monitoring from scratch.
