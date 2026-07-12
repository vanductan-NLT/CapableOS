#!/bin/bash
# Quick clean + restart dev server (Windows-friendly)
# Usage: bash scripts/dev-clean.sh

echo "→ Killing any running Next.js processes..."
taskkill //F //IM node.exe 2>/dev/null || true

echo "→ Removing .next cache..."
rm -rf apps/web/.next

echo "→ Starting dev server..."
pnpm --filter @orchestra/web dev
