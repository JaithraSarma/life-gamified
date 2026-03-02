# 🚀 Life Gamified — Setup & Run Guide

> Step-by-step instructions to get the project running on your machine, from zero to execution.

---

## Prerequisites

Make sure you have the following installed before starting:

| Tool | Version | Check Command | Install Link |
|------|---------|---------------|--------------|
| **Node.js** | 18+ (LTS recommended) | `node --version` | [nodejs.org](https://nodejs.org/) |
| **npm** | 9+ (comes with Node) | `npm --version` | Included with Node.js |
| **Git** | 2.30+ | `git --version` | [git-scm.com](https://git-scm.com/) |
| **Docker** *(optional)* | 24+ | `docker --version` | [docker.com](https://www.docker.com/get-started/) |
| **Docker Compose** *(optional)* | 2.20+ | `docker compose version` | Included with Docker Desktop |

> **Note**: Docker is only needed if you want to run via containers. The app runs perfectly with just Node.js.

---

## Option A: Run with Node.js (Recommended for Development)

### Step 1 — Clone the Repository

```bash
git clone https://github.com/JaithraSarma/life-gamified.git
cd life-gamified
```

### Step 2 — Install Backend Dependencies

```bash
cd backend
npm install
```

This installs Express, TypeScript, SQLite, and all backend dependencies.

### Step 3 — Start the Backend Server

```bash
npm run dev
```

You should see:
```
Life Gamified API running on http://localhost:3001
```

Verify it's working by visiting [http://localhost:3001/api/health](http://localhost:3001/api/health) — you should see:
```json
{ "status": "ok", "timestamp": "..." }
```

> **Keep this terminal open.** The backend needs to stay running.

### Step 4 — Install Frontend Dependencies

Open a **new terminal window/tab**, then:

```bash
cd frontend
npm install
```

This installs React, Vite, Tailwind CSS, Zustand, and all frontend dependencies.

### Step 5 — Start the Frontend Dev Server

```bash
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

### Step 6 — Open the App

Open your browser and navigate to:

**[http://localhost:5173](http://localhost:5173)**

You should see the Life Gamified dashboard with:
- A warm-colored header showing streak (🔥 0) and gems (💎 0)
- A daily progress bar
- A countdown timer
- An "Add Task" button

### Step 7 — Try It Out

1. Click **"+ Add Task"** to create your first task
2. Check the box to complete it — watch your gems go from 0 to 10
3. Create a subtask on any task (click "Add sub-task")
4. Visit the **Power-Up Shop** (🛡️ icon) once you have 50 gems
5. Check the **Settings** (⚙️ icon) to adjust your daily goal

---

## Option B: Run with Docker Compose (Recommended for Production-like Setup)

### Step 1 — Clone the Repository

```bash
git clone https://github.com/JaithraSarma/life-gamified.git
cd life-gamified
```

### Step 2 — Build and Start All Services

```bash
docker compose up --build
```

This will:
1. Build the backend Docker image (multi-stage: TypeScript compilation → slim runtime)
2. Build the frontend Docker image (multi-stage: Vite build → nginx serving)
3. Start both services with health checks
4. Create a persistent volume for the SQLite database

### Step 3 — Access the App

- **Frontend**: [http://localhost:8080](http://localhost:8080)
- **Backend API**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

### Step 4 — Stop the Services

```bash
docker compose down
```

To also remove the database volume:
```bash
docker compose down -v
```

---

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

Expected output:
```
 ✓ tests/app.test.ts (8 tests) ...
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

### What the Tests Cover

| Test | Description |
|------|-------------|
| Health endpoint | `/api/health` returns 200 with status "ok" |
| Task creation requires title | POST without title returns 400 |
| Gem award (main) | Completing a main task awards 10 gems |
| Gem award (sub) | Completing a sub-task awards 2 gems |
| Streak freeze cost | Buying a freeze deducts 50 gems |
| Cannot buy freeze without gems | Attempt to buy with < 50 gems returns 400 |
| Daily goal tracking | Completing tasks updates daily records |
| Task deletion | Deleting a task removes it and its subtasks |

---

## Build for Production

### Backend

```bash
cd backend
npm run build
```

This compiles TypeScript → JavaScript into the `dist/` folder.

To run the compiled production build:
```bash
NODE_ENV=production node dist/index.js
```

### Frontend

```bash
cd frontend
npm run build
```

This creates an optimized static build in the `dist/` folder using Vite.

To preview the production build locally:
```bash
npm run preview
```

---

## Project Structure

```
life-gamified/
├── backend/                  # Express.js API server
│   ├── src/
│   │   ├── index.ts          # Server entry point
│   │   ├── database.ts       # SQLite schema & queries
│   │   ├── types.ts          # TypeScript interfaces
│   │   └── routes/           # API route handlers
│   ├── tests/                # Unit tests (vitest)
│   ├── Dockerfile            # Multi-stage Docker build
│   └── package.json
│
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── App.tsx           # Root component
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── api/client.ts     # HTTP API client
│   │   ├── stores/           # Zustand state management
│   │   └── components/       # UI components
│   ├── Dockerfile            # Multi-stage Docker build
│   └── package.json
│
├── k8s/                      # Kubernetes manifests
├── infra/terraform/          # Terraform IaC configs
├── monitoring/               # Prometheus & Grafana configs
├── .github/workflows/        # CI/CD pipelines
├── docs/                     # Documentation
│   ├── PROJECT_DEEP_DIVE.md  # Comprehensive learning guide
│   └── SETUP.md              # This file
├── docker-compose.yml        # Multi-container orchestration
├── Makefile                  # Convenience commands
└── README.md                 # Project overview
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `DB_PATH` | `./life-gamified.db` | Path to SQLite database file |
| `NODE_ENV` | `development` | Environment (development / production) |
| `VITE_API_URL` | `http://localhost:3001` | Backend URL for frontend API calls |

---

## Common Issues & Fixes

### "npm install" fails with native module errors
**Cause**: `better-sqlite3` requires native compilation.
**Fix**: Install build tools:
- **Windows**: `npm install -g windows-build-tools`
- **macOS**: `xcode-select --install`
- **Linux**: `sudo apt-get install build-essential python3`

### "Port 3001 already in use"
**Fix**: Kill the existing process:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3001
kill -9 <PID>
```

### Frontend can't connect to backend
**Cause**: Backend isn't running, or Vite proxy isn't configured.
**Fix**: Make sure the backend is running on port 3001 first. The Vite dev server proxies `/api` requests to the backend automatically.

### PowerShell scripts won't run (Windows)
**Fix**: Set execution policy:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

### Docker build fails on ARM Mac (M1/M2/M3)
**Fix**: Use `--platform linux/amd64` flag:
```bash
docker compose build --build-arg BUILDPLATFORM=linux/amd64
```

---

## Useful Commands (Makefile)

If you have `make` installed:

```bash
make install     # Install all dependencies
make dev         # Start both servers in dev mode
make test        # Run all tests
make build       # Build for production
make docker-up   # Docker compose up
make docker-down # Docker compose down
make clean       # Remove node_modules and build artifacts
```

---

*That's it! You should now have Life Gamified running locally. Happy task-gaming! 🎮*
