import { api } from '@/lib/api';
import { logger } from '@/modules/core/logger';

async function clearAllRooms(): Promise<void> {
  try {
    logger.info('🗑️ Clearing all poker rooms...');
    
    const rooms = await api.rooms.getByGameType('poker');
    
    if (!rooms || rooms.length === 0) {
      logger.info('✅ No rooms found');
      return;
    }
    
    logger.info(`📊 Found ${rooms.length} rooms to delete:`);
    
    for (const room of rooms as Array<Record<string, any>>) {
      logger.info(`🗑️ Deleting room: ${room.id}`);
      logger.info(`   - Name: ${room.name}`);
      logger.info(`   - Status: ${room.status}`);
      logger.info(`   - Max Players: ${room.max_players}`);
      
      try {
        await api.rooms.delete(room.id as string);
        logger.info(`✅ Deleted: ${room.id}`);
      } catch (deleteError) {
        logger.error({ err: deleteError }, `❌ Error deleting room ${room.id}:`);
      }
    }
    
    logger.info(`🎉 Successfully deleted ${rooms.length} rooms`);
    
  } catch (error) {
    logger.error({ err: error }, '❌ Error clearing rooms:');
  }
}

// Run the script
clearAllRooms().then(() => {
  logger.info('🎉 Script completed');
  process.exit(0);
}).catch((error) => {
  logger.error({ err: error }, '❌ Script failed:');
  process.exit(1);
});