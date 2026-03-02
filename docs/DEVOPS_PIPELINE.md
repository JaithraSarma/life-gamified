# 🔧 Life Gamified — DevOps Pipeline Guide

> Everything about the DevOps infrastructure in this project, explained for interviews, presentations, and hands-on practice.

---

## Table of Contents

1. [Pipeline Overview](#1-pipeline-overview)
2. [How to Run the Full Pipeline](#2-how-to-run-the-full-pipeline)
3. [Stage 1: Source Control (Git + GitHub)](#3-stage-1-source-control)
4. [Stage 2: Continuous Integration (GitHub Actions)](#4-stage-2-continuous-integration)
5. [Stage 3: Containerization (Docker)](#5-stage-3-containerization)
6. [Stage 4: Continuous Deployment (GitHub Actions)](#6-stage-4-continuous-deployment)
7. [Stage 5: Infrastructure as Code (Terraform)](#7-stage-5-infrastructure-as-code)
8. [Stage 6: Container Orchestration (Kubernetes)](#8-stage-6-container-orchestration)
9. [Stage 7: Monitoring & Observability (Prometheus + Grafana)](#9-stage-7-monitoring--observability)
10. [How Everything Connects (End-to-End Flow)](#10-how-everything-connects)
11. [Interview Questions & Answers](#11-interview-questions--answers)
12. [Commands Cheat Sheet](#12-commands-cheat-sheet)
13. [Architecture Decisions & Trade-offs](#13-architecture-decisions--trade-offs)

---

## 1. Pipeline Overview

```
┌─────────┐   ┌──────────────────────────────────────┐   ┌─────────────────┐   ┌─────────────┐
│  Code   │──▶│         CI (GitHub Actions)           │──▶│       CD        │──▶│  Monitoring  │
│ (Git)   │   │  Lint → Test → Build → Security Scan  │   │ Docker → K8s    │   │ Prometheus   │
│         │   │  Docker Build (validate images)        │   │ or Terraform    │   │ + Grafana    │
└─────────┘   └──────────────────────────────────────┘   └─────────────────┘   └─────────────┘
     │                        │                                   │                     │
     │                  On every push                    On merge to main          Always running
     │                  & pull request                                                  │
     └────────────────────────────────────────────────────────────────────────────────────┘
                                    Feedback Loop
```

### What I Built

| Stage | Tool | What It Does | Config File |
|-------|------|-------------|-------------|
| Source Control | Git + GitHub | Version control, branching, code review via PRs | — |
| CI | GitHub Actions | Automated lint, test, build, security scan on every push | `.github/workflows/ci.yml` |
| Containerization | Docker | Multi-stage builds packaging the app into portable images | `backend/Dockerfile`, `frontend/Dockerfile` |
| Image Registry | GitHub Container Registry (GHCR) | Stores built Docker images for deployment | `.github/workflows/cd.yml` |
| CD | GitHub Actions | Auto-builds and pushes images to GHCR on main merge | `.github/workflows/cd.yml` |
| IaC | Terraform | Defines Docker infrastructure as code (declarative) | `infra/terraform/*.tf` |
| Orchestration | Kubernetes | Runs containers with replicas, health checks, auto-restart | `k8s/*.yaml` |
| Multi-container | Docker Compose | Runs entire stack locally (app + monitoring) | `docker-compose.yml` |
| Monitoring | Prometheus | Scrapes health metrics from the backend every 15 seconds | `monitoring/prometheus.yml` |
| Visualization | Grafana | Dashboards showing uptime, response times, scrape stats | `monitoring/grafana-dashboard.json` |

---

## 2. How to Run the Full Pipeline

### Prerequisites

| Tool | Install |
|------|---------|
| Docker Desktop | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Kubernetes | Docker Desktop → Settings → Kubernetes → Enable |
| Terraform | [terraform.io](https://developer.hashicorp.com/terraform/install) |
| Node.js 18+ | [nodejs.org](https://nodejs.org/) |
| kubectl | Included with Docker Desktop K8s |

### Option A: Full Pipeline in One Command

```powershell
# From the project root
# 1. Run tests → 2. Build Docker images → 3. Deploy to K8s
make pipeline
```

### Option B: Step by Step

```powershell
# Step 1: Run tests
cd backend && npm test && cd ..

# Step 2: Build Docker images
docker build -t life-gamified-backend:latest ./backend
docker build -t life-gamified-frontend:latest ./frontend

# Step 3: Deploy to local Kubernetes
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Step 4: Check status
kubectl get all -n life-gamified

# Step 5: Access the app
kubectl port-forward svc/frontend 8080:80 -n life-gamified
kubectl port-forward svc/backend 3001:3001 -n life-gamified
# Open http://localhost:8080

# Step 6: Start monitoring
docker compose up -d prometheus grafana
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3000 (admin/admin)
```

### Option C: Docker Compose (Everything at Once)

```powershell
docker compose up --build -d
# App:        http://localhost:5173
# Backend:    http://localhost:3001
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3000
```

### Option D: Terraform

```powershell
cd infra/terraform
terraform init
terraform plan      # Preview what will be created
terraform apply     # Create containers
terraform destroy   # Tear down everything
```

---

## 3. Stage 1: Source Control

### What I Did

- Initialized a Git repository with a structured branching model
- Made **incremental, meaningful commits** (not one giant commit):
  - `chore: initial project setup` — root configs
  - `feat: add Express backend` — API server  
  - `feat: add React frontend` — UI  
  - `ci: add GitHub Actions` — pipelines
  - `infra: add K8s and Terraform` — infrastructure
  - `ops: add monitoring` — Prometheus/Grafana
  - `docs: add documentation` — READMEs
- Pushed to GitHub with a descriptive repository description

### Why It Matters

- Every change is traceable (who changed what, when, why)
- Enables code review through Pull Requests
- Rolled-back deployments can point to specific commits
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) format (`feat:`, `chore:`, `ci:`, `infra:`, `ops:`, `docs:`)

### Interview Talking Point

> "I structured the repository with conventional commits so that the Git history tells the story of the project. Each commit corresponds to a logical unit of change — you can see the backend was built first, then the frontend, then the DevOps layers were added on top."

---

## 4. Stage 2: Continuous Integration

### File: `.github/workflows/ci.yml`

### What Happens on Every Push

```
Push to GitHub (any branch)
      │
      ├──▶ [Job 1] Backend Lint & Test
      │     ├── Checkout code
      │     ├── Setup Node.js 20 (with npm cache)
      │     ├── npm ci (clean install from lockfile)
      │     ├── Lint (ESLint)
      │     ├── Run tests (vitest — 8 unit tests)
      │     └── Build (TypeScript compilation)
      │
      ├──▶ [Job 2] Frontend Lint & Build
      │     ├── Checkout code
      │     ├── Setup Node.js 20 (with npm cache)
      │     ├── npm ci
      │     ├── Lint
      │     └── Build (Vite production build)
      │
      ├──▶ [Job 3] Docker Build  ← (runs AFTER Jobs 1 & 2 pass)
      │     ├── Build backend Docker image
      │     └── Build frontend Docker image
      │
      └──▶ [Job 4] Security Scan  (runs in parallel)
            ├── Trivy scan on backend (HIGH + CRITICAL vulns)
            └── Trivy scan on frontend (HIGH + CRITICAL vulns)
```

### Key Design Decisions

| Decision | Why |
|----------|-----|
| **Parallel jobs** | Backend/frontend CI run simultaneously → faster pipeline (~2 min vs ~4 min) |
| **npm ci** (not npm install) | Installs exact lockfile versions → deterministic, reproducible builds |
| **Docker build in CI** | Catches Dockerfile issues before they hit deployment |
| **Trivy security scan** | Detects known CVEs in dependencies before they reach production |
| **lint `\|\| true`** | Lint is advisory (doesn't block) during development, but logs issues |

### What the Tests Validate

```
✓ Health check endpoint returns 200
✓ Task creation rejects empty titles (validation)
✓ Task creation accepts valid titles
✓ Completing main task awards 10 gems
✓ Completing sub-task awards 2 gems
✓ Gems cannot go below zero
✓ Streak freeze costs 50 gems
✓ Cannot buy freeze without enough gems
```

### Interview Talking Point

> "The CI pipeline runs four parallel jobs on every push. Backend and frontend lint/test simultaneously for speed. After they pass, Docker images are built to validate the Dockerfiles. Trivy runs a security scan independently. This means by the time code reaches `main`, it's been tested, built, and scanned — all automatically."

---

## 5. Stage 3: Containerization

### Multi-Stage Docker Builds

I use **multi-stage builds** to keep production images small and secure:

```dockerfile
# Stage 1: Build (heavy — has devDependencies, TypeScript compiler, source code)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build          # TypeScript → JavaScript

# Stage 2: Runtime (lean — only production deps + compiled JS)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev      # No devDependencies
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

### Why Multi-Stage?

| Metric | Single Stage | Multi-Stage |
|--------|-------------|-------------|
| Image size | ~800MB | ~150MB |
| Attack surface | Large (compiler, dev tools) | Small (runtime only) |
| Build cache | Poor | Excellent (layers are cached) |

### Docker Compose Architecture

```
docker-compose.yml
├── backend (Express API)     → port 3001
├── frontend (nginx + React)  → port 5173
├── prometheus (metrics)      → port 9090
├── grafana (dashboards)      → port 3000
├── Volume: db-data (SQLite persistence)
└── Volume: grafana-data (dashboard persistence)
```

### Interview Talking Point

> "I used multi-stage Docker builds to separate the build environment from the runtime. The first stage compiles TypeScript with all dev dependencies, the second stage copies only the compiled output with production dependencies. This reduces the image from ~800MB to ~150MB and minimizes the attack surface — there's no compiler or dev tooling in the production image."

---

## 6. Stage 4: Continuous Deployment

### File: `.github/workflows/cd.yml`

### What Happens When Code Merges to `main`

```
Merge to main
      │
      └──▶ [Job 1] Build & Push Images
            ├── Login to GitHub Container Registry (GHCR)
            ├── Extract metadata (git SHA, tags, labels)
            ├── Build backend image with Docker Buildx
            ├── Push backend → ghcr.io/jaithrasarma/life-gamified/backend:latest
            ├── Build frontend image
            └── Push frontend → ghcr.io/jaithrasarma/life-gamified/frontend:latest
                    │
                    └──▶ [Job 2] Deploy to Kubernetes (when DEPLOY_ENABLED=true)
                          ├── Set up kubectl
                          ├── Configure kubeconfig from secret
                          ├── Substitute image tags with git SHA
                          └── kubectl apply all manifests
```

### Image Tagging Strategy

Each image gets multiple tags:

| Tag | Example | Purpose |
|-----|---------|---------|
| `latest` | `backend:latest` | Always points to most recent main build |
| Git SHA | `backend:a1b2c3d` | Exact commit that produced this image |
| Version tag | `backend:v1.0.0` | Semantic version (when a Git tag is pushed) |

### Why GHCR?

- **Free** for public repos
- **Integrated** with GitHub (same auth, same UI)
- **No external accounts** needed (unlike Docker Hub or AWS ECR)

### K8s Deploy Guard

The deploy job has a guard: `if: vars.DEPLOY_ENABLED == 'true'`. This prevents accidental deployments when no cluster is configured. For local development, we deploy directly with `kubectl`.

### Interview Talking Point

> "The CD pipeline automatically builds and pushes Docker images to GitHub Container Registry on every merge to main. Each image is tagged with both `latest` and the exact git SHA, so we can always trace a running container back to the exact commit that produced it. The K8s deploy step is gated behind a repository variable — it only runs when a real cluster is configured."

---

## 7. Stage 5: Infrastructure as Code

### Files: `infra/terraform/main.tf`, `variables.tf`, `outputs.tf`

### What Terraform Manages

```hcl
Terraform Resources:
├── docker_network.app_network    # Isolated network for containers
├── docker_image.backend          # Built from backend/Dockerfile
├── docker_image.frontend         # Built from frontend/Dockerfile
├── docker_container.backend      # Running backend with env vars, health check, volume
├── docker_container.frontend     # Running frontend, depends_on backend
└── docker_volume.db_data         # Persistent storage for SQLite
```

### The Terraform Workflow

```
terraform init       # Download providers (Docker provider)
       │
terraform plan       # Preview: "I will create 6 resources"
       │              Shows exactly what changes will happen
       │              Does NOT actually create anything
       │
terraform apply      # Actually create/modify resources
       │              Stores state in terraform.tfstate
       │
terraform destroy    # Tear down everything cleanly
```

### Key Concepts Demonstrated

| Concept | How I Used It |
|---------|---------------|
| **Declarative IaC** | I describe WHAT I want (a container with these ports, env vars, health check) — Terraform figures out HOW |
| **State management** | `terraform.tfstate` tracks what exists vs. what's desired |
| **Variables** | `variables.tf` parameterizes ports, environment, Docker host |
| **Outputs** | `outputs.tf` prints the URLs after deployment |
| **Provider ecosystem** | Using `kreuzwerker/docker` provider (but could swap to `aws`, `azurerm`, etc.) |
| **Dependency management** | Frontend `depends_on` backend — Terraform builds in the right order |
| **Validation** | Environment variable restricted to `dev`, `staging`, `production` |

### Interview Talking Point

> "Terraform manages the Docker infrastructure declaratively — I define the desired state (containers, networks, volumes) in `.tf` files, and Terraform creates, updates, or destroys resources to match. The state file tracks what currently exists. Variables make the configs reusable across dev/staging/production. While I'm using the Docker provider locally, the same pattern applies to any cloud provider — swapping `kreuzwerker/docker` for `hashicorp/aws` or `hashicorp/azurerm` is just a provider change."

---

## 8. Stage 6: Container Orchestration

### Files: `k8s/namespace.yaml`, `backend-deployment.yaml`, `frontend-deployment.yaml`, `ingress.yaml`

### What Kubernetes Provides

```
Kubernetes Cluster (Docker Desktop)
│
├── Namespace: life-gamified
│   │
│   ├── Deployment: backend (2 replicas)
│   │   ├── Pod: backend-abc123     ← Container running Express API
│   │   └── Pod: backend-def456     ← Container running Express API
│   │
│   ├── Deployment: frontend (2 replicas)
│   │   ├── Pod: frontend-ghi789    ← Container running nginx + React
│   │   └── Pod: frontend-jkl012    ← Container running nginx + React
│   │
│   ├── Service: backend (ClusterIP → port 3001)
│   ├── Service: frontend (ClusterIP → port 80)
│   │
│   ├── PersistentVolumeClaim: backend-pvc (1Gi for SQLite)
│   │
│   └── Ingress: life-gamified-ingress
│       ├── /api/* → backend:3001
│       └── /*     → frontend:80
│
└── Ingress Controller (nginx) — Routes external traffic
```

### K8s Features I Configured

| Feature | Config | What It Does |
|---------|--------|-------------|
| **Replicas** | `replicas: 2` | Two copies of each service for availability |
| **Liveness Probe** | `httpGet: /api/health` | K8s restarts the container if health check fails |
| **Readiness Probe** | `httpGet: /api/health` | K8s stops sending traffic to pods that aren't ready |
| **Resource Limits** | `cpu: 500m, memory: 256Mi` | Prevents containers from consuming all cluster resources |
| **Resource Requests** | `cpu: 100m, memory: 128Mi` | Minimum guaranteed resources for scheduling |
| **PVC** | `1Gi ReadWriteOnce` | SQLite database persists across pod restarts |
| **Namespace** | `life-gamified` | Logical isolation from other workloads |
| **Ingress** | Path-based routing | `/api` → backend, everything else → frontend |
| **Prometheus Annotations** | `prometheus.io/scrape: "true"` | Auto-discovery for Prometheus monitoring |

### Self-Healing in Action

```
What happens when a pod crashes:

1. Liveness probe fails → GET /api/health returns non-200
2. K8s marks the pod as unhealthy
3. K8s kills the unhealthy pod
4. K8s creates a new pod automatically (Deployment controller)
5. Readiness probe passes → K8s starts routing traffic to the new pod
6. Total downtime: ~10-15 seconds (and the other replica was handling traffic)

This is why we have 2 replicas — zero downtime during single-pod failures.
```

### Local K8s Deployment Commands

```powershell
# Deploy
.\scripts\deploy-local-k8s.ps1

# Or manually
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
kubectl get all -n life-gamified

# Access
kubectl port-forward svc/frontend 8080:80 -n life-gamified
kubectl port-forward svc/backend 3001:3001 -n life-gamified

# Teardown
.\scripts\teardown-k8s.ps1
```

### Interview Talking Point

> "Kubernetes manages the containers in production. I configured Deployments with 2 replicas each for high availability. Health checks (liveness + readiness probes) enable self-healing — if a container crashes, K8s automatically restarts it and stops routing traffic to it until it's ready. Resource limits prevent noisy-neighbor problems. The Ingress routes `/api` requests to the backend and everything else to the frontend, acting as a reverse proxy. PersistentVolumeClaims ensure the SQLite database survives pod restarts."

---

## 9. Stage 7: Monitoring & Observability

### Stack: Prometheus + Grafana

```
┌─────────────────────┐         ┌─────────────────────┐
│ Prometheus :9090     │────────▶│ Grafana :3000        │
│ Scrapes every 15s    │  query  │ Dashboards + Alerts  │
│ Stores time-series   │         │ Visualizations       │
└──────────┬──────────┘         └─────────────────────┘
           │
           │ HTTP GET /api/health
           ▼
┌─────────────────────┐
│ Backend :3001        │
│ Returns health data  │
└─────────────────────┘
```

### How Prometheus Works

1. **Scrape config** (`monitoring/prometheus.yml`) tells Prometheus WHERE to collect metrics
2. Every 15 seconds, Prometheus sends `GET /api/health` to the backend
3. It records: response code, latency, whether the target is up/down
4. This data is stored as **time-series** (value + timestamp)
5. You query it with **PromQL** (Prometheus Query Language)

### Key Metrics Available

| Metric | PromQL | What It Shows |
|--------|--------|--------------|
| Backend up/down | `up{job="life-gamified-backend"}` | Is the service reachable? (1=up, 0=down) |
| Response time | `scrape_duration_seconds{job="life-gamified-backend"}` | How long the health check takes |
| Samples scraped | `scrape_samples_scraped{job="..."}` | Number of metric data points per scrape |

### Grafana Dashboard

Pre-configured dashboard (`monitoring/grafana-dashboard.json`) with:

| Panel | Type | Shows |
|-------|------|-------|
| Backend Health | Stat | UP ✅ or DOWN ❌ |
| Response Time | Time Series | Health endpoint latency over time |
| Scrape Samples | Time Series | Metrics volume over time |

### How to Access

```powershell
# Start monitoring stack
docker compose up -d prometheus grafana

# Prometheus UI (raw metrics + query engine)
# http://localhost:9090
# Try: up{job="life-gamified-backend"} in the expression browser

# Grafana UI (dashboards)
# http://localhost:3000
# Login: admin / admin
# Dashboard: "Life Gamified — Application Dashboard"
```

### Interview Talking Point

> "I set up Prometheus for metrics collection and Grafana for visualization. Prometheus scrapes the backend's health endpoint every 15 seconds and stores the data as time-series metrics. The Grafana dashboard provides real-time visibility into backend uptime, response latency, and scrape health. The monitoring stack is defined in `docker-compose.yml` and provisioned automatically — Grafana boots with the datasource and dashboard pre-configured, no manual setup needed."

---

## 10. How Everything Connects

### The Full Flow (Developer Pushes Code)

```
Developer makes a change
         │
         ▼
    git push origin main
         │
         ├──────────────────────────────────────────────────────┐
         ▼                                                      ▼
  CI Pipeline (ci.yml)                                CD Pipeline (cd.yml)
  ┌────────────────────┐                              ┌────────────────────┐
  │ 1. Lint backend    │                              │ 1. Login to GHCR   │
  │ 2. Test backend    │                              │ 2. Build backend   │
  │ 3. Build backend   │                              │    image           │
  │ 4. Lint frontend   │                              │ 3. Push to GHCR    │
  │ 5. Build frontend  │                              │ 4. Build frontend  │
  │ 6. Docker build    │                              │    image           │
  │ 7. Security scan   │                              │ 5. Push to GHCR    │
  └────────────────────┘                              │ 6. Deploy to K8s   │
         │                                            │    (if enabled)    │
      Pass/Fail                                       └────────────────────┘
         │                                                     │
    Green ✅ → Safe to deploy                                   ▼
    Red ❌ → Fix before deploying                        K8s pulls new images
                                                        Rolls out gradually
                                                               │
                                                               ▼
                                                     Prometheus detects new pods
                                                     Starts scraping health
                                                               │
                                                               ▼
                                                     Grafana shows metrics
                                                     Alert if something breaks
```

### Local Development Cycle

```
Code change → npm test → docker build → kubectl apply → kubectl get pods → port-forward → test in browser
     │            │            │              │                │                │              │
     │        Unit tests   Package into    Deploy to      Verify pods       Expose           Done!
     │        pass?        containers      local K8s      are running       to localhost
     │
     └── Also: Terraform can replace the docker build + kubectl steps
         cd infra/terraform && terraform apply
```

---

## 11. Interview Questions & Answers

### CI/CD

**Q: Walk me through your CI/CD pipeline.**
> "On every push, GitHub Actions runs four jobs in parallel: backend lint/test, frontend lint/build, Docker image builds, and Trivy security scanning. When code merges to main, a separate CD workflow builds production Docker images, tags them with the git SHA, and pushes them to GitHub Container Registry. The K8s deploy step then applies updated manifests to roll out the new version."

**Q: Why did you choose GitHub Actions over Jenkins/GitLab CI?**
> "Three reasons: it's native to GitHub (no separate server to maintain), it's free for public repos, and the YAML workflow syntax is straightforward. For a team project, Jenkins would give more flexibility with plugins, but for this scope GitHub Actions is the right fit."

**Q: How do you ensure the images you deploy are the same ones you tested?**
> "The CI pipeline builds and validates the Docker images. The CD pipeline builds again and tags with the git SHA — the same commit hash that passed CI. In a production setup, I'd add image signing with Cosign to cryptographically verify image provenance."

### Docker

**Q: Explain your Dockerfile strategy.**
> "I use multi-stage builds. Stage 1 is the build environment — it has all dev dependencies and the TypeScript compiler. It compiles the source code. Stage 2 is the runtime — it copies only the compiled output and production dependencies. This reduces image size by ~80% and removes build tools from the production image, reducing the attack surface."

**Q: Why use Docker Compose alongside Kubernetes?**
> "They serve different purposes. Docker Compose is for local development — one command starts everything. Kubernetes is for production — it provides scaling, self-healing, rolling updates, and resource management. In practice, developers use Compose locally and deploy to K8s in staging/production."

### Kubernetes

**Q: What happens when a pod crashes in your setup?**
> "The liveness probe detects the failure within 30 seconds. K8s terminates the unhealthy pod and the Deployment controller creates a replacement. Because I have 2 replicas, the other pod continues serving traffic. The readiness probe gates traffic to the new pod until it's healthy. Total impact: zero downtime for users."

**Q: Explain the difference between a Deployment, a Service, and an Ingress.**
> "A Deployment manages the lifecycle of pods — how many replicas, what image, restart policy. A Service provides a stable network endpoint for those pods — even as pods come and go, the Service IP stays the same. An Ingress is the external entry point — it routes incoming HTTP traffic to the right Service based on URL path or hostname."

**Q: Why did you use PersistentVolumeClaims?**
> "SQLite stores data in a file. Without a PVC, the data lives inside the container's filesystem and is lost when the pod restarts. The PVC creates storage that persists independently of the pod lifecycle. When a pod restarts, it remounts the same volume and the database is still there."

### Terraform

**Q: Why use Terraform when you already have Docker Compose and Kubernetes?**
> "Terraform demonstrates the IaC principle — infrastructure defined in code, version-controlled, and reproducible. Docker Compose is a convenience tool; Terraform is an infrastructure management tool. In a real scenario, Terraform would provision the K8s cluster itself (EKS, AKS, GKE), networking, databases, and IAM — things that Docker Compose can't manage. I used the Docker provider to demonstrate the Terraform workflow on a local machine."

**Q: What is Terraform state and why does it matter?**
> "The state file (`terraform.tfstate`) is Terraform's record of what it has created. It maps the `.tf` definitions to real-world resources. When you run `terraform plan`, it compares the desired state (your code) against the current state (the state file) and shows you exactly what will change. Without state, Terraform would have to query every possible resource to figure out what exists."

### Monitoring

**Q: How do you know if your application is healthy in production?**
> "Prometheus scrapes the backend's `/api/health` endpoint every 15 seconds. If the endpoint stops responding or returns errors, the `up` metric drops to 0. Grafana displays this in real-time on a dashboard. In a production setup, I'd add alerting rules — Prometheus can trigger alerts to Slack or PagerDuty when health checks fail or response times spike."

**Q: What's the difference between monitoring and observability?**
> "Monitoring tells you WHEN something is wrong (alerts, dashboard turns red). Observability tells you WHY — through three pillars: metrics (Prometheus), logs (e.g., ELK stack), and traces (e.g., Jaeger). This project implements the metrics pillar. For full observability, I'd add structured logging and distributed tracing."

---

## 12. Commands Cheat Sheet

### Daily Development
```powershell
cd backend && npm run dev     # Start backend dev server
cd frontend && npm run dev    # Start frontend dev server
cd backend && npm test        # Run unit tests
```

### Docker
```powershell
docker compose up --build -d              # Build + start all services
docker compose up -d prometheus grafana   # Start monitoring only
docker compose logs -f backend            # Stream backend logs
docker compose down -v                    # Tear down + remove volumes
docker images | findstr life-gamified     # List project images
```

### Kubernetes
```powershell
# Deploy
.\scripts\deploy-local-k8s.ps1

# Manual
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
kubectl get all -n life-gamified
kubectl get pods -n life-gamified -w           # Watch pods in real-time
kubectl logs -f deployment/backend -n life-gamified  # Stream logs
kubectl describe pod <pod-name> -n life-gamified     # Debug a pod
kubectl port-forward svc/frontend 8080:80 -n life-gamified
kubectl port-forward svc/backend 3001:3001 -n life-gamified

# Scale
kubectl scale deployment/backend --replicas=3 -n life-gamified

# Rolling restart
kubectl rollout restart deployment/backend -n life-gamified

# Teardown
.\scripts\teardown-k8s.ps1
```

### Terraform
```powershell
cd infra/terraform
terraform init       # Download providers
terraform plan       # Preview changes
terraform apply      # Apply changes
terraform destroy    # Tear down
terraform state list # Show managed resources
terraform output     # Show output values
```

### Git
```powershell
git log --oneline            # Compact commit history
git log --graph --oneline    # Branch visualization
git diff HEAD~1              # Changes in last commit
```

---

## 13. Architecture Decisions & Trade-offs

| Decision | Alternative | Why I Chose This |
|----------|-------------|-----------------|
| SQLite over PostgreSQL | PostgreSQL in Docker | Zero-config for single-user; simpler to demo. Production would use PostgreSQL. |
| Docker Desktop K8s over minikube | minikube, kind, k3s | Already installed with Docker Desktop; no extra tooling. |
| GHCR over Docker Hub | Docker Hub, AWS ECR | Free, integrated with GitHub, no separate account needed. |
| Terraform Docker provider | AWS/Azure provider | Demonstrates IaC workflow without cloud costs. Same concepts apply. |
| Prometheus over Datadog | CloudWatch, Datadog, New Relic | Free, open-source, industry standard. No API keys needed. |
| GitHub Actions over Jenkins | Jenkins, GitLab CI, CircleCI | Free for public repos, no server to maintain, native GitHub integration. |
| Multi-stage Docker builds | Single-stage | 80% smaller images, better security, industry best practice. |
| 2 replicas (K8s) | 1 or 3+ replicas | Minimum for high availability. 3+ for production. |

---

*This document is your interview playbook. Every section maps to a real tool you can demo live and a question you can answer confidently.*
