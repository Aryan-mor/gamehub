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

# Create logs directory
mkdir -p logs

# Stop and delete existing process
pm2 stop gamehub-bot || true
pm2 delete gamehub-bot || true

# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo "Deployment completed successfully!"
echo "Bot status:"
pm2 status 