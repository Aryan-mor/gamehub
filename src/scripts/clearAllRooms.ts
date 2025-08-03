import { ref, get, remove } from 'firebase/database';
import { database } from '../modules/core/firebase';

async function clearAllRooms() {
  try {
    console.log('🗑️ Clearing all poker rooms...');
    
    const roomsRef = ref(database, 'pokerRooms');
    const snapshot = await get(roomsRef);
    
    if (!snapshot.exists()) {
      console.log('✅ No rooms found');
      return;
    }
    
    const rooms = snapshot.val();
    const roomIds = Object.keys(rooms);
    
    console.log(`📊 Found ${roomIds.length} rooms to delete:`);
    
    for (const roomId of roomIds) {
      const room = rooms[roomId];
      console.log(`🗑️ Deleting room: ${roomId}`);
      console.log(`   - Name: ${room.name}`);
      console.log(`   - Players: ${room.players?.length || 0}`);
      console.log(`   - Max Players: ${room.maxPlayers}`);
      console.log(`   - Status: ${room.status}`);
      
      await remove(ref(database, `pokerRooms/${roomId}`));
      console.log(`✅ Deleted: ${roomId}`);
    }
    
    console.log(`🎉 Successfully deleted ${roomIds.length} rooms`);
    
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