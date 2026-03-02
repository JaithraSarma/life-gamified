# Life Gamified

A **Duolingo-inspired productivity application** that turns your daily to-do list into a game. Earn gems, maintain streaks, buy power-ups, and hit daily goals — all backed by a full-stack TypeScript codebase with a production-grade DevOps pipeline (Docker, Kubernetes, Terraform, CI/CD, Prometheus, Grafana).

> **Built to demonstrate:** modern full-stack development **and** end-to-end DevOps practices — from a button click in the browser all the way through containerized microservices, orchestrated deployments, and real-time monitoring dashboards.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Architecture Overview](#2-architecture-overview)
3. [Feature Walkthrough — What the App Does](#3-feature-walkthrough--what-the-app-does)
4. [How a Button Click Travels Through the Entire Stack](#4-how-a-button-click-travels-through-the-entire-stack)
   - 4.1 [Creating a Task](#41-creating-a-task)
   - 4.2 [Completing a Task (Toggle)](#42-completing-a-task-toggle)
   - 4.3 [Buying a Streak Freeze](#43-buying-a-streak-freeze)
   - 4.4 [Changing Settings](#44-changing-settings)
   - 4.5 [Deleting a Task](#45-deleting-a-task)
5. [Project Structure — Every File & Folder Explained](#5-project-structure--every-file--folder-explained)
6. [Frontend Deep Dive](#6-frontend-deep-dive)
7. [Backend Deep Dive](#7-backend-deep-dive)
8. [Database Schema](#8-database-schema)
9. [Docker & Docker Compose](#9-docker--docker-compose)
10. [Kubernetes (K8s)](#10-kubernetes-k8s)
11. [Terraform (Infrastructure as Code)](#11-terraform-infrastructure-as-code)
12. [CI/CD Pipeline (GitHub Actions)](#12-cicd-pipeline-github-actions)
13. [Monitoring — Prometheus & Grafana](#13-monitoring--prometheus--grafana)
14. [The Complete DevOps Lifecycle](#14-the-complete-devops-lifecycle)
15. [Commands Cheat Sheet](#15-commands-cheat-sheet)
16. [Interview Q&A — Explaining This Project](#16-interview-qa--explaining-this-project)

---

## 1. Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Backend & frontend runtime |
| npm | 10+ | Package manager |
| Docker Desktop | 4.x+ | Containerization |
| kubectl | 1.28+ | Kubernetes CLI (enable K8s in Docker Desktop) |
| Terraform | 1.5+ | Infrastructure as Code |

### Run Locally (Development)

```bash
# Install all dependencies
cd backend && npm install && cd ../frontend && npm install && cd ..

# Start backend (port 3001) and frontend (port 5173) in separate terminals
cd backend && npm run dev
cd frontend && npm run dev
```

### Run with Docker Compose (Production-like)

```bash
docker compose up -d --build
# Backend:      http://localhost:3001
# Frontend:     http://localhost:5173
# Prometheus:   http://localhost:9090
# Grafana:      http://localhost:3000 (admin / admin)
```

### Run on Local Kubernetes

```powershell
# Build images
docker build -t life-gamified-backend:latest ./backend
docker build -t life-gamified-frontend:latest ./frontend

# Deploy
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/

# Verify
kubectl get pods -n life-gamified

# Access via port-forward
kubectl port-forward svc/backend 3002:3001 -n life-gamified
kubectl port-forward svc/frontend 8080:80 -n life-gamified
```

### Run with Terraform

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply -auto-approve    # Creates Docker containers via IaC
terraform destroy -auto-approve  # Clean up
```

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                               │
│  React 18 + TypeScript + Tailwind CSS + Zustand (State Management)  │
│                                                                     │
│  Components: Header, TaskList, TaskItem, AddTaskModal,              │
│              DailyProgress, StreakTimer, PowerUpShop, SettingsModal  │
│                                                                     │
│  Stores: taskStore, statsStore, settingsStore, powerUpStore         │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTP (fetch → /api/*)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NGINX (in Docker/K8s only)                      │
│         Serves static files, proxies /api/* to backend              │
│         Config: frontend/nginx.conf                                 │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ proxy_pass http://backend:3001
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                EXPRESS.JS BACKEND (Port 3001)                        │
│                                                                     │
│  Middleware Chain:   cors() → json() → metricsMiddleware            │
│                                                                     │
│  Routes:                                                            │
│    GET  /api/health        → Health check                           │
│    GET  /api/metrics       → Prometheus metrics (prom-client)       │
│    GET  /api/tasks         → List all tasks with subtasks           │
│    POST /api/tasks         → Create a task or subtask               │
│    PATCH /api/tasks/:id    → Toggle task completion                 │
│    DELETE /api/tasks/:id   → Delete a task and its subtasks         │
│    GET  /api/stats         → User statistics (gems, streak, etc.)   │
│    GET  /api/settings      → App settings                           │
│    PATCH /api/settings     → Update settings                        │
│    GET  /api/powerups      → List available power-ups               │
│    POST /api/powerups/freeze/buy  → Purchase streak freeze          │
│    POST /api/powerups/freeze/use  → Activate streak freeze          │
│                                                                     │
│  Metrics: httpRequestsTotal, httpRequestDuration, activeTasksGauge, │
│           gemsGauge, streakGauge, todayCompletedGauge, etc.         │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ better-sqlite3 (synchronous)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SQLite DATABASE                                   │
│  Tables: tasks, user_stats, daily_records, settings, powerup_log    │
│  Mode: WAL (Write-Ahead Logging) for concurrent reads               │
│  Location: /data/life-gamified.db (Docker) or ./life-gamified.db    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                                  │
│                                                                     │
│  Prometheus (port 9090)           Grafana (port 3000)               │
│  - Scrapes /api/metrics           - 14-panel dashboard              │
│    every 15 seconds               - Auto-provisioned datasource     │
│  - Stores time-series data        - PromQL queries for all metrics  │
│  - Targets: backend + self        - Real-time auto-refresh (10s)    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Feature Walkthrough — What the App Does

| Feature | How It Works |
|---------|-------------|
| **Tasks & Subtasks** | Create tasks, add subtasks under them. Single-level nesting only. |
| **Gem System** | Complete a main task → +10 gems. Complete a subtask → +2 gems. Un-complete reverses the gems. |
| **Streak System** | Meet your daily goal (default: 4 tasks/day) to maintain your streak. Streaks reset if you miss a day without using a freeze. |
| **Streak Timer** | Countdown timer showing time until your daily deadline (default: 23:59). Sends browser notifications when < 30 minutes remain. |
| **Daily Progress** | Visual progress bar showing tasks completed today vs. your daily goal. |
| **Streak Freeze (Power-Up)** | Costs 50 gems. Protects your streak for one missed day. Buy in advance, use when needed. |
| **Settings** | Customize daily goal (1-50), deadline time, and notification preferences. |

---

## 4. How a Button Click Travels Through the Entire Stack

This section traces every user interaction from the moment a button is clicked in the UI all the way to the database and back — showing exactly how every layer of the stack is connected.

### 4.1 Creating a Task

**User Action:** User clicks the orange "+" FAB button, types a task title, clicks "Add Task".

```
Step-by-step flow:

1. UI LAYER (App.tsx)
   └─ User clicks FAB → setShowAddTask(true) → AddTaskModal renders

2. MODAL (AddTaskModal.tsx)
   └─ User types "Buy groceries" → clicks "Add Task"
   └─ Calls handleSubmit() → addTask(title.trim())
   └─ Closes modal via onClose()

3. ZUSTAND STORE (taskStore.ts → addTask)
   └─ Calls api.createTask("Buy groceries")
   └─ On success: calls fetchTasks() to refresh the task list
   └─ Shows toast: "Task added! 🎯"

4. API CLIENT (client.ts → createTask)
   └─ fetch("/api/tasks", { method: "POST", body: { title: "Buy groceries" } })
   └─ In dev: Vite proxy forwards /api/* → http://localhost:3001
   └─ In Docker: Nginx proxy_pass /api/* → http://backend:3001

5. EXPRESS MIDDLEWARE (index.ts)
   └─ cors() → allows the request
   └─ express.json() → parses the JSON body
   └─ metricsMiddleware → starts a timer for http_request_duration_seconds

6. ROUTE HANDLER (routes/tasks.ts → POST /)
   └─ Validates: title exists, is a string, not empty
   └─ If parent_id: validates parent exists and isn't itself a subtask
   └─ Generates UUID via uuidv4()
   └─ SQL: INSERT INTO tasks (id, title, parent_id) VALUES (?, ?, ?)
   └─ Reads back: SELECT * FROM tasks WHERE id = ?
   └─ Calls refreshGauges() → updates Prometheus metrics
   └─ Returns 201 { id, title, completed: false, ... }

7. DATABASE (database.ts → SQLite)
   └─ better-sqlite3 executes the INSERT synchronously
   └─ WAL mode allows concurrent reads during the write
   └─ Row stored in: /data/life-gamified.db (Docker) or ./life-gamified.db

8. METRICS UPDATE (metrics.ts → refreshGauges)
   └─ Queries DB for counts: active tasks, active subtasks, gems, streak
   └─ Updates Prometheus gauges: app_active_tasks, app_active_subtasks, etc.
   └─ metricsMiddleware records: http_requests_total{method="POST", route="/api/tasks", status_code="201"}
   └─ Records duration in http_request_duration_seconds histogram

9. RESPONSE FLOWS BACK
   └─ Express → (Nginx/Vite proxy) → fetch resolves → api.createTask returns
   └─ taskStore.addTask() calls fetchTasks() → GET /api/tasks
   └─ New task list set in Zustand state → React re-renders TaskList

10. REACT RE-RENDER
    └─ TaskList reads tasks from useTaskStore()
    └─ New task appears with animate-slide-up CSS animation
    └─ toast.success("Task added! 🎯") shown via react-hot-toast

11. CASCADING EFFECTS
    └─ App.tsx useEffect watches tasks array → triggers fetchStats() + fetchPowerUps()
    └─ statsStore updates → DailyProgress bar re-renders
    └─ Header gem count re-renders
    └─ StreakTimer re-evaluates if goal is met

12. MONITORING (every 15s)
    └─ Prometheus scrapes GET /api/metrics from the backend
    └─ app_active_tasks gauge now shows +1
    └─ Grafana dashboard auto-refreshes every 10s
    └─ "Active Tasks" panel updates, "HTTP Request Rate" shows the POST spike
```

### 4.2 Completing a Task (Toggle)

**User Action:** User clicks the circle checkbox next to a task.

```
Step-by-step flow:

1. UI LAYER (TaskItem.tsx)
   └─ User clicks checkbox button → onClick={() => toggleTask(task.id)}

2. ZUSTAND STORE (taskStore.ts → toggleTask)
   └─ Calls api.toggleTask(id) → PATCH /api/tasks/:id
   └─ On success: checks result.completed
   └─ If completed: shows toast "+10 gems! 💎" (or "+2 gems! 💎" for subtask)
   └─ Calls fetchTasks() to refresh

3. API CLIENT (client.ts → toggleTask)
   └─ fetch(`/api/tasks/${id}`, { method: "PATCH" })

4. ROUTE HANDLER (routes/tasks.ts → PATCH /:id)
   └─ Looks up task: SELECT * FROM tasks WHERE id = ?
   └─ Flips completion: newCompleted = !task.completed
   └─ SQL: UPDATE tasks SET completed = ?, completed_at = ? WHERE id = ?
   │
   ├─ GEM AWARD:
   │  └─ Is subtask? → +2 gems. Is main task? → +10 gems
   │  └─ SQL: UPDATE user_stats SET gems = gems + ? WHERE id = 1
   │  └─ (If un-completing: gems are revoked, floored at 0)
   │
   ├─ DAILY RECORD UPDATE:
   │  └─ Ensures today's record exists in daily_records table
   │  └─ Counts all tasks completed today: SELECT COUNT(*) WHERE completed_at date = today
   │  └─ Updates: daily_records SET tasks_completed = ?, goal_met = ?
   │
   ├─ STREAK UPDATE (only when completing AND goal just met):
   │  └─ Checks yesterday's record: did user meet goal or use a freeze?
   │  └─ If yes: current_streak + 1
   │  └─ If no (first day): streak = 1
   │  └─ Updates longest_streak if new streak is higher
   │  └─ SQL: UPDATE user_stats SET current_streak = ?, longest_streak = ?
   │
   └─ METRICS:
      └─ tasksCompletedTotal.inc() — cumulative counter increments
      └─ refreshGauges() — re-syncs all gauges from DB

5. CASCADING UI UPDATES
   └─ fetchTasks() runs → task list re-renders with strike-through styling
   └─ App.tsx useEffect detects tasks change → fetchStats()
   └─ statsStore updates: gems, current_streak, today_completed, goal_met_today
   └─ DailyProgress: progress bar fills, shows "✅ Daily goal reached!" if met
   └─ Header: gem count updates, streak flame animates if > 0
   └─ StreakTimer: disappears entirely when goal_met_today === true

6. MONITORING
   └─ Prometheus sees: http_requests_total{method="PATCH", route="/api/tasks/:id", status_code="200"} +1
   └─ app_tasks_completed_total counter increments
   └─ app_gems_balance gauge changes
   └─ app_today_completed gauge updates
   └─ app_current_streak gauge potentially increments
   └─ Grafana panels all reflect the changes within 10s
```

### 4.3 Buying a Streak Freeze

**User Action:** User clicks the gem count in the header → clicks "Buy Freeze" in the Power-Up Shop.

```
Step-by-step flow:

1. UI LAYER (Header.tsx)
   └─ User clicks 💎 gem badge → onOpenShop() → setShowShop(true)

2. MODAL (PowerUpShop.tsx)
   └─ Reads gems from useStatsStore, freezesOwned from usePowerUpStore
   └─ Shows "Buy Freeze" button (disabled if gems < 50)
   └─ User clicks "Buy Freeze" → buyFreeze() then fetchStats()

3. ZUSTAND STORE (powerUpStore.ts → buyFreeze)
   └─ Sets loading: true
   └─ Calls api.buyFreeze() → POST /api/powerups/freeze/buy
   └─ On success: updates freezesOwned in store
   └─ Shows toast: "Streak Freeze purchased! 🧊"
   └─ Calls useStatsStore.getState().fetchStats() to refresh gem count

4. ROUTE HANDLER (routes/powerups.ts → POST /freeze/buy)
   └─ Reads current: SELECT gems, freeze_count FROM user_stats
   └─ Validates: gems >= 50 (FREEZE_COST)
   └─ SQL: UPDATE user_stats SET gems = gems - 50, freeze_count = freeze_count + 1
   └─ Returns: { message, gems: newBalance, freezes_owned: newCount }

5. UI UPDATE
   └─ PowerUpShop: "Owned: 🧊 1" appears, "Use Today" button becomes visible
   └─ Header: gem count decreases by 50
   └─ If gems drop below 50: "Buy Freeze" becomes "Not enough gems" (disabled)
```

### 4.4 Changing Settings

**User Action:** User clicks the gear icon → changes daily goal to 6 → clicks "Save".

```
Step-by-step flow:

1. UI LAYER (Header.tsx)
   └─ User clicks ⚙️ → onOpenSettings() → setShowSettings(true)

2. MODAL (SettingsModal.tsx)
   └─ Loads current values from useSettingsStore into local state
   └─ User changes goal slider to 6, clicks "Save"
   └─ Calls updateSettings({ daily_goal: 6, streak_deadline, notifications_enabled })

3. ZUSTAND STORE (settingsStore.ts → updateSettings)
   └─ Calls api.updateSettings(data) → PATCH /api/settings

4. ROUTE HANDLER (routes/settings.ts → PATCH /)
   └─ Reads current settings: SELECT * FROM settings WHERE id = 1
   └─ Merges with request body (only provided fields override)
   └─ Validates: daily_goal between 1-50, deadline in HH:mm format
   └─ SQL: UPDATE settings SET daily_goal = ?, streak_deadline = ?, notifications_enabled = ?
   └─ Returns full updated settings object

5. UI UPDATE
   └─ settingsStore merges new settings into state
   └─ DailyProgress: denominator changes (e.g., "2/6" instead of "2/4")
   └─ DailyProgress: progress bar width recalculates
   └─ StreakTimer: uses new streak_deadline for countdown
   └─ goal_met_today may flip if new goal is lower than today_completed
```

### 4.5 Deleting a Task

**User Action:** User clicks the trash icon on a task.

```
Step-by-step flow:

1. UI LAYER (TaskItem.tsx)
   └─ User clicks 🗑️ → onClick={() => deleteTask(task.id)}

2. ZUSTAND STORE (taskStore.ts → deleteTask)
   └─ Calls api.deleteTask(id) → DELETE /api/tasks/:id
   └─ On success: fetchTasks() to refresh
   └─ Shows toast: "Task removed"

3. ROUTE HANDLER (routes/tasks.ts → DELETE /:id)
   └─ Looks up: SELECT * FROM tasks WHERE id = ?
   └─ Returns 404 if not found
   └─ SQL: DELETE FROM tasks WHERE parent_id = ? (delete subtasks first)
   └─ SQL: DELETE FROM tasks WHERE id = ? (delete the task itself)
   └─ Calls refreshGauges() → metrics update
   └─ Returns 204 No Content

4. UI UPDATE
   └─ Task disappears from the list with animation
   └─ Stats refresh → daily progress may change
   └─ Active Tasks / Active Subtasks gauges decrement in Grafana
```

---

## 5. Project Structure — Every File & Folder Explained

```
life-gamified/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # CI pipeline: lint, test, build, Docker build, Trivy scan
│       └── cd.yml                  # CD pipeline: build & push images to GHCR, K8s deploy
│
├── backend/
│   ├── Dockerfile                  # Multi-stage Docker build: compile TS → slim runtime image
│   ├── .dockerignore               # Excludes node_modules, .db files, etc. from Docker context
│   ├── package.json                # Backend dependencies and scripts
│   ├── tsconfig.json               # TypeScript compiler config (target: ES2022, module: Node16)
│   └── src/
│       ├── index.ts                # Express server entry point — middleware, routes, health, metrics
│       ├── database.ts             # SQLite connection (better-sqlite3), schema init, WAL mode
│       ├── metrics.ts              # Prometheus metrics: counters, histograms, gauges, middleware
│       ├── types.ts                # Shared TypeScript interfaces (Task, UserStats, Settings, etc.)
│       └── routes/
│           ├── tasks.ts            # CRUD for tasks + subtasks, gem awards, streak logic
│           ├── stats.ts            # Aggregated user statistics, streak continuity check
│           ├── settings.ts         # Read/update daily goal, deadline, notification preferences
│           └── powerups.ts         # Buy & use streak freezes, power-up listing
│
├── frontend/
│   ├── Dockerfile                  # Multi-stage build: Vite build → Nginx serving
│   ├── .dockerignore               # Excludes node_modules, dist from Docker context
│   ├── nginx.conf                  # Nginx config: SPA fallback, /api proxy, static asset caching
│   ├── package.json                # Frontend dependencies and scripts
│   ├── vite.config.ts              # Vite dev server config with /api proxy to backend:3001
│   ├── tsconfig.json               # TypeScript config for React
│   ├── tailwind.config.js          # Tailwind CSS with custom "warm" color palette + animations
│   ├── postcss.config.js           # PostCSS with Tailwind and autoprefixer plugins
│   ├── index.html                  # HTML shell — Vite injects bundle here
│   └── src/
│       ├── main.tsx                # React entry point: renders <App /> into #root
│       ├── App.tsx                 # Root component: layout, modals, data fetching orchestration
│       ├── index.css               # Global CSS: Tailwind directives, custom animations, glass effects
│       ├── api/
│       │   └── client.ts           # API abstraction layer — typed fetch wrapper for all endpoints
│       ├── stores/
│       │   ├── taskStore.ts        # Zustand store: tasks CRUD, optimistic updates, toast notifications
│       │   ├── statsStore.ts       # Zustand store: gems, streak, daily progress
│       │   ├── settingsStore.ts    # Zustand store: daily goal, deadline, notification prefs
│       │   └── powerUpStore.ts     # Zustand store: freeze inventory, buy/use actions
│       ├── components/
│       │   ├── Header.tsx          # Top bar: brand, streak flame, gem count, settings/shop buttons
│       │   ├── DailyProgress.tsx   # Progress bar showing today_completed / daily_goal
│       │   ├── StreakTimer.tsx      # Countdown timer to streak deadline, sends notifications
│       │   ├── TaskList.tsx        # Renders active tasks, then completed section with divider
│       │   ├── TaskItem.tsx        # Single task card: checkbox, subtask progress, expand, delete
│       │   ├── AddTaskModal.tsx    # Modal for creating a new task (title input + submit)
│       │   ├── PowerUpShop.tsx     # Modal to buy/use streak freezes, shows gem balance
│       │   └── SettingsModal.tsx   # Modal for daily goal, deadline, notification toggles
│       └── pages/                  # (Reserved for future multi-page routing)
│
├── k8s/
│   ├── namespace.yaml              # Creates the "life-gamified" namespace with labels
│   ├── backend-deployment.yaml     # Backend: 2 replicas, health probes, PVC, resource limits
│   ├── frontend-deployment.yaml    # Frontend: 2 replicas, health probes, resource limits
│   └── ingress.yaml                # Path-based routing: /api → backend, / → frontend
│
├── infra/
│   └── terraform/
│       ├── main.tf                 # Docker provider: network, images, containers, volume
│       └── variables.tf            # Configurable: docker_host, ports, environment
│
├── monitoring/
│   ├── prometheus.yml              # Prometheus scrape config: backend + self targets
│   ├── grafana-dashboard.json      # 14-panel dashboard with PromQL queries
│   ├── grafana-datasource.yml      # Auto-provisioned Prometheus datasource for Grafana
│   └── grafana-dashboard-provider.yml  # Tells Grafana where to find dashboard JSON files
│
├── scripts/
│   ├── generate-traffic.ps1        # PowerShell script to simulate user traffic for metrics
│   ├── deploy-local-k8s.ps1       # Automated local K8s deployment (build, apply, rollout)
│   └── teardown-k8s.ps1           # Tears down all K8s resources in the namespace
│
├── docker-compose.yml              # 4-service stack: backend, frontend, prometheus, grafana
├── Makefile                        # Developer shortcuts: dev, build, test, docker, k8s, terraform
├── .gitignore                      # Ignores: node_modules, dist, .db, .terraform, .env, etc.
└── README.md                       # This file
```

---

## 6. Frontend Deep Dive

### Tech Stack

| Technology | Role |
|-----------|------|
| **React 18** | UI component library |
| **TypeScript** | Static typing for all components and stores |
| **Vite** | Build tool and dev server (HMR, fast builds) |
| **Tailwind CSS** | Utility-first styling with custom color palette |
| **Zustand** | Lightweight state management (no boilerplate like Redux) |
| **react-hot-toast** | Toast notifications for user feedback |

### Why Zustand Instead of Redux?

Zustand was chosen because:
- **No boilerplate** — no action types, no reducers, no dispatch. Just a hook.
- **Tiny bundle** — ~1KB vs Redux Toolkit's ~12KB
- **Direct async** — async functions live in the store itself (no thunks/sagas)
- **Selective re-renders** — components subscribe to individual slices: `useTaskStore(s => s.tasks)`

### How State Management Works

```
             ┌──────────────┐
             │   Component  │ ← reads from store via useXxxStore(selector)
             │  (e.g. Header) │
             └──────┬───────┘
                    │ calls store action (e.g. fetchStats)
                    ▼
             ┌──────────────┐
             │ Zustand Store│ ← holds state + async actions
             │ (statsStore) │
             └──────┬───────┘
                    │ calls api.getStats()
                    ▼
             ┌──────────────┐
             │  API Client  │ ← typed fetch wrapper
             │ (client.ts)  │
             └──────┬───────┘
                    │ HTTP request
                    ▼
               Backend API
```

Each store is independent:
- **taskStore** — tasks array, loading state, CRUD actions
- **statsStore** — gems, streak, daily progress, fetched whenever tasks change
- **settingsStore** — daily goal, deadline, notification prefs
- **powerUpStore** — freeze inventory, buy/use actions

### Cascading Re-renders

When tasks change, `App.tsx` triggers a cascade:

```tsx
// App.tsx — tasks change detection
const tasks = useTaskStore((s) => s.tasks);
useEffect(() => {
  fetchStats();      // Refresh gems, streak, daily progress
  fetchPowerUps();   // Refresh freeze count (gems might have changed)
}, [tasks]);
```

This means completing a single task triggers:
1. `TaskList` re-renders (task shows strike-through)
2. `DailyProgress` re-renders (progress bar fills)
3. `Header` re-renders (gem count updates, streak flame animates)
4. `StreakTimer` re-renders (may hide if goal met)

### How the Dev Proxy Works

During development, the frontend runs on port 5173 and the backend on port 3001. Vite's dev proxy seamlessly bridges them:

```typescript
// vite.config.ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:3001",
      changeOrigin: true,
    },
  },
}
```

In production (Docker), Nginx does the same job:

```nginx
# nginx.conf
location /api/ {
    proxy_pass http://backend:3001;
}
```

---

## 7. Backend Deep Dive

### Tech Stack

| Technology | Role |
|-----------|------|
| **Express.js** | HTTP server framework |
| **TypeScript** | Type safety across all routes and models |
| **better-sqlite3** | Synchronous SQLite driver (no async complexity) |
| **prom-client** | Official Prometheus metrics library for Node.js |
| **uuid** | Generate unique task IDs |
| **cors** | Cross-Origin Resource Sharing middleware |

### Why SQLite?

- **Zero infrastructure** — no database server to install, configure, or manage
- **Synchronous API** — `better-sqlite3` is synchronous, simplifying Express route handlers
- **Single file** — entire database is one `.db` file, easy to backup/move
- **WAL mode** — enables concurrent reads while writing, adequate for a single-user app
- **Perfect for learning** — demonstrates real SQL (CREATE TABLE, JOINs, constraints) without cloud complexity

### Middleware Chain

Every request passes through this chain before reaching a route:

```
Request → cors() → express.json() → metricsMiddleware → route handler → Response
   │                                        │                               │
   │                                        │                               │
   │                                 Starts timer                    On "finish" event:
   │                                                                  - Record duration
   │                                                                  - Increment counter
   │                                                                  - Label with method,
   │                                                                    route, status_code
```

### The Metrics Middleware Explained

```typescript
// metrics.ts — metricsMiddleware
export function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer();  // Start timing

  res.on("finish", () => {
    // Normalize: /api/tasks/abc-123-def → /api/tasks/:id
    const route = req.path.replace(/[0-9a-f-]{36}/gi, ":id");

    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    httpRequestsTotal.inc(labels);  // Counter: total requests
    end(labels);                    // Histogram: request duration
  });

  next();
}
```

This produces metrics like:
```
http_requests_total{method="POST",route="/api/tasks",status_code="201"} 5
http_request_duration_seconds_bucket{method="GET",route="/api/stats",status_code="200",le="0.01"} 42
```

### How refreshGauges() Works

After every mutation (create, toggle, delete), the backend re-syncs all Prometheus gauges from the database:

```typescript
function refreshGauges(): void {
  const db = getDb();
  const mainCount = db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE completed=0 AND parent_id IS NULL`).get();
  const subCount  = db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE completed=0 AND parent_id IS NOT NULL`).get();
  const stats     = db.prepare(`SELECT * FROM user_stats WHERE id = 1`).get();
  const daily     = db.prepare(`SELECT tasks_completed FROM daily_records WHERE date = ?`).get(today);

  activeTasksGauge.set(mainCount.c);
  activeSubtasksGauge.set(subCount.c);
  gemsGauge.set(stats.gems);
  streakGauge.set(stats.current_streak);
  todayCompletedGauge.set(daily.tasks_completed);
}
```

This ensures Prometheus always has the latest state, even if Prometheus scrapes happened between mutations.

---

## 8. Database Schema

```sql
-- Core task storage. parent_id creates the subtask hierarchy.
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,                          -- UUID
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0,                  -- 0 = false, 1 = true
  parent_id TEXT,                               -- NULL = main task, set = subtask
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,                            -- Set when completed, cleared when un-completed
  FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Singleton row (id=1) tracking user's gamification state.
CREATE TABLE user_stats (
  id INTEGER PRIMARY KEY CHECK (id = 1),        -- Only one row allowed
  gems INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  freeze_count INTEGER DEFAULT 0                -- Streak freezes owned
);

-- One row per calendar day. Tracks goal progress.
CREATE TABLE daily_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,                    -- YYYY-MM-DD
  tasks_completed INTEGER DEFAULT 0,
  goal_met INTEGER DEFAULT 0                    -- 1 when tasks_completed >= daily_goal
);

-- User-configurable settings. Singleton row (id=1).
CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  daily_goal INTEGER DEFAULT 4,
  streak_deadline TEXT DEFAULT '23:59',          -- HH:mm format
  notifications_enabled INTEGER DEFAULT 1
);

-- Audit log of power-up usage.
CREATE TABLE powerup_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,                           -- 'freeze'
  used_at TEXT DEFAULT (datetime('now')),
  date_applied TEXT NOT NULL                    -- Which date the freeze covers
);
```

### Data Flow for Streak Logic

```
User completes 4th task today (daily_goal = 4)
        │
        ▼
daily_records: tasks_completed = 4, goal_met = 1
        │
        ▼
Check yesterday's record:
  ├─ Yesterday goal_met = 1?     → streak continues: current_streak + 1
  ├─ Yesterday has freeze log?   → streak continues: current_streak + 1
  └─ Neither?                    → streak resets to 1 (fresh start)
        │
        ▼
user_stats: current_streak = new_value
            longest_streak = max(longest_streak, current_streak)
```

---

## 9. Docker & Docker Compose

### Backend Dockerfile (Multi-Stage Build)

```dockerfile
# Stage 1: BUILD — Install all deps, compile TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                    # Install ALL dependencies (including devDependencies)
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build             # tsc → outputs to ./dist/

# Stage 2: RUNTIME — Slim production image
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl   # Required for health check
RUN mkdir -p /data && chown node:node /data   # DB volume with correct ownership
COPY package*.json ./
RUN npm ci --omit=dev         # Install ONLY production dependencies
COPY --from=builder /app/dist ./dist
EXPOSE 3001
USER node                     # Run as non-root for security
CMD ["node", "dist/index.js"]
```

**Why multi-stage?**
- Stage 1 (builder) has TypeScript, devDependencies — ~300MB
- Stage 2 (runtime) has only production code — ~150MB
- Final image is 50% smaller, no source code or dev tools leaked

**Why `mkdir /data && chown node:node`?**
The container runs as `USER node` (non-root) for security. Docker volumes mount as root by default. Without this line, SQLite can't create the database file → container crashes with `SQLITE_CANTOPEN`.

### Frontend Dockerfile

```dockerfile
# Stage 1: BUILD — Vite compiles React to static HTML/JS/CSS
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build             # vite build → outputs to ./dist/

# Stage 2: SERVE — Nginx serves the static files
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Why Nginx instead of a Node.js server?**
- Nginx is purpose-built for serving static files — 10x faster, 10x less memory
- Handles SPA routing (`try_files $uri $uri/ /index.html`)
- Proxies `/api/*` to the backend container
- Caches static assets with 1-year expiry headers

### Docker Compose — The Full Stack

```yaml
services:
  backend:            # Express API on port 3001
  frontend:           # Nginx + React on port 5173 (maps to container port 80)
  prometheus:          # Metrics collector on port 9090
  grafana:            # Dashboard UI on port 3000

volumes:
  db-data:            # Persists SQLite database across container restarts
  grafana-data:       # Persists Grafana settings and dashboards
```

**Service dependency chain:**
```
backend (must be healthy first)
   ├── frontend (depends_on: backend healthy)
   ├── prometheus (depends_on: backend healthy)
   └── grafana (depends_on: prometheus)
```

The `healthcheck` on the backend ensures other services only start after the API is confirmed responding:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

---

## 10. Kubernetes (K8s)

### What Is Kubernetes and Why Use It?

Kubernetes (K8s) is a container orchestration platform. While Docker Compose runs containers on a single machine, Kubernetes:
- **Scales horizontally** — run multiple replicas of each service
- **Self-heals** — automatically restarts crashed containers
- **Load balances** — distributes traffic across replicas
- **Rolling updates** — deploy new versions with zero downtime
- **Health monitoring** — liveness/readiness probes detect unhealthy pods

### Our K8s Architecture

```
┌── Namespace: life-gamified ──────────────────────────────────┐
│                                                               │
│  ┌── Deployment: backend (2 replicas) ────────────────────┐  │
│  │  Pod 1: life-gamified-backend:latest                    │  │
│  │  Pod 2: life-gamified-backend:latest                    │  │
│  │  + PVC: 1Gi persistent storage for SQLite               │  │
│  └───────────────┬────────────────────────────────────────┘  │
│                  │                                            │
│  ┌── Service: backend (ClusterIP:3001) ──────────────────┐  │
│  │  Routes internal traffic to backend pods               │  │
│  └───────────────┬────────────────────────────────────────┘  │
│                  │                                            │
│  ┌── Deployment: frontend (2 replicas) ──────────────────┐  │
│  │  Pod 1: life-gamified-frontend:latest (Nginx)          │  │
│  │  Pod 2: life-gamified-frontend:latest (Nginx)          │  │
│  └───────────────┬────────────────────────────────────────┘  │
│                  │                                            │
│  ┌── Service: frontend (ClusterIP:80) ───────────────────┐  │
│  │  Routes internal traffic to frontend pods              │  │
│  └───────────────┬────────────────────────────────────────┘  │
│                  │                                            │
│  ┌── Ingress: life-gamified-ingress ─────────────────────┐  │
│  │  /api/*  → backend:3001                                │  │
│  │  /*      → frontend:80                                 │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### K8s Manifest Files Explained

| File | Resource | Purpose |
|------|----------|---------|
| `namespace.yaml` | Namespace | Isolates all resources under `life-gamified` |
| `backend-deployment.yaml` | Deployment + Service + PVC | 2 backend pods with health probes, 1Gi persistent volume, ClusterIP service |
| `frontend-deployment.yaml` | Deployment + Service | 2 frontend pods with health probes, ClusterIP service |
| `ingress.yaml` | Ingress | Path-based routing — `/api` to backend, `/` to frontend |

### Key K8s Concepts Used

**Liveness Probe** — "Is the container alive?"
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3001
  initialDelaySeconds: 10    # Wait 10s after start
  periodSeconds: 30          # Check every 30s
```
If this fails 3 times → K8s kills and restarts the container.

**Readiness Probe** — "Is the container ready to receive traffic?"
```yaml
readinessProbe:
  httpGet:
    path: /api/health
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 10
```
If this fails → K8s removes the pod from the Service (no traffic routed to it) but doesn't kill it.

**Resource Limits** — Prevents one container from starving others:
```yaml
resources:
  requests:            # Guaranteed minimum
    cpu: 100m          # 0.1 CPU core
    memory: 128Mi      # 128 MB RAM
  limits:              # Maximum allowed
    cpu: 500m          # 0.5 CPU core
    memory: 256Mi      # 256 MB RAM
```

**imagePullPolicy: Never** — Tells K8s to use locally-built Docker images instead of pulling from a registry. Essential for local development with Docker Desktop K8s.

**PersistentVolumeClaim** — Ensures the SQLite database survives pod restarts:
```yaml
spec:
  accessModes: [ReadWriteOnce]    # One pod at a time can write
  resources:
    requests:
      storage: 1Gi
```

---

## 11. Terraform (Infrastructure as Code)

### What Is Terraform and Why Use It?

Terraform lets you define infrastructure in declarative `.tf` files instead of running manual commands. Benefits:
- **Reproducible** — `terraform apply` creates the exact same infrastructure every time
- **Version-controlled** — infrastructure changes are tracked in Git alongside code
- **Plannable** — `terraform plan` shows what will change before you apply
- **Destroyable** — `terraform destroy` cleanly removes everything

### Our Terraform Configuration

```hcl
# main.tf — uses the Docker provider (no cloud account needed)

provider "docker" {
  host = "npipe:////.//pipe//docker_engine"   # Windows Docker socket
}

# Resources created:
# 1. docker_network.app_network       — isolated network for containers
# 2. docker_image.backend             — builds backend Docker image
# 3. docker_image.frontend            — builds frontend Docker image
# 4. docker_container.backend         — runs backend with health check, env vars, volume
# 5. docker_container.frontend        — runs frontend, depends on backend
# 6. docker_volume.db_data            — persistent volume for SQLite
```

### Terraform Workflow

```
terraform init      # Download the Docker provider plugin
        │
        ▼
terraform plan      # Show what resources will be created/changed/destroyed
        │           # Output: "Plan: 6 to add, 0 to change, 0 to destroy"
        ▼
terraform apply     # Create all 6 resources (network, images, containers, volume)
        │           # Output: "Apply complete! Resources: 6 added"
        ▼
terraform show      # Display current state of all managed resources
        │
        ▼
terraform destroy   # Remove everything cleanly
                    # Output: "Destroy complete! Resources: 6 destroyed"
```

### State Management

Terraform maintains a `terraform.tfstate` file that maps your `.tf` config to real Docker resources. This file:
- Tracks resource IDs (container hashes, network IDs)
- Enables `plan` to show diffs between desired and actual state
- Should NEVER be committed to Git (it's in `.gitignore`)
- In teams, stored in a remote backend (S3, Azure Blob) — we have a commented-out S3 config

---

## 12. CI/CD Pipeline (GitHub Actions)

### CI Pipeline (ci.yml) — Runs on Every Push/PR

```
Push to main/develop or open PR
        │
        ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────────┐
│ Backend Lint+Test │   │ Frontend Lint+Build│   │    Security Scan      │
│                   │   │                   │   │                       │
│ 1. npm ci         │   │ 1. npm ci         │   │ Trivy scans backend/  │
│ 2. npm run lint   │   │ 2. npm run lint   │   │ and frontend/ for     │
│ 3. npm test       │   │ 3. npm run build  │   │ HIGH & CRITICAL vulns │
│ 4. npm run build  │   │                   │   │                       │
└────────┬──────────┘   └────────┬──────────┘   └───────────────────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
          ┌────────────────────┐
          │   Docker Build     │
          │                    │
          │ Build both images  │
          │ (not pushed, just  │
          │  validates build)  │
          └────────────────────┘
```

**What each step does:**
- **Lint** — Catches code style issues (ESLint). Uses `|| true` to not fail the build on lint warnings.
- **Test** — Runs vitest test suite (8 tests covering health endpoint, task CRUD, etc.)
- **Build** — Compiles TypeScript to JavaScript, ensuring no compile errors.
- **Docker Build** — Builds both Docker images to verify the Dockerfiles work. Only runs after lint+test pass.
- **Security Scan** — Trivy scans for known vulnerabilities in dependencies (runs in parallel, doesn't block other jobs).

### CD Pipeline (cd.yml) — Runs on Push to Main

```
Push to main
        │
        ▼
┌──────────────────────────────────────┐
│  Build & Push Images to GHCR        │
│                                      │
│  1. Login to GitHub Container Reg    │
│  2. Build backend image              │
│  3. Push: ghcr.io/user/repo/backend │
│     Tags: latest, git-sha            │
│  4. Build frontend image             │
│  5. Push: ghcr.io/user/repo/frontend│
│     Tags: latest, git-sha            │
└──────────────────┬───────────────────┘
                   │
                   ▼ (only if vars.DEPLOY_ENABLED == 'true')
┌──────────────────────────────────────┐
│  Deploy to Kubernetes                │
│                                      │
│  1. Configure kubectl with secrets   │
│  2. Replace image tags in manifests  │
│     (local → GHCR with SHA)          │
│  3. Change imagePullPolicy to Always │
│  4. kubectl apply -f k8s/            │
└──────────────────────────────────────┘
```

**Why `vars.DEPLOY_ENABLED`?**
The K8s deploy step requires a cluster and `KUBE_CONFIG` secret. For local development, this guard prevents the deploy job from running. Enable it when you have a real cluster:
1. Go to GitHub repo → Settings → Variables → New variable
2. Name: `DEPLOY_ENABLED`, Value: `true`
3. Add `KUBE_CONFIG` secret with base64-encoded kubeconfig

---

## 13. Monitoring — Prometheus & Grafana

### How Monitoring Works

```
Backend App                    Prometheus                     Grafana
┌─────────────┐   scrape     ┌─────────────┐    query      ┌─────────────┐
│ /api/metrics │ ←────────── │  Time-series │ ←──────────── │  Dashboard  │
│              │  every 15s  │   Database   │   PromQL      │  14 panels  │
│ prom-client  │             │              │               │  auto-refresh│
│ counters     │             │  Stores all  │               │  every 10s  │
│ histograms   │             │  scrape data │               │             │
│ gauges       │             │  w/ timestamps│              │             │
└─────────────┘              └─────────────┘               └─────────────┘
```

### Metrics Exposed by the Backend

| Metric | Type | What It Tracks |
|--------|------|---------------|
| `http_requests_total` | Counter | Total HTTP requests by method, route, status code |
| `http_request_duration_seconds` | Histogram | How long each request takes (with percentile buckets) |
| `app_active_tasks` | Gauge | Current number of incomplete main tasks |
| `app_active_subtasks` | Gauge | Current number of incomplete subtasks |
| `app_tasks_completed_total` | Counter | Cumulative count of completed tasks |
| `app_gems_balance` | Gauge | Current gem balance |
| `app_current_streak` | Gauge | Current streak length in days |
| `app_today_completed` | Gauge | Tasks completed today |
| `app_nodejs_heap_size_used_bytes` | Gauge | Node.js memory usage (auto-collected) |
| `app_nodejs_eventloop_lag_seconds` | Gauge | Event loop lag (auto-collected) |
| `app_nodejs_active_connections_total` | Gauge | Active HTTP connections (auto-collected) |

### Prometheus Metric Types Explained

**Counter** — Only goes up. Used for cumulative totals.
```
http_requests_total{method="GET"} 142    # 142 total GET requests since startup
```

**Gauge** — Goes up and down. Used for current values.
```
app_gems_balance 380    # User currently has 380 gems
```

**Histogram** — Tracks distribution of values in buckets. Used for latencies.
```
http_request_duration_seconds_bucket{le="0.01"} 95   # 95 requests took < 10ms
http_request_duration_seconds_bucket{le="0.1"}  120   # 120 requests took < 100ms
```

### Grafana Dashboard — 14 Panels

The dashboard is auto-provisioned when Grafana starts (no manual setup needed):

**Row 1 — Status Gauges (6 panels):**
| Panel | PromQL Query | What It Shows |
|-------|-------------|--------------|
| Backend Up/Down | `up{job="life-gamified-backend"}` | Green (UP) or Red (DOWN) |
| Gem Balance | `app_gems_balance` | Current gem count |
| Current Streak | `app_current_streak` | Current streak days |
| Active Tasks | `app_active_tasks` | Incomplete main tasks |
| Active Subtasks | `app_active_subtasks` | Incomplete subtasks |
| Today Completed | `app_today_completed` | Tasks done today |

**Row 2 — HTTP Performance (2 panels):**
| Panel | PromQL Query | What It Shows |
|-------|-------------|--------------|
| Request Rate | `sum(rate(http_requests_total[1m])) by (route)` | Requests per second by route |
| Request Duration | `histogram_quantile(0.50/0.95/0.99, ...)` | p50, p95, p99 latency |

**Row 3 — Application Health (2 panels):**
| Panel | PromQL Query | What It Shows |
|-------|-------------|--------------|
| Responses by Status | `sum(rate(http_requests_total[1m])) by (status_code)` | Color-coded: green=200, blue=201, red=500 |
| Tasks Completed | `app_tasks_completed_total` | Cumulative completions over time |

**Row 4 — Game Metrics & System (2 panels):**
| Panel | PromQL Query | What It Shows |
|-------|-------------|--------------|
| Gem Balance Over Time | `app_gems_balance` | Gem balance trend line |
| Node.js Heap | `app_nodejs_heap_size_used_bytes / 1024 / 1024` | Memory usage in MB |

**Row 5 — System Internals (2 panels):**
| Panel | PromQL Query | What It Shows |
|-------|-------------|--------------|
| Event Loop Lag | `app_nodejs_eventloop_lag_seconds` | Node.js event loop health |
| Active Connections | `app_nodejs_active_connections_total` | Current open HTTP connections |

### How to See Data in Grafana

```bash
# 1. Ensure Docker Compose is running
docker compose up -d --build

# 2. Generate traffic to produce metrics
.\scripts\generate-traffic.ps1 -Rounds 5

# 3. Open Grafana
# http://localhost:3000   (login: admin / admin)
# Navigate to Dashboards → "Life Gamified — Application Dashboard"
```

### How Auto-Provisioning Works

Grafana automatically loads its datasource and dashboard on startup through volume mounts:

```yaml
# docker-compose.yml — grafana service
volumes:
  - ./monitoring/grafana-datasource.yml:/etc/grafana/provisioning/datasources/datasource.yml:ro
  - ./monitoring/grafana-dashboard-provider.yml:/etc/grafana/provisioning/dashboards/provider.yml:ro
  - ./monitoring/grafana-dashboard.json:/etc/grafana/provisioning/dashboards/dashboard.json:ro
```

- `grafana-datasource.yml` tells Grafana: "Connect to Prometheus at http://prometheus:9090"
- `grafana-dashboard-provider.yml` tells Grafana: "Look for JSON dashboards in /etc/grafana/provisioning/dashboards/"
- `grafana-dashboard.json` is the 14-panel dashboard — loaded automatically, no manual import needed

---

## 14. The Complete DevOps Lifecycle

This project demonstrates the full software delivery lifecycle:

```
       DEVELOP                    BUILD                     TEST
    ┌───────────┐           ┌───────────────┐        ┌──────────────┐
    │ Write code│           │ npm run build │        │ npm test     │
    │ TypeScript│──────────▶│ tsc compile   │───────▶│ vitest       │
    │ React     │           │ Vite bundle   │        │ 8 test cases │
    └───────────┘           └───────────────┘        └──────┬───────┘
                                                            │
         ┌──────────────────────────────────────────────────┘
         ▼
    CONTAINERIZE                  DEPLOY                    MONITOR
    ┌───────────────┐       ┌───────────────┐        ┌──────────────┐
    │ docker build  │       │ K8s / Compose │        │ Prometheus   │
    │ Multi-stage   │──────▶│ 2 replicas    │───────▶│ Grafana      │
    │ Backend+Front │       │ Health probes │        │ 14 panels    │
    └───────────────┘       └───────────────┘        └──────────────┘
         │
         ▼
    INFRASTRUCTURE              CI/CD                    SECURITY
    ┌───────────────┐       ┌───────────────┐        ┌──────────────┐
    │ Terraform     │       │ GitHub Actions│        │ Trivy scan   │
    │ Docker provider│      │ CI: test+build│        │ Non-root user│
    │ State managed │       │ CD: push+deploy│       │ .dockerignore│
    └───────────────┘       └───────────────┘        └──────────────┘
```

### End-to-End Flow: Code Change → Production

```
1. Developer writes code locally
   └─ npm run dev (Vite HMR for instant feedback)

2. Developer commits and pushes to GitHub
   └─ git push origin main

3. CI Pipeline triggers (ci.yml)
   ├─ Lint backend + frontend
   ├─ Run tests (8 passing)
   ├─ Build TypeScript
   ├─ Build Docker images
   └─ Trivy security scan

4. CD Pipeline triggers (cd.yml)
   ├─ Build backend image → push to ghcr.io
   ├─ Build frontend image → push to ghcr.io
   └─ (If DEPLOY_ENABLED) Update K8s manifests, kubectl apply

5. Kubernetes rolls out new version
   ├─ New pods start with updated images
   ├─ Readiness probes confirm new pods are healthy
   ├─ Old pods are terminated (rolling update, zero downtime)
   └─ Service routes traffic to new pods

6. Monitoring observes the deployment
   ├─ Prometheus scrapes new pods' /api/metrics
   ├─ Grafana shows request rates, latencies, error rates
   └─ If metrics degrade → alert (or manual rollback: kubectl rollout undo)
```

---

## 15. Commands Cheat Sheet

### Development
```bash
cd backend && npm run dev          # Start backend with hot reload (port 3001)
cd frontend && npm run dev         # Start frontend with HMR (port 5173)
cd backend && npm test             # Run test suite (vitest)
```

### Docker Compose
```bash
docker compose up -d --build       # Build and start all 4 services
docker compose ps                  # Show container status
docker compose logs backend        # View backend logs
docker compose down -v             # Stop and remove everything (including volumes)
```

### Kubernetes
```bash
kubectl get pods -n life-gamified                       # List all pods
kubectl get svc -n life-gamified                        # List all services
kubectl logs -l app=backend -n life-gamified            # View backend logs
kubectl port-forward svc/backend 3002:3001 -n life-gamified  # Access backend
kubectl rollout restart deploy/backend -n life-gamified  # Restart pods
kubectl delete namespace life-gamified                   # Tear down everything
```

### Terraform
```bash
cd infra/terraform
terraform init                     # Download providers
terraform plan                     # Preview changes
terraform apply -auto-approve      # Create resources
terraform destroy -auto-approve    # Remove resources
```

### Monitoring
```bash
# Open Grafana dashboard
start http://localhost:3000        # Login: admin / admin

# Generate traffic to populate dashboards
.\scripts\generate-traffic.ps1 -Rounds 5

# Check Prometheus targets
start http://localhost:9090/targets

# Query a metric directly in Prometheus
start "http://localhost:9090/graph?g0.expr=app_gems_balance"
```

---

## 16. Interview Q&A — Explaining This Project

### Q: Can you walk me through what happens when a user completes a task?

**A:** When the user clicks the checkbox, the `TaskItem` component calls `toggleTask(id)` from the Zustand `taskStore`. This triggers a `PATCH /api/tasks/:id` request through the API client. The Express backend looks up the task in SQLite, flips its `completed` flag, awards gems (10 for a main task, 2 for a subtask), updates the daily record, and checks if the daily goal is now met to update the streak. After the mutation, `refreshGauges()` re-syncs all Prometheus metrics. The response flows back to the frontend, where the store calls `fetchTasks()` to refresh the list. React re-renders the task with a strike-through style. Because `App.tsx` watches the tasks array, it also triggers `fetchStats()`, which cascades updates to the daily progress bar, gem counter, and streak display.

### Q: Why did you choose SQLite over PostgreSQL or MongoDB?

**A:** SQLite was the right choice for this project because it requires zero infrastructure — no database server to install or manage. The `better-sqlite3` driver provides a synchronous API that simplifies Express route handlers. The entire database is a single file, making it trivial to back up or migrate. WAL mode provides adequate concurrency for a single-user application. It also demonstrates real SQL skills (CREATE TABLE, foreign keys, JOINs, transactions) without cloud complexity. For a production multi-user app, I'd migrate to PostgreSQL.

### Q: How does your monitoring work?

**A:** The backend uses `prom-client` (the official Prometheus Node.js SDK) to expose metrics at `/api/metrics`. I define custom metrics — counters for HTTP requests and task completions, histograms for request duration, and gauges for active tasks, gems, and streak. An Express middleware instruments every request automatically. Prometheus scrapes this endpoint every 15 seconds and stores the time-series data. Grafana connects to Prometheus and runs PromQL queries to render 14 dashboard panels showing everything from request rates and latency percentiles to gem balances and Node.js heap usage. The entire monitoring stack is auto-provisioned — Grafana loads its datasource and dashboard from YAML/JSON files on startup.

### Q: Explain your CI/CD pipeline.

**A:** On every push or PR, the CI pipeline runs four parallel jobs: backend lint and test, frontend lint and build, Docker image builds, and a Trivy security scan. The Docker build only runs after lint and test pass. On push to `main`, the CD pipeline builds both images with the git SHA as a tag and pushes them to GitHub Container Registry. If `DEPLOY_ENABLED` is set, it configures kubectl, rewrites the K8s manifests to use the GHCR images, and applies them. The K8s deploy step uses `sed` to replace `imagePullPolicy: Never` with `Always` and substitute the local image names with GHCR URLs tagged with the commit SHA.

### Q: What's the difference between Docker Compose and Kubernetes in your project?

**A:** Docker Compose runs all four services (backend, frontend, Prometheus, Grafana) as containers on a single machine. It's great for local development and testing. Kubernetes adds orchestration — it runs 2 replicas of each service, automatically restarts crashed containers via liveness probes, prevents traffic from reaching unready pods via readiness probes, enforces CPU/memory limits, and enables rolling updates for zero-downtime deployments. The K8s manifests also demonstrate production-ready patterns like namespaces for isolation, PersistentVolumeClaims for data durability, and Ingress for path-based routing.

### Q: Why multi-stage Docker builds?

**A:** Multi-stage builds separate the build environment from the runtime environment. Stage 1 installs all dependencies (including devDependencies like TypeScript) and compiles the code. Stage 2 starts from a clean base image, installs only production dependencies, and copies the compiled output. This cuts the image size roughly in half and ensures no source code, dev tools, or secrets leak into the production image. The backend image is ~150MB instead of ~300MB.

### Q: How does Terraform fit into this project?

**A:** Terraform demonstrates infrastructure as code using the Docker provider. Instead of running `docker run` commands manually, I declare the desired state in `.tf` files: a network, two images, two containers, and a volume. `terraform plan` shows exactly what will change, `terraform apply` creates everything, and `terraform destroy` removes it cleanly. The state file tracks what Terraform manages. In a real production environment, the provider would be AWS/Azure/GCP instead of Docker, and the state would be stored in a remote backend for team collaboration.

### Q: How do you handle configuration differences between development and production?

**A:** In development, Vite proxies `/api/*` requests to `http://localhost:3001`. In production Docker, Nginx does the same proxy via `proxy_pass http://backend:3001`. The backend uses environment variables (`NODE_ENV`, `PORT`, `DB_PATH`) set differently in each environment. In Kubernetes, these are configured via `env` blocks in the deployment manifest. The database path is `/data/life-gamified.db` in Docker (mounted volume) and `./life-gamified.db` in development (local file). This pattern — same code, different config — follows the twelve-factor app methodology.

### Q: What security measures are in your pipeline?

**A:**
1. **Trivy scanning** — CI pipeline scans for HIGH/CRITICAL vulnerabilities in dependencies
2. **Non-root container** — Backend runs as `USER node`, not root
3. **`.dockerignore`** — Prevents `node_modules`, `.env`, `.db` files from leaking into images
4. **Health checks** — Both Docker Compose and K8s verify container health
5. **Resource limits** — K8s enforces CPU/memory caps to prevent resource exhaustion
6. **GHCR authentication** — CD pipeline uses `GITHUB_TOKEN` (not hardcoded credentials)
7. **Deploy guard** — K8s deploy only runs when explicitly enabled via `DEPLOY_ENABLED` variable

---

## License

MIT
