import { ref, get, remove } from 'firebase/database';
import { database } from '../modules/core/firebase';

async function clearOldRooms() {
  try {
    console.log('🔍 Searching for old rooms with maxPlayers: 8...');
    
    const roomsRef = ref(database, 'pokerRooms');
    const snapshot = await get(roomsRef);
    
    if (!snapshot.exists()) {
      console.log('✅ No rooms found');
      return;
    }
    
    const rooms = snapshot.val();
    let deletedCount = 0;
    
    for (const [roomId, room] of Object.entries(rooms)) {
      const roomData = room as any;
      if (roomData.maxPlayers === 8) {
        console.log(`🗑️ Deleting old room: ${roomId} (maxPlayers: ${roomData.maxPlayers})`);
        await remove(ref(database, `pokerRooms/${roomId}`));
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