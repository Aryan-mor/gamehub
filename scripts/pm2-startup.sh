#!/bin/bash

# PM2 Startup Configuration Script
# This script configures PM2 to start automatically on server reboot

echo "🔧 Setting up PM2 startup configuration..."

# Generate PM2 startup script
pm2 startup

echo ""
echo "📋 Follow the instructions above to complete PM2 startup setup."
echo "   Usually it involves running a command like:"
echo "   sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME"
echo ""
echo "💾 After running the startup command, save the current PM2 configuration:"
echo "   pm2 save"
echo ""
echo "✅ This will ensure your bot starts automatically when the server reboots." 