#!/usr/bin/env node

/**
 * Test auto-discovery functionality
 */

async function testAutoDiscovery() {
  console.log('🔍 Testing auto-discovery...');
  
  try {
    // Test direct import
    console.log('1️⃣ Testing direct import...');
    const callHandler = await import('../games/poker/room/call/index.ts');
    console.log('✅ Direct import successful:', !!callHandler.default);
    
    // Test dynamic import with path
    console.log('2️⃣ Testing dynamic import...');
    const dynamicHandler = await import('../games/poker/room/call/index.ts');
    console.log('✅ Dynamic import successful:', !!dynamicHandler.default);
    
    // Test with @ alias
    console.log('3️⃣ Testing with @ alias...');
    try {
      const aliasHandler = await import('@/games/poker/room/call/index.ts');
      console.log('✅ @ alias import successful:', !!aliasHandler.default);
    } catch (error) {
      console.log('❌ @ alias import failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

testAutoDiscovery(); 