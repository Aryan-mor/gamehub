#!/bin/bash
set -e
cd /opt/gamehub
git pull origin main
npm ci
npm run build
pm2 restart all || true 