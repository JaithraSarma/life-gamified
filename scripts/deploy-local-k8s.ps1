# ───────────────────────────────────────────────────────────────
# Life Gamified — Local Kubernetes Deployment Script
# Prerequisites: Docker Desktop with K8s enabled, kubectl
# ───────────────────────────────────────────────────────────────

Write-Host "`n🎮 Life Gamified — Local K8s Deployment" -ForegroundColor Cyan
Write-Host "=" * 50

# Step 1: Verify prerequisites
Write-Host "`n[1/6] Checking prerequisites..." -ForegroundColor Yellow
$kubectlOk = Get-Command kubectl -ErrorAction SilentlyContinue
$dockerOk = Get-Command docker -ErrorAction SilentlyContinue

if (-not $kubectlOk) { Write-Host "❌ kubectl not found. Install it or enable K8s in Docker Desktop." -ForegroundColor Red; exit 1 }
if (-not $dockerOk) { Write-Host "❌ Docker not found." -ForegroundColor Red; exit 1 }

# Check if K8s cluster is reachable
$clusterCheck = kubectl cluster-info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ No Kubernetes cluster found." -ForegroundColor Red
    Write-Host "   → Open Docker Desktop → Settings → Kubernetes → Enable Kubernetes" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ kubectl and Docker available. Cluster reachable." -ForegroundColor Green

# Step 2: Build Docker images locally
Write-Host "`n[2/6] Building Docker images..." -ForegroundColor Yellow
docker build -t life-gamified-backend:latest ./backend
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Backend image build failed" -ForegroundColor Red; exit 1 }

docker build -t life-gamified-frontend:latest ./frontend
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Frontend image build failed" -ForegroundColor Red; exit 1 }
Write-Host "✅ Docker images built successfully" -ForegroundColor Green

# Step 3: Create namespace
Write-Host "`n[3/6] Creating Kubernetes namespace..." -ForegroundColor Yellow
kubectl apply -f k8s/namespace.yaml
Write-Host "✅ Namespace 'life-gamified' created" -ForegroundColor Green

# Step 4: Deploy all manifests
Write-Host "`n[4/6] Deploying to Kubernetes..." -ForegroundColor Yellow
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
Write-Host "✅ All manifests applied" -ForegroundColor Green

# Step 5: Wait for rollout
Write-Host "`n[5/6] Waiting for pods to be ready..." -ForegroundColor Yellow
kubectl rollout status deployment/backend -n life-gamified --timeout=120s
kubectl rollout status deployment/frontend -n life-gamified --timeout=120s
Write-Host "✅ All deployments are ready" -ForegroundColor Green

# Step 6: Show status
Write-Host "`n[6/6] Deployment status:" -ForegroundColor Yellow
kubectl get all -n life-gamified

# Port forward for access
Write-Host "`n🌐 To access the app, run these in separate terminals:" -ForegroundColor Cyan
Write-Host "   kubectl port-forward svc/backend 3001:3001 -n life-gamified" -ForegroundColor White
Write-Host "   kubectl port-forward svc/frontend 8080:80 -n life-gamified" -ForegroundColor White
Write-Host "`n   Then open: http://localhost:8080" -ForegroundColor Green
