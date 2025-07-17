#!/bin/bash
set -e
cd /opt/gamehub

# Check Node.js version
echo "Node.js version: $(node --version)"

# Stash any local changes to avoid conflicts
git stash || true

# Pull latest changes
git pull origin main

# Remove yarn.lock if it exists (since we're using pnpm now)
rm -f yarn.lock

pnpm install --frozen-lockfile
pnpm run build
pm2 restart all || true 