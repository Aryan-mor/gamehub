#!/bin/bash

# Bot Troubleshooting Script
# This script helps diagnose and fix common bot startup issues

echo "🔍 GameHub Bot Troubleshooting Script"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo ""
echo "1. 📁 Checking project structure..."
if [ -d "dist" ]; then
    echo "   ✅ dist/ directory exists"
    if [ -f "dist/bot.js" ]; then
        echo "   ✅ dist/bot.js exists"
    else
        echo "   ❌ dist/bot.js not found - build the project first"
    fi
else
    echo "   ❌ dist/ directory not found - build the project first"
fi

echo ""
echo "2. 🔧 Checking environment variables..."
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
    if grep -q "TELEGRAM_BOT_TOKEN" .env; then
        echo "   ✅ TELEGRAM_BOT_TOKEN found in .env"
    else
        echo "   ❌ TELEGRAM_BOT_TOKEN not found in .env"
    fi
else
    echo "   ❌ .env file not found"
fi

echo ""
echo "3. 📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules exists"
else
    echo "   ❌ node_modules not found - run 'pnpm install'"
fi

echo ""
echo "4. 🚀 Checking PM2 status..."
if command -v pm2 &> /dev/null; then
    echo "   ✅ PM2 is installed"
    echo "   📊 Current PM2 status:"
    pm2 status
else
    echo "   ❌ PM2 not installed - install with 'npm install -g pm2'"
fi

echo ""
echo "5. 📋 Checking PM2 logs..."
if command -v pm2 &> /dev/null; then
    echo "   📄 Recent PM2 logs for gamehub-bot:"
    pm2 logs gamehub-bot --lines 20 || echo "   No logs found or bot not running"
fi

echo ""
echo "6. 🔍 Testing bot startup manually..."
if [ -f "dist/bot.js" ]; then
    echo "   🧪 Testing bot startup (will timeout after 10 seconds)..."
    timeout 10s node dist/bot.js || echo "   ⚠️  Bot startup test completed (timeout or error)"
else
    echo "   ❌ Cannot test - dist/bot.js not found"
fi

echo ""
echo "🔧 Common fixes:"
echo "   1. If .env is missing: cp env.example .env && edit .env"
echo "   2. If dist/ is missing: pnpm run build"
echo "   3. If dependencies missing: pnpm install"
echo "   4. If PM2 not working: pm2 start ecosystem.config.js"
echo "   5. Check logs: pm2 logs gamehub-bot"
echo ""
echo "📞 If issues persist, check:"
echo "   - Environment variables are correct"
echo "   - Bot token is valid"
echo "   - Firebase configuration is correct"
echo "   - Server has internet access" 