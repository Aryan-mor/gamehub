#!/bin/bash

# Run both main bot and card image service
echo "🚀 Starting both services..."

# Start main bot in background
echo "📱 Starting main bot..."
pnpm dev &
MAIN_BOT_PID=$!

# Wait a moment for main bot to start
sleep 3

# Start card image service in background
echo "🎴 Starting card image service..."
cd packages/card-image-service && pnpm dev &
CARD_SERVICE_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping services..."
    kill $MAIN_BOT_PID 2>/dev/null
    kill $CARD_SERVICE_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "✅ Both services started!"
echo "📱 Main bot PID: $MAIN_BOT_PID"
echo "🎴 Card service PID: $CARD_SERVICE_PID"
echo "Press Ctrl+C to stop both services"

# Wait for both processes
wait
