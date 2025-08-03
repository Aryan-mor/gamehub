import { supabase } from '@/lib/supabase';

async function clearOldRooms() {
  try {
    console.log('🔍 Searching for old rooms with maxPlayers: 8...');
    
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('game_type', 'poker')
      .eq('max_players', 8);
    
    if (error) {
      console.error('❌ Error fetching rooms:', error);
      return;
    }
    
    if (!rooms || rooms.length === 0) {
      console.log('✅ No rooms found');
      return;
    }
    
    let deletedCount = 0;
    
    for (const room of rooms) {
      console.log(`🗑️ Deleting old room: ${room.room_id} (maxPlayers: ${room.max_players})`);
      const { error: deleteError } = await supabase
        .from('rooms')
        .delete()
        .eq('id', room.id);
      
      if (deleteError) {
        console.error(`❌ Error deleting room ${room.room_id}:`, deleteError);
      } else {
        deletedCount++;
      }
    }
    
    console.log(`✅ Deleted ${deletedCount} old rooms`);
  } catch (error) {
    console.error('❌ Error clearing old rooms:', error);
  }
}

// Run the script
clearOldRooms().then(() => {
  console.log('🎉 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 