import { supabase } from '@/lib/supabase';

async function clearAllRooms() {
  try {
    console.log('🗑️ Clearing all poker rooms...');
    
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('game_type', 'poker');
    
    if (error) {
      console.error('❌ Error fetching rooms:', error);
      return;
    }
    
    if (!rooms || rooms.length === 0) {
      console.log('✅ No rooms found');
      return;
    }
    
    console.log(`📊 Found ${rooms.length} rooms to delete:`);
    
    for (const room of rooms) {
      console.log(`🗑️ Deleting room: ${room.room_id}`);
      console.log(`   - Name: ${room.name}`);
      console.log(`   - Status: ${room.status}`);
      console.log(`   - Max Players: ${room.max_players}`);
      
      const { error: deleteError } = await supabase
        .from('rooms')
        .delete()
        .eq('id', room.id);
      
      if (deleteError) {
        console.error(`❌ Error deleting room ${room.room_id}:`, deleteError);
      } else {
        console.log(`✅ Deleted: ${room.room_id}`);
      }
    }
    
    console.log(`🎉 Successfully deleted ${rooms.length} rooms`);
    
  } catch (error) {
    console.error('❌ Error clearing rooms:', error);
  }
}

// Run the script
clearAllRooms().then(() => {
  console.log('🎉 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 