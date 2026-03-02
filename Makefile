.PHONY: dev build test clean docker-up docker-down lint k8s-deploy k8s-teardown monitor-up

# ── Development ──────────────────────────────────────────
dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

install:
	cd backend && npm install
	cd frontend && npm install

# ── Build ────────────────────────────────────────────────
build:
	cd backend && npm run build
	cd frontend && npm run build

# ── Test ─────────────────────────────────────────────────
test:
	cd backend && npm test

lint:
	cd backend && npm run lint
	cd frontend && npm run lint

# ── Docker ───────────────────────────────────────────────
docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

# ── Docker Build (images only) ───────────────────────────
docker-build:
	docker build -t life-gamified-backend:latest ./backend
	docker build -t life-gamified-frontend:latest ./frontend

# ── Kubernetes (local) ───────────────────────────────────
k8s-deploy: docker-build
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/backend-deployment.yaml
	kubectl apply -f k8s/frontend-deployment.yaml
	kubectl apply -f k8s/ingress.yaml
	kubectl rollout status deployment/backend -n life-gamified --timeout=120s
	kubectl rollout status deployment/frontend -n life-gamified --timeout=120s
	@echo "✅ Deployed. Run: kubectl port-forward svc/frontend 8080:80 -n life-gamified"

k8s-teardown:
	kubectl delete -f k8s/ --ignore-not-found
	kubectl delete namespace life-gamified --ignore-not-found

k8s-status:
	kubectl get all -n life-gamified

# ── Monitoring ───────────────────────────────────────────
monitor-up:
	docker compose up -d prometheus grafana
	@echo "Prometheus: http://localhost:9090"
	@echo "Grafana:    http://localhost:3000 (admin/admin)"

# ── Terraform (local Docker) ────────────────────────────
tf-init:
	cd infra/terraform && terraform init

tf-plan:
	cd infra/terraform && terraform plan

tf-apply:
	cd infra/terraform && terraform apply -auto-approve

tf-destroy:
	cd infra/terraform && terraform destroy -auto-approve

# ── Full Pipeline (local) ───────────────────────────────
pipeline: test docker-build k8s-deploy
	@echo "✅ Full local pipeline complete: test → build → deploy"

# ── Clean ────────────────────────────────────────────────
clean:
	rm -rf backend/dist backend/node_modules
	rm -rf frontend/dist frontend/node_modules
