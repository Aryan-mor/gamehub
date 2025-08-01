#!/usr/bin/env node

/**
 * Demo script for the new type system with custom IDs
 * Run with: npx tsx src/demo-type-system.ts
 */

import { 
  UserId, 
  RoomId, 
  GameId, 
  TransactionId,
  User,
  Room,
  Game
} from '../utils/types';

import {
  isValidUserId,
  isValidRoomId,
  isValidGameId,
  isValidTransactionId,
  createRoomId,
  createGameId,
  createTransactionId,
  safeIdConversion,
  assertValidId
} from '../typeGuards';

function demoTypeSystem() {
  console.log('🎯 GameHub Type System Demo\n');
  
  // 1. Testing ID validation
  console.log('1️⃣ Testing ID Validation:');
  
  const validUserId = '12345';
  const invalidUserId = 'abc123';
  
  console.log(`  User ID "${validUserId}": ${isValidUserId(validUserId) ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`  User ID "${invalidUserId}": ${isValidUserId(invalidUserId) ? '✅ Valid' : '❌ Invalid'}`);
  
  const validRoomId = 'room_1754041572556_12345';
  const invalidRoomId = 'room_invalid';
  
  console.log(`  Room ID "${validRoomId}": ${isValidRoomId(validRoomId) ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`  Room ID "${invalidRoomId}": ${isValidRoomId(invalidRoomId) ? '✅ Valid' : '❌ Invalid'}`);
  
  // 2. Testing ID creation
  console.log('\n2️⃣ Testing ID Creation:');
  
  try {
    const userId: UserId = validUserId as UserId;
    const roomId: RoomId = createRoomId(Date.now(), userId);
    const gameId: GameId = createGameId('poker', 'demo123');
    const txId: TransactionId = createTransactionId(Date.now(), 'abc123');
    
    console.log(`  Created Room ID: ${roomId}`);
    console.log(`  Created Game ID: ${gameId}`);
    console.log(`  Created Transaction ID: ${txId}`);
  } catch (error) {
    console.log(`  ❌ Error creating IDs: ${error.message}`);
  }
  
  // 3. Testing safe conversion
  console.log('\n3️⃣ Testing Safe Conversion:');
  
  const safeRoomId = safeIdConversion('room_1754041572556_12345', isValidRoomId);
  const unsafeRoomId = safeIdConversion('invalid_room', isValidRoomId);
  
  console.log(`  Safe conversion valid: ${safeRoomId ? '✅ Success' : '❌ Failed'}`);
  console.log(`  Safe conversion invalid: ${unsafeRoomId ? '✅ Success' : '❌ Failed (expected)'}`);
  
  // 4. Testing type assertions
  console.log('\n4️⃣ Testing Type Assertions:');
  
  try {
    assertValidId(validUserId, isValidUserId, 'User ID assertion');
    console.log('  ✅ User ID assertion passed');
  } catch (error) {
    console.log(`  ❌ User ID assertion failed: ${error.message}`);
  }
  
  try {
    assertValidId(invalidUserId, isValidUserId, 'Invalid User ID assertion');
    console.log('  ✅ Invalid User ID assertion passed');
  } catch (error) {
    console.log(`  ❌ Invalid User ID assertion failed (expected): ${error.message}`);
  }
  
  // 5. Testing entity interfaces
  console.log('\n5️⃣ Testing Entity Interfaces:');
  
  const user: User = {
    id: validUserId as UserId,
    username: 'demo_user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    balance: 1000,
    is_active: true
  };
  
  const room: Room = {
    id: validRoomId as RoomId,
    name: 'Demo Room',
    game_type: 'poker',
    created_by: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
    max_players: 8,
    current_players: 1,
    status: 'waiting'
  };
  
  const game: Game = {
    id: 'game_poker_demo123' as GameId,
    name: 'Texas Hold\'em',
    type: 'poker',
    description: 'Classic poker game',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log(`  User: ${user.username} (ID: ${user.id})`);
  console.log(`  Room: ${room.name} (ID: ${room.id})`);
  console.log(`  Game: ${game.name} (ID: ${game.id})`);
  
  // 6. Testing type safety
  console.log('\n6️⃣ Testing Type Safety:');
  
  // This would cause TypeScript errors if uncommented:
  // const invalidUser: User = {
  //   id: 'invalid_id', // TypeScript error: string is not assignable to UserId
  //   // ... other properties
  // };
  
  console.log('  ✅ Type safety enforced - invalid IDs would cause TypeScript errors');
  
  // 7. Testing router integration
  console.log('\n7️⃣ Testing Router Integration:');
  
  const mockQuery = {
    roomId: validRoomId,
    userId: validUserId,
    gameId: 'game_poker_demo123'
  };
  
  // Validate all IDs in query
  const { valid, invalid } = validateIds(mockQuery);
  
  console.log(`  Valid IDs: ${Object.keys(valid).length}`);
  console.log(`  Invalid IDs: ${invalid.length}`);
  
  if (invalid.length > 0) {
    console.log(`  Invalid IDs: ${invalid.join(', ')}`);
  }
  
  console.log('\n✅ Type System Demo completed!');
  console.log('\n💡 Key Benefits:');
  console.log('  • Type safety prevents ID misuse');
  console.log('  • Runtime validation with type guards');
  console.log('  • Clear error messages for invalid IDs');
  console.log('  • Automatic ID format enforcement');
  console.log('  • No more string-based ID confusion');
}

// Import the missing function
import { validateIds } from '../typeGuards';

// Run the demo
demoTypeSystem(); 