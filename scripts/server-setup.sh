#!/bin/bash

# Server Setup Script for GameHub Bot
# This script helps set up the server environment for the bot

set -e

echo "🚀 Setting up GameHub Bot server environment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p dist

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📝 Please create a .env file with the following variables:"
    echo ""
    cat env.example
    echo ""
    echo "🔧 You can copy env.example to .env and fill in your values:"
    echo "   cp env.example .env"
    echo ""
    read -p "Do you want to create .env from env.example now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp env.example .env
        echo "✅ Created .env file. Please edit it with your actual values."
    fi
else
    echo "✅ .env file found"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile --prod

# Build the application
echo "🔨 Building application..."
pnpm run build

# Check if ecosystem.config.js exists
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Error: ecosystem.config.js not found!"
    exit 1
fi

# Stop any existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop gamehub-bot || true
pm2 delete gamehub-bot || true

# Start the application with PM2
echo "🚀 Starting bot with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Show status
echo "📊 Bot status:"
pm2 status

echo ""
echo "✅ Server setup completed!"
echo ""
echo "📋 Useful commands:"
echo "   pm2 logs gamehub-bot          # View bot logs"
echo "   pm2 restart gamehub-bot       # Restart bot"
echo "   pm2 stop gamehub-bot          # Stop bot"
echo "   pm2 start gamehub-bot         # Start bot"
echo "   pm2 status                    # Show status"
echo ""
echo "🔍 To check if the bot is working:"
echo "   1. Check PM2 status: pm2 status"
echo "   2. Check logs: pm2 logs gamehub-bot"
echo "   3. Test bot in Telegram" 