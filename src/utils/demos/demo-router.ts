#!/usr/bin/env node

/**
 * Demo script to demonstrate the new hierarchical routing system
 * Run with: npx tsx src/demo-router.ts
 */

import { initializeRoutes, handleMessage } from '../../main-router';
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
  console.log('🎮 GameHub Hierarchical Router Demo\n');
  
  // Initialize routes
  initializeRoutes();
  
  console.log('\n📡 Testing Hierarchical Routing:\n');
  
  // Test games.start
  console.log('1️⃣ Testing games.start...');
  await handleMessage('games.start', mockContext);
  
  // Test games.list
  console.log('\n2️⃣ Testing games.list...');
  await handleMessage('games.list', mockContext);
  
  // Test poker.start
  console.log('\n3️⃣ Testing games.poker.start...');
  await handleMessage('games.poker.start', mockContext);
  
  // Test poker.help
  console.log('\n4️⃣ Testing games.poker.help...');
  await handleMessage('games.poker.help', mockContext);
  
  // Test room.list
  console.log('\n5️⃣ Testing games.poker.room.list...');
  await handleMessage('games.poker.room.list', mockContext);
  
  // Test room creation
  console.log('\n6️⃣ Testing games.poker.room.create...');
  await handleMessage('games.poker.room.create?name=Demo Room', mockContext);
  
  // Test room join
  console.log('\n7️⃣ Testing games.poker.room.join...');
  await handleMessage('games.poker.room.join?roomId=room_123', mockContext);
  
  // Test game actions
  console.log('\n8️⃣ Testing games.poker.room.call...');
  await handleMessage('games.poker.room.call?roomId=room_123', mockContext);
  
  console.log('\n9️⃣ Testing games.poker.room.fold...');
  await handleMessage('games.poker.room.fold?roomId=room_123', mockContext);
  
  console.log('\n🔟 Testing games.poker.room.raise...');
  await handleMessage('games.poker.room.raise?roomId=room_123&amount=50', mockContext);
  
  // Test error handling
  console.log('\n❌ Testing unknown route...');
  await handleMessage('games.unknown.action', mockContext);
  
  console.log('\n✅ Demo completed!');
}

// Run the demo
demo().catch(console.error); 