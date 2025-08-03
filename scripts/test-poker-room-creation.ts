#!/usr/bin/env tsx

import { supabase } from '../src/lib/supabase';
import { createPokerRoom } from '../src/actions/games/poker/services/pokerService';

async function testPokerRoomCreation() {
  console.log('🧪 Testing Poker Room Creation...\n');

  try {
    // Test 1: Get or create a test user first
    console.log('1️⃣ Getting test user...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', 999888777)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ User retrieval failed:', userError);
      return;
    }

    if (!userData) {
      // Create new user
      const { data: newUserData, error: createError } = await supabase
        .from('users')
        .insert({
          telegram_id: 999888777,
          username: 'poker_test_user',
          first_name: 'Poker',
          last_name: 'Tester'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ User creation failed:', createError);
        return;
      }
      console.log('✅ Test user created:', newUserData.id);
    } else {
      console.log('✅ Test user found:', userData.id);
    }

    // Test 2: Create poker room using the service
    console.log('\n2️⃣ Testing poker room creation service...');
    const createRoomRequest = {
      name: 'Test Poker Room',
      maxPlayers: 4,
      smallBlind: 50,
      isPrivate: false,
      turnTimeoutSec: 30
    };

    const room = await createPokerRoom(
      createRoomRequest,
      '999888777' as any, // PlayerId (telegram_id)
      'Poker Tester',
      'poker_test_user',
      999888777
    );

    console.log('✅ Poker room created successfully!');
    console.log('   Room ID:', room.id);
    console.log('   Room Name:', room.name);
    console.log('   Players:', room.players.length);
    console.log('   Status:', room.status);

    // Test 3: Verify room in database
    console.log('\n3️⃣ Verifying room in database...');
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_id', room.id)
      .single();

    if (roomError) {
      console.error('❌ Room verification failed:', roomError);
    } else {
      console.log('✅ Room verified in database');
      console.log('   Database ID:', roomData.id);
      console.log('   Room ID:', roomData.room_id);
      console.log('   Game Type:', roomData.game_type);
    }

    // Test 4: Verify player in room
    console.log('\n4️⃣ Verifying player in room...');
    const { data: playerData, error: playerError } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', roomData.id)
      .eq('user_id', userData.id)
      .single();

    if (playerError) {
      console.error('❌ Player verification failed:', playerError);
    } else {
      console.log('✅ Player verified in room');
      console.log('   Player Ready:', playerData.is_ready);
      console.log('   Player Data:', playerData.player_data?.name);
    }

    // Cleanup
    console.log('\n5️⃣ Cleaning up test data...');
    await supabase.from('room_players').delete().eq('room_id', roomData.id);
    await supabase.from('rooms').delete().eq('id', roomData.id);
    await supabase.from('users').delete().eq('id', userData.id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Poker room creation test completed successfully!');

  } catch (error) {
    console.error('❌ Poker room creation test failed:', error);
  }
}

// Run the test
testPokerRoomCreation().then(() => {
  console.log('\n🏁 Test script finished');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test script crashed:', error);
  process.exit(1);
}); 