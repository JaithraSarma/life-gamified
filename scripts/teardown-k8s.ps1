# ───────────────────────────────────────────────────────────────
# Life Gamified — Teardown K8s Deployment
# ───────────────────────────────────────────────────────────────

Write-Host "`n🧹 Tearing down Life Gamified from Kubernetes..." -ForegroundColor Yellow

kubectl delete -f k8s/ingress.yaml --ignore-not-found
kubectl delete -f k8s/frontend-deployment.yaml --ignore-not-found
kubectl delete -f k8s/backend-deployment.yaml --ignore-not-found
kubectl delete -f k8s/namespace.yaml --ignore-not-found

Write-Host "✅ All resources removed" -ForegroundColor Green
