#!/usr/bin/env tsx
import { supabase } from '../src/lib/supabase';

async function fixChatIdSimple() {
  console.log('🔧 Fixing chat_id column type in room_messages table...\n');
  
  try {
    // First, let's check the current column type
    console.log('🔍 Checking current column type...');
    
    // Try to insert a test record with a large chat_id to see the error
    const testChatId = 7227266041; // This is the problematic chat_id
    
    console.log(`🧪 Testing with chat_id: ${testChatId}`);
    
    const { data, error } = await supabase
      .from('room_messages')
      .insert({
        room_id: 'test_room',
        user_id: 'test_user',
        message_id: 999999,
        chat_id: testChatId
      })
      .select();
    
    if (error) {
      console.log('❌ Expected error (column type issue):', error.message);
      
      if (error.message.includes('out of range for type integer')) {
        console.log('\n🔧 Column is still INTEGER. You need to run this SQL in Supabase SQL Editor:');
        console.log('\n--- SQL TO RUN IN SUPABASE ---');
        console.log('ALTER TABLE room_messages ALTER COLUMN chat_id TYPE BIGINT;');
        console.log('--- END SQL ---\n');
        
        console.log('📝 Instructions:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the SQL command above');
        console.log('4. Then run this script again to verify');
      }
    } else {
      console.log('✅ Test insert successful! Column type is correct.');
      
      // Clean up test data
      await supabase
        .from('room_messages')
        .delete()
        .eq('room_id', 'test_room');
      
      console.log('🧹 Test data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

fixChatIdSimple().then(() => {
  console.log('\n🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
}); 