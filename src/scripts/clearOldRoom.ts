// This script will be run manually to clear the old room
// Run this in the bot context

import { deletePokerRoom } from '../actions/games/poker/services/pokerService';
import { RoomId } from '../actions/games/poker/types';
import { logger } from '@/modules/core/logger';

async function clearOldRoom(): Promise<void> {
  try {
    const oldRoomId = 'room_1754095606992_4xn';
    logger.info(`🗑️ Deleting old room: ${oldRoomId}`);
    
    await deletePokerRoom(oldRoomId as RoomId);
    
    logger.info('✅ Old room deleted successfully');
  } catch (error) {
    logger.error({ err: error }, '❌ Error deleting old room:');
  }
}

// Export for manual execution
export { clearOldRoom }; 