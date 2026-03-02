# 🎮 Life Gamified

**Turn your daily tasks into a game.** A Duolingo-inspired productivity app with streaks, gems, power-ups, and a full DevOps pipeline — built to ship, scale, and monitor.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/K8s-Manifests-326CE5?logo=kubernetes&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## What Is This?

Life Gamified applies Duolingo's proven gamification mechanics to a to-do app. Complete tasks to earn gems, maintain daily streaks, and spend gems on power-ups like streak freezes — all wrapped in a warm, inviting UI.

### Features

| Feature | Detail |
|---------|--------|
| 📝 **Tasks & Sub-Tasks** | Hierarchical task management — break big tasks into smaller ones |
| 🔥 **Streak System** | Daily streaks tracked by configurable task goals |
| 💎 **Gem Rewards** | 10 gems per main task, 2 gems per sub-task |
| 🛡️ **Streak Freeze** | Power-up (50 gems) to protect your streak for a missed day |
| ⏱️ **Countdown Timer** | Live timer showing time remaining before streak deadline |
| 🔔 **Notifications** | Browser alerts 30 min before the deadline if goal isn't met |
| ⚙️ **Customizable** | Set daily task goals, streak deadlines, and notification preferences |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript + Vite | Fast, type-safe UI with HMR |
| Styling | Tailwind CSS | Warm color palette, utility-first |
| State | Zustand | Lightweight global state management |
| Backend | Express.js + TypeScript | RESTful API server |
| Database | SQLite (better-sqlite3) | Embedded, zero-config persistence |
| Containers | Docker + Docker Compose | Reproducible builds and environments |
| CI/CD | GitHub Actions | Automated test, build, deploy pipeline |
| Orchestration | Kubernetes | Production container management |
| IaC | Terraform | Infrastructure defined in code |
| Monitoring | Prometheus + Grafana | Metrics collection and visualization |

---

## Quick Start

### Prerequisites

- **Node.js 18+** and **npm 9+** ([install](https://nodejs.org/))
- **Docker** (optional, for containerized setup)

### Local Development

```bash
# Clone
git clone https://github.com/JaithraSarma/life-gamified.git
cd life-gamified

# Backend (terminal 1)
cd backend
npm install
npm run dev        # → http://localhost:3001

# Frontend (terminal 2)
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

### Docker Compose

```bash
docker compose up --build
# Frontend → http://localhost:8080
# Backend  → http://localhost:3001
```

### Run Tests

```bash
cd backend && npm test    # 8 unit tests (vitest)
```

---

## Project Structure

```
life-gamified/
├── backend/              # Express API server (TypeScript)
│   ├── src/              # Source code (routes, database, types)
│   ├── tests/            # Unit tests (vitest)
│   └── Dockerfile        # Multi-stage production build
├── frontend/             # React SPA (TypeScript + Vite)
│   ├── src/              # Components, stores, API client
│   └── Dockerfile        # Multi-stage build → nginx
├── k8s/                  # Kubernetes manifests
├── infra/terraform/      # Terraform IaC configs
├── monitoring/           # Prometheus + Grafana configs
├── .github/workflows/    # CI/CD pipelines
├── docs/                 # Documentation
│   ├── PROJECT_DEEP_DIVE.md  # Full learning guide
│   └── SETUP.md              # Detailed setup instructions
├── docker-compose.yml    # Multi-container orchestration
└── Makefile              # Convenience commands
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List all tasks with sub-tasks |
| `POST` | `/api/tasks` | Create a task (`{ title, parent_id? }`) |
| `PATCH` | `/api/tasks/:id` | Toggle task completion |
| `DELETE` | `/api/tasks/:id` | Delete a task + its sub-tasks |
| `GET` | `/api/stats` | Get gems, streak, daily progress |
| `GET` | `/api/settings` | Get user settings |
| `PATCH` | `/api/settings` | Update settings |
| `GET` | `/api/powerups` | List power-ups + inventory |
| `POST` | `/api/powerups/freeze/buy` | Buy streak freeze (50 gems) |
| `POST` | `/api/powerups/freeze/use` | Activate a streak freeze |
| `GET` | `/api/health` | Health check |

---

## DevOps Pipeline

This project implements a complete end-to-end DevOps lifecycle:

```
Code → CI (Lint/Test/Build/Scan) → Docker → CD → Kubernetes → Monitor
```

| Stage | Tool | Config |
|-------|------|--------|
| Source Control | Git + GitHub | — |
| CI | GitHub Actions | `.github/workflows/ci.yml` |
| CD | GitHub Actions | `.github/workflows/cd.yml` |
| Containerization | Docker | `backend/Dockerfile`, `frontend/Dockerfile` |
| Orchestration | Kubernetes | `k8s/*.yaml` |
| IaC | Terraform | `infra/terraform/*.tf` |
| Monitoring | Prometheus + Grafana | `monitoring/` |

---

## Documentation

| Document | Description |
|----------|-------------|
| [**Project Deep Dive**](docs/PROJECT_DEEP_DIVE.md) | Comprehensive guide covering architecture, tech decisions, DevOps concepts, and presentation talking points |
| [**Setup Guide**](docs/SETUP.md) | Step-by-step instructions from cloning to running, including Docker, testing, and troubleshooting |

---

## License

MIT

MIT
