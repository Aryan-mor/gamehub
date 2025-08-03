#!/bin/bash

# Clear specific old room
# Usage: ./scripts/clear-old-room.sh

echo "🗑️ Clearing old room: room_1754095606992_4xn"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Error: Firebase CLI is not installed"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo "📊 Removing old room from Firebase..."
firebase database:remove /pokerRooms/room_1754095606992_4xn

if [ $? -eq 0 ]; then
    echo "✅ Successfully cleared old room"
else
    echo "❌ Failed to clear old room"
    exit 1
fi 