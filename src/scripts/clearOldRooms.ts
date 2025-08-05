import { api } from '@/lib/api';

async function clearOldRooms(): Promise<void> {
  try {
    console.log('🔍 Searching for old rooms with maxPlayers: 8...');
    
    const rooms = await api.rooms.getByGameTypeAndMaxPlayers('poker', 8);
    
    if (!rooms || rooms.length === 0) {
      console.log('✅ No rooms found');
      return;
    }
    
    let deletedCount = 0;
    
    for (const room of rooms) {
      console.log(`🗑️ Deleting old room: ${room.room_id} (maxPlayers: ${room.max_players})`);
      try {
        await api.rooms.delete(room.room_id as string);
        deletedCount++;
      } catch (deleteError) {
        console.error(`❌ Error deleting room ${room.room_id}:`, deleteError);
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