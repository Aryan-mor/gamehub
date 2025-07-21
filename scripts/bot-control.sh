#!/bin/bash

# Bot Control Script
# Usage: ./scripts/bot-control.sh [stop|start|restart|status]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

case "$1" in
  "stop")
    echo "🛑 Stopping all bot processes..."
    pkill -f "pnpm bot" || true
    pkill -f "tsx src/bot.ts" || true
    echo "✅ Bot processes stopped"
    ;;
  "start")
    echo "🚀 Starting bot..."
    pnpm run bot
    ;;
  "restart")
    echo "🔄 Restarting bot..."
    ./scripts/bot-control.sh stop
    sleep 2
    ./scripts/bot-control.sh start
    ;;
  "status")
    echo "🔍 Checking bot status..."
    if pgrep -f "pnpm bot" > /dev/null || pgrep -f "tsx src/bot.ts" > /dev/null; then
      echo "🟢 Bot is running:"
      ps aux | grep -E "(pnpm bot|tsx src/bot.ts)" | grep -v grep
    else
      echo "🔴 Bot is not running"
    fi
    ;;
  *)
    echo "Usage: $0 [stop|start|restart|status]"
    echo ""
    echo "Commands:"
    echo "  stop     - Stop all bot processes"
    echo "  start    - Start the bot"
    echo "  restart  - Restart the bot"
    echo "  status   - Check bot status"
    exit 1
    ;;
esac 