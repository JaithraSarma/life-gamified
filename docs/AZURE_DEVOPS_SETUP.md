# Azure DevOps Setup Guide

Complete step-by-step guide to run the **Life Gamified** CI/CD pipelines on Azure DevOps.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **Microsoft Account** | Any `@outlook.com`, `@hotmail.com`, or work/school account |
| **Azure Subscription** | Free trial ($200 credit) or Pay-As-You-Go — needed **only for CD pipeline** (ACR + AKS) |
| **Azure DevOps Account** | Free at [dev.azure.com](https://dev.azure.com) — **no Azure subscription needed for CI** |
| **Azure CLI** | `az --version` ≥ 2.50 — install from [aka.ms/installazurecli](https://aka.ms/installazurecli) |
| **Azure DevOps CLI extension** | `az extension add --name azure-devops` |

> **Cost Note**: The CI pipeline (lint, test, build, Docker build, Trivy scan) is **completely free** — it only uses Microsoft-hosted agents. The CD pipeline requires Azure Container Registry (Basic SKU ~$5/month) and optionally AKS. If you're on a **free trial**, the $200 credit covers this. If your trial has expired, you can still run CI for free.

---

## Quick Start — CI Only (No Azure Subscription Needed)

If you just want to run the CI pipeline (lint → test → build → Docker build → Trivy scan):

### Step 1: Create Azure DevOps Organization

1. Go to [dev.azure.com](https://dev.azure.com) and sign in.
2. Click **New organization** → name it (e.g., `JaithraSarma`).
3. Click **New project** → name it `life-gamified`.
4. Set visibility to **Public** for **unlimited free CI/CD minutes**, or **Private** for 1,800 free minutes/month.

### Step 2: Connect GitHub Repository

1. Go to **Pipelines** → **New pipeline**.
2. Select **GitHub** as the code source.
3. Authorize Azure DevOps to access your GitHub account.
4. Select repository: `JaithraSarma/life-gamified`.

### Step 3: Create the CI Pipeline

1. Choose **Existing Azure Pipelines YAML file**.
2. Set branch to `main` and path to: `/azure-pipelines/ci-pipeline.yml`.
3. Click **Run** — the pipeline will execute 3 stages:

| Stage | Jobs | Duration |
|-------|------|----------|
| **BuildAndTest** | Backend (npm ci → lint → 8 tests → build) + Frontend (npm ci → lint → build) | ~2 min |
| **DockerBuild** | Build backend & frontend Docker images | ~1 min |
| **SecurityScan** | Install Trivy, scan both services for HIGH/CRITICAL CVEs | ~1 min |

### Step 4: Verify

- Check **Pipelines** → **Runs** → you should see a green build.
- CI triggers automatically on pushes to `main`/`develop` and PRs to `main`.

---

## Full Setup — CI + CD (Requires Azure Subscription)

### Step 5: Create Azure Container Registry (ACR)

```bash
# Login to Azure
az login

# Create a resource group
az group create --name rg-life-gamified --location eastus

# Create ACR (Basic SKU — ~$5/month, covered by free trial)
az acr create --resource-group rg-life-gamified \
  --name lifegamifiedacr --sku Basic

# Verify — should print: lifegamifiedacr.azurecr.io
az acr show --name lifegamifiedacr --query loginServer -o tsv
```

### Step 6: Create ACR Service Connection in Azure DevOps

1. In your Azure DevOps project → **Project Settings** → **Service connections**.
2. **New service connection** → **Docker Registry** → **Azure Container Registry**.
3. Select your subscription and the `lifegamifiedacr` registry.
4. Name it: `acr-service-connection` ← must match the variable in `cd-pipeline.yml`.

### Step 7: Create the CD Pipeline

1. **Pipelines** → **New pipeline** → GitHub → same repo.
2. Choose **Existing Azure Pipelines YAML file**.
3. Set path to: `/azure-pipelines/cd-pipeline.yml`.
4. Click **Run**.

| Stage | Actions | Duration |
|-------|---------|----------|
| **BuildAndPush** | Build Docker images, push to ACR with build ID + `latest` tags | ~2 min |
| **Deploy** | Update K8s manifests with ACR image tags, apply to cluster, verify rollout | ~1 min |

### Step 8 (Optional): Kubernetes Service Connection

Only needed if you want the deploy stage to target a real K8s cluster:

1. **Project Settings** → **Service connections** → **New** → **Kubernetes**.
2. Choose **Azure Kubernetes Service** (if using AKS) or **KubeConfig** (for local/other clusters).
3. Name it: `k8s-service-connection` ← must match the variable in `cd-pipeline.yml`.

---

## Pipeline Variables Reference

Update these in the YAML files if your resource names differ:

| Variable | Default | Used In | Description |
|----------|---------|---------|-------------|
| `acrServiceConnection` | `acr-service-connection` | CD | Azure DevOps service connection name for ACR |
| `acrLoginServer` | `lifegamifiedacr.azurecr.io` | CD | ACR login server URL |
| `k8sServiceConnection` | `k8s-service-connection` | CD | Azure DevOps service connection name for K8s |
| `k8sNamespace` | `life-gamified` | CD | Kubernetes namespace to deploy into |

---

## Cleanup (Avoid Charges)

When done, tear down the Azure resources to avoid charges:

```bash
# Delete the entire resource group (ACR + everything inside)
az group delete --name rg-life-gamified --yes --no-wait

# Verify deletion
az group list --query "[?name=='rg-life-gamified']" -o table
```

The Azure DevOps organization itself is free and can be left as-is.

---

## File Structure

```
azure-pipelines/
├── ci-pipeline.yml              # CI: lint → test → build → Docker build → Trivy scan
├── cd-pipeline.yml              # CD: build & push to ACR → deploy to K8s (staged)
└── templates/
    ├── install-node.yml         # Reusable template: Node.js setup
    └── docker-build-push.yml   # Reusable template: Docker build + ACR push
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

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `TF401019: The Git repository with name or identifier does not exist` | Ensure the GitHub service connection is authorized and the repo name is correct |
| `No hosted parallelism has been purchased or granted` | For private projects, request free parallelism at [aka.ms/azpipelines-parallelism-request](https://aka.ms/azpipelines-parallelism-request) — takes ~2 business days. Or make the project **Public**. |
| `az devops: command not found` | Run `az extension add --name azure-devops` |
| ACR push fails with `unauthorized` | Verify the ACR service connection has push permissions. Re-create if needed. |
| Deploy stage skipped | Deploy only runs on `main` branch. Check the `condition` in `cd-pipeline.yml`. |
