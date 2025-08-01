#!/usr/bin/env node

/**
 * Demo script for auto-discovery functionality
 * Run with: npx tsx src/demo-auto-discovery.ts
 */

import { registerModule, dispatch, getRouteInfo } from '../../modules/core/smart-router';
import { handleGamesMessage } from '../../actions/games';
import { HandlerContext } from '../../modules/core/handler';

// Mock Telegram context
const mockContext: HandlerContext = {
  ctx: {
    reply: async (message: string, options?: any) => {
      console.log(`🤖 Bot: ${message}`);
    }
  },
  user: {
    id: '12345',
    username: 'demo_user'
  }
};

async function demo() {
  console.log('🎮 GameHub Auto-Discovery Demo\n');
  
  // Register only the games module handler
  registerModule('games', handleGamesMessage);
  
  // Show initial route information
  console.log('📋 Initial Routes:');
  const initialRoutes = getRouteInfo();
  initialRoutes.forEach(route => {
    console.log(`  • ${route.route} [${route.type}]`);
  });
  
  console.log('\n📡 Testing Auto-Discovery:\n');
  
  // Test room actions (should be auto-discovered)
  console.log('1️⃣ Testing games.poker.room.create...');
  await dispatch('games.poker.room.create?name=Demo Room', mockContext);
  
  console.log('\n2️⃣ Testing games.poker.room.join...');
  await dispatch('games.poker.room.join?roomId=room_123', mockContext);
  
  console.log('\n3️⃣ Testing games.poker.room.call...');
  await dispatch('games.poker.room.call?roomId=room_123', mockContext);
  
  console.log('\n4️⃣ Testing games.poker.room.fold...');
  await dispatch('games.poker.room.fold?roomId=room_123', mockContext);
  
  console.log('\n5️⃣ Testing games.poker.room.raise...');
  await dispatch('games.poker.room.raise?roomId=room_123&amount=50', mockContext);
  
  console.log('\n6️⃣ Testing games.poker.room.leave...');
  await dispatch('games.poker.room.leave?roomId=room_123', mockContext);
  
  // Show final route information (should include auto-discovered routes)
  console.log('\n📋 Final Routes (after auto-discovery):');
  const finalRoutes = getRouteInfo();
  finalRoutes.forEach(route => {
    console.log(`  • ${route.route} [${route.type}]`);
  });
  
  // Test adding a new action (just create the file)
  console.log('\n7️⃣ Testing new action (games.poker.room.bet)...');
  try {
    await dispatch('games.poker.room.bet?roomId=room_123&amount=25', mockContext);
  } catch (error) {
    console.log(`❌ Expected error: ${error.message}`);
  }
  
  console.log('\n✅ Auto-Discovery Demo completed!');
  console.log('\n💡 Key Benefits:');
  console.log('  • No need to register each route manually');
  console.log('  • Just create a folder with index.ts and export default');
  console.log('  • Routes are automatically discovered and cached');
  console.log('  • Easy to add new actions without touching router code');
}

// Run the demo
demo().catch(console.error); 