#!/bin/bash
set -e
cd /opt/gamehub

# Check Node.js version
echo "Node.js version: $(node --version)"

# Install dependencies
pnpm install --frozen-lockfile --prod

# Build the application (if not already built by CI/CD)
if [ ! -d "dist" ]; then
  echo "Building application..."
  pnpm run build
fi

# Restart the application
pm2 restart all || pm2 start all

echo "Deployment completed successfully!" 