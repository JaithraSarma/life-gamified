#!/bin/bash
# ── Life Gamified — Setup Script ─────────────────────────
set -e

echo "🎮 Setting up Life Gamified..."

# Backend
echo "📦 Installing backend dependencies..."
cd backend
npm install
cp -n .env.example .env 2>/dev/null || true
cd ..

# Frontend
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Or use Docker:"
echo "  docker-compose up --build"
