#!/usr/bin/env tsx

import { supabase } from '../src/lib/supabase';

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Connection test result:', error.message);
    } else {
      console.log('✅ Basic connection successful');
    }

    // Test 2: Create a test user
    console.log('\n2️⃣ Testing user creation...');
    const testUser = {
      telegram_id: 999999999,
      username: 'test_user',
      first_name: 'Test',
      last_name: 'User'
    };

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (userError) {
      console.log('⚠️  User creation test:', userError.message);
    } else {
      console.log('✅ User created successfully:', userData.id);
      
      // Test 3: Create wallet for user
      console.log('\n3️⃣ Testing wallet creation...');
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .insert({
          user_id: userData.id,
          balance: 1000.00
        })
        .select()
        .single();

      if (walletError) {
        console.log('⚠️  Wallet creation test:', walletError.message);
      } else {
        console.log('✅ Wallet created successfully:', walletData.id);
      }

      // Test 4: Create a test room
      console.log('\n4️⃣ Testing room creation...');
      const testRoom = {
        room_id: 'test_room_123',
        name: 'Test Poker Room',
        game_type: 'poker',
        status: 'waiting',
        max_players: 2,
        stake_amount: 100,
        settings: {
          smallBlind: 50,
          bigBlind: 100,
          isPrivate: false
        },
        is_private: false
      };

      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert(testRoom)
        .select()
        .single();

      if (roomError) {
        console.log('⚠️  Room creation test:', roomError.message);
      } else {
        console.log('✅ Room created successfully:', roomData.id);
      }

      // Cleanup: Delete test data
      console.log('\n5️⃣ Cleaning up test data...');
      await supabase.from('wallets').delete().eq('user_id', userData.id);
      await supabase.from('users').delete().eq('id', userData.id);
      if (roomData) {
        await supabase.from('rooms').delete().eq('id', roomData.id);
      }
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSupabaseConnection().then(() => {
  console.log('\n🏁 Test script finished');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test script crashed:', error);
  process.exit(1);
}); 