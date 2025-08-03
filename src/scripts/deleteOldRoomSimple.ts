import { ref, remove } from 'firebase/database';
import { database } from '../modules/core/firebase';

async function deleteOldRoom() {
  try {
    const oldRoomId = 'room_1754095606992_4xn';
    console.log(`🗑️ Deleting old room: ${oldRoomId}`);
    
    const roomRef = ref(database, `pokerRooms/${oldRoomId}`);
    await remove(roomRef);
    
    console.log('✅ Old room deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting old room:', error);
  }
}

// Run the script
deleteOldRoom().then(() => {
  console.log('🎉 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 