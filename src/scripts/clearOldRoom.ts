// This script will be run manually to clear the old room
// Run this in the bot context

import { deletePokerRoom } from '../actions/games/poker/services/pokerService';
import { RoomId } from '../actions/games/poker/types';

async function clearOldRoom(): Promise<void> {
  try {
    const oldRoomId = 'room_1754095606992_4xn';
    console.log(`🗑️ Deleting old room: ${oldRoomId}`);
    
    await deletePokerRoom(oldRoomId as RoomId);
    
    console.log('✅ Old room deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting old room:', error);
  }
}

// Export for manual execution
export { clearOldRoom }; 