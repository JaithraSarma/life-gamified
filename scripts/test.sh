#!/bin/bash
# ── Life Gamified — Test Script ──────────────────────────
set -e

echo "🧪 Running tests..."

# Backend tests
echo ""
echo "── Backend Tests ────────────────────────────────"
cd backend
npm test
cd ..

echo ""
echo "✅ All tests passed!"
