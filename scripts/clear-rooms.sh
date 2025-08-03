#!/bin/bash

# Clear all poker rooms script
# Usage: ./scripts/clear-rooms.sh

echo "🗑️ Clearing all poker rooms..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create it with Firebase configuration"
    exit 1
fi

# Run the TypeScript script
echo "📊 Running clear rooms script..."
npx tsx src/scripts/clearAllRooms.ts

if [ $? -eq 0 ]; then
    echo "✅ Successfully cleared all rooms"
else
    echo "❌ Failed to clear rooms"
    exit 1
fi 