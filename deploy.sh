#!/bin/bash
set -e
cd /opt/gamehub

# Check Node.js version
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Stash any local changes to avoid conflicts
git stash || true

# Pull latest changes
git pull origin main

# Remove yarn.lock if it exists (since we're using npm now)
rm -f yarn.lock

pnpm install --frozen-lockfile
npm run build
pm2 restart all || true 