#!/bin/bash
set -e
cd /opt/gamehub
git pull origin main
yarn install --frozen-lockfile
yarn build
pm2 restart all || true 