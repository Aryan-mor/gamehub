#!/usr/bin/env node

/**
 * Demo script for advanced router with wildcard and pattern matching
 * Run with: npx tsx src/demo-advanced-router.ts
 */

import { register, registerModule, dispatch, getRouteInfo } from './core/advanced-router';
import { handleGamesMessage } from './games';
import { HandlerContext } from './core/handler';

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
  console.log('🎮 GameHub Advanced Router Demo\n');
  
  // Register pattern-based handlers first (more specific)
  register('games.:game.room.:action', async (context, query, params) => {
    console.log(`🎯 Pattern matched: game=${params?.game}, action=${params?.action}`);
    await context.ctx.reply(`Pattern handler: ${params?.game} room ${params?.action}`);
  });
  
  register('games.poker.room.*', async (context, query) => {
    console.log('🎯 Wildcard matched: poker room action');
    await context.ctx.reply('Wildcard handler: poker room action');
  });
  
  register('games.:game.start', async (context, query, params) => {
    console.log(`🎯 Game start pattern: ${params?.game}`);
    await context.ctx.reply(`Game start: ${params?.game}`);
  });
  
  // Register module handler last (fallback)
  registerModule('games', handleGamesMessage);
  
  // Show route information
  console.log('📋 Registered Routes:');
  const routeInfo = getRouteInfo();
  routeInfo.forEach(route => {
    const specificity = route.specificity ? ` (specificity: ${route.specificity})` : '';
    console.log(`  • ${route.route} [${route.type}]${specificity}`);
  });
  
  console.log('\n📡 Testing Advanced Routing:\n');
  
  // Test exact matches
  console.log('1️⃣ Testing exact match...');
  await dispatch('games.start', mockContext);
  
  // Test pattern matches
  console.log('\n2️⃣ Testing pattern match...');
  await dispatch('games.poker.room.call?roomId=123', mockContext);
  
  console.log('\n3️⃣ Testing another pattern match...');
  await dispatch('games.blackjack.room.deal?roomId=456', mockContext);
  
  // Test wildcard matches
  console.log('\n4️⃣ Testing wildcard match...');
  await dispatch('games.poker.room.fold?roomId=789', mockContext);
  
  // Test game start pattern
  console.log('\n5️⃣ Testing game start pattern...');
  await dispatch('games.dice.start', mockContext);
  
  console.log('\n6️⃣ Testing another game start...');
  await dispatch('games.blackjack.start', mockContext);
  
  // Test error handling
  console.log('\n❌ Testing unknown route...');
  try {
    await dispatch('unknown.route', mockContext);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n✅ Advanced Router Demo completed!');
}

// Run the demo
demo().catch(console.error); 