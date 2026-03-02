# Azure DevOps Setup Guide

This guide walks you through connecting the **Life Gamified** project to Azure DevOps with the free tier.

---

## 1. Create an Azure DevOps Organization (Free Tier)

1. Go to [dev.azure.com](https://dev.azure.com) and sign in with your Microsoft account.
2. Click **New organization** → name it (e.g., `JaithraSarma`).
3. Click **New project** → name it `life-gamified` → set visibility to **Public** (unlimited free CI/CD minutes) or **Private** (1,800 free minutes/month).

> **Free Tier Limits**: Public projects get unlimited parallel jobs. Private projects get 1 free Microsoft-hosted parallel job with 1,800 minutes/month.

---

## 2. Connect Your GitHub Repository

1. In your Azure DevOps project, go to **Project Settings** → **Service connections**.
2. Click **New service connection** → **GitHub** → authorize with your GitHub account.
3. Select your repo: `JaithraSarma/life-gamified`.

---

## 3. Create the CI Pipeline

1. Go to **Pipelines** → **New pipeline**.
2. Select **GitHub** as the source → pick `JaithraSarma/life-gamified`.
3. Choose **Existing Azure Pipelines YAML file**.
4. Set path to: `/azure-pipelines/ci-pipeline.yml`
5. Click **Run** to trigger the first build.

### What CI Does

| Stage           | Jobs                                         |
|-----------------|----------------------------------------------|
| **Build & Test** | Backend (npm ci → lint → 8 tests → build) + Frontend (npm ci → lint → build) |
| **Docker Build** | Builds backend & frontend Docker images      |
| **Security Scan** | Installs Trivy, scans both services for HIGH/CRITICAL CVEs |

---

## 4. Create the CD Pipeline

1. Go to **Pipelines** → **New pipeline** → GitHub → same repo.
2. Choose **Existing Azure Pipelines YAML file**.
3. Set path to: `/azure-pipelines/cd-pipeline.yml`
4. Before running, set up the service connections (see below).

### Prerequisites for CD

#### a) Azure Container Registry (ACR)

```bash
# Create a resource group
az group create --name rg-life-gamified --location eastus

# Create ACR (free-tier: Basic SKU)
az acr create --resource-group rg-life-gamified \
  --name lifegamifiedacr --sku Basic

# Get login server (should be lifegamifiedacr.azurecr.io)
az acr show --name lifegamifiedacr --query loginServer -o tsv
```

#### b) ACR Service Connection in Azure DevOps

1. **Project Settings** → **Service connections** → **New** → **Docker Registry**.
2. Select **Azure Container Registry**.
3. Choose your subscription and the `lifegamifiedacr` registry.
4. Name it: `acr-service-connection` (must match the variable in `cd-pipeline.yml`).

#### c) Kubernetes Service Connection (Optional — for deploy stage)

1. **Project Settings** → **Service connections** → **New** → **Kubernetes**.
2. Choose **Azure Kubernetes Service** or **KubeConfig** for local clusters.
3. Name it: `k8s-service-connection` (must match the variable in `cd-pipeline.yml`).

### What CD Does

| Stage              | Actions                                        |
|--------------------|------------------------------------------------|
| **Build & Push**   | Builds Docker images, pushes to ACR with build ID + latest tags |
| **Deploy to K8s**  | Updates image tags in manifests, applies to K8s cluster, verifies rollout |

---

## 5. Pipeline Variables to Update

Open each pipeline YAML and update these if your names differ:

| Variable            | Default Value                  | Description                    |
|---------------------|--------------------------------|--------------------------------|
| `acrServiceConnection` | `acr-service-connection`    | Service connection name for ACR |
| `acrLoginServer`    | `lifegamifiedacr.azurecr.io`  | ACR login server URL           |
| `k8sServiceConnection` | `k8s-service-connection`   | Service connection name for K8s |
| `k8sNamespace`      | `life-gamified`               | Kubernetes namespace            |

---

## 6. Verify Pipelines

After setup, verify:

1. **CI** triggers on pushes to `main`/`develop` and PRs to `main`.
2. **CD** triggers only on pushes to `main` and version tags (`v*`).
3. Check the Azure DevOps **Pipelines** → **Runs** page for green builds.

---

## 7. File Structure

```
azure-pipelines/
├── ci-pipeline.yml              # CI: lint → test → build → Docker build → Trivy scan
├── cd-pipeline.yml              # CD: build & push to ACR → deploy to K8s
└── templates/
    ├── install-node.yml         # Reusable: Node.js setup
    └── docker-build-push.yml   # Reusable: Docker build + ACR push
```

---

## Dual Pipeline Architecture (GitHub Actions + Azure DevOps)

Both pipelines run in parallel for **redundancy and multi-platform CI/CD practice**:

```
                         ┌──────────────────────────┐
    Push to main ───────►│  GitHub Actions (CI+CD)  │── GHCR
                         └──────────────────────────┘
                         ┌──────────────────────────┐
    Push to main ───────►│  Azure DevOps (CI+CD)    │── ACR
                         └──────────────────────────┘
```

| Feature              | GitHub Actions           | Azure DevOps             |
|----------------------|--------------------------|--------------------------|
| Config files         | `.github/workflows/`     | `azure-pipelines/`       |
| Container registry   | GHCR                     | Azure Container Registry |
| Trigger syntax       | `on: push/pr`            | `trigger/pr`             |
| Pipeline language    | GitHub Actions YAML      | Azure Pipelines YAML     |
| Deploy mechanism     | `kubectl apply`          | `KubernetesManifest@1`   |
| Deployment guard     | `vars.DEPLOY_ENABLED`    | Environment approvals    |
| Free tier            | 2,000 min/month (private)| 1,800 min/month (private)|
