// This script will be run manually to clear the old room
// Run this in the bot context

// Archived dependencies removed; script disabled in new stories
// import { deletePokerRoom } from '../actions/games/poker/services/pokerService';
// import { RoomId } from '../actions/games/poker/types';
import { logger } from '@/modules/core/logger';

async function clearOldRoom(): Promise<void> {
  try {
    logger.info('clearOldRoom is disabled; legacy poker service archived.');
  } catch (error) {
    logger.error({ err: error }, '❌ Error in clearOldRoom:');
  }
}

// Export for manual execution
export { clearOldRoom }; 