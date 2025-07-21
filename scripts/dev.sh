#!/bin/bash

# Development script for GameHub bot
# Uses exec to replace the shell process with tsx
# This ensures that CTRL+C goes directly to the tsx process

echo "🚀 Starting GameHub bot in development mode..."
exec pnpm tsx src/bot.ts 