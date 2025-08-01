#!/usr/bin/env node

/**
 * Demo script for testing the new start action with auto-discovery
 * Run with: npx tsx src/utils/demos/demo-start-action.ts
 */

import { registerModule, dispatch } from '../../modules/core/smart-router';
import { HandlerContext } from '../../modules/core/handler';
import { UserId } from '../../utils/types';

// Mock Telegram context
const mockContext: HandlerContext = {
  ctx: {
    telegram: {
      sendMessage: async (chatId: number, text: string, options?: any) => {
        console.log(`🤖 Bot: ${text}`);
        return { message_id: 1 };
      }
    },
    chat: { id: 12345 },
    reply: async (message: string, options?: any) => {
      console.log(`🤖 Bot: ${message}`);
    }
  },
  user: {
    id: '12345' as UserId,
    username: 'demo_user'
  }
};

async function demoStartAction() {
  console.log('🎮 GameHub Start Action Demo\n');
  
  console.log('📡 Testing Start Action with Auto-Discovery:\n');
  
  // Test start action
  console.log('1️⃣ Testing start action...');
  try {
    await dispatch('start', mockContext);
    console.log('✅ Start action executed successfully!');
  } catch (error) {
    console.log(`❌ Start action failed: ${error.message}`);
  }
  
  console.log('\n✅ Start Action Demo completed!');
  console.log('\n💡 Key Benefits:');
  console.log('  • Auto-discovery router finds start handler');
  console.log('  • Type-safe user ID validation');
  console.log('  • Modular architecture');
  console.log('  • Easy to test and maintain');
}

// Run the demo
demoStartAction().catch(console.error); 