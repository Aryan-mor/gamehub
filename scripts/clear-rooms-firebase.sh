#!/bin/bash

# Clear all poker rooms using Firebase CLI
# Usage: ./scripts/clear-rooms-firebase.sh

echo "🗑️ Clearing all poker rooms using Firebase CLI..."

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

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Error: Not logged in to Firebase"
    echo "Login with: firebase login"
    exit 1
fi

echo "📊 Removing pokerRooms node from Firebase..."
firebase database:remove /pokerRooms

if [ $? -eq 0 ]; then
    echo "✅ Successfully cleared all rooms"
else
    echo "❌ Failed to clear rooms"
    exit 1
fi 