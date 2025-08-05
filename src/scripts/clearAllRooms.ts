import { api } from '@/lib/api';

async function clearAllRooms(): Promise<void> {
  try {
    console.log('🗑️ Clearing all poker rooms...');
    
    const rooms = await api.rooms.getByGameType('poker');
    
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
      
      try {
        await api.rooms.delete(room.room_id as string);
        console.log(`✅ Deleted: ${room.room_id}`);
      } catch (deleteError) {
        console.error(`❌ Error deleting room ${room.room_id}:`, deleteError);
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