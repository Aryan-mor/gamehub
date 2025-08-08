import { api } from '@/lib/api';
import { logger } from '@/modules/core/logger';

async function clearOldRooms(): Promise<void> {
  try {
    logger.info('🔍 Searching for old rooms with maxPlayers: 8...');
    
    const rooms = await api.rooms.getByGameTypeAndMaxPlayers('poker', 8);
    
    if (!rooms || rooms.length === 0) {
      logger.info('✅ No rooms found');
      return;
    }
    
    let deletedCount = 0;
    
    for (const room of rooms) {
      logger.info(`🗑️ Deleting old room: ${room.room_id} (maxPlayers: ${room.max_players})`);
      try {
        await api.rooms.delete(room.room_id as string);
        deletedCount++;
      } catch (deleteError) {
        logger.error({ err: deleteError }, `❌ Error deleting room ${room.room_id}:`);
      }
    }
    
    logger.info(`✅ Deleted ${deletedCount} old rooms`);
  } catch (error) {
    logger.error({ err: error }, '❌ Error clearing old rooms:');
  }
}

// Run the script
clearOldRooms().then(() => {
  logger.info('🎉 Script completed');
  process.exit(0);
}).catch((error) => {
  logger.error({ err: error }, '❌ Script failed:');
  process.exit(1);
});