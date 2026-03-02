.PHONY: dev build test clean docker-up docker-down lint

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
	docker-compose up --build -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

# ── Clean ────────────────────────────────────────────────
clean:
	rm -rf backend/dist backend/node_modules
	rm -rf frontend/dist frontend/node_modules
