#!/bin/bash
set -e
cd /opt/gamehub

# Check Node.js version
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

git pull origin main
npm ci
npm run build
pm2 restart all || true 