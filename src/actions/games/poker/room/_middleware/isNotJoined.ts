import { HandlerContext } from '@/modules/core/handler';
import { Middleware } from '@/modules/core/middleware';
import { validateUser } from '@/actions/games/poker/_utils/validateUser';
import { getRoomId } from '@/actions/games/poker/_utils/getRoomId';
import { getPokerRoom } from '../../services/pokerService';
import { RoomId, PlayerId } from '../../types';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Middleware to check if user is NOT already joined in the current room
 * Used for join actions to prevent double-joining
 */
export const isNotJoined: Middleware = async (ctx: HandlerContext, query: Record<string, string>, next: () => Promise<void>) => {
  logFunctionStart('isNotJoined', { query });
  
  try {
    const user = validateUser(ctx);
    const roomId = getRoomId(query);
    
    console.log(`Validating user ${user.id} is not already joined in room ${roomId}`);
    
    // Check if user is already joined
    const isUserJoined = await validateUserJoined(user.id as PlayerId, roomId as RoomId);
    
    if (isUserJoined) {
      throw new Error('شما قبلاً عضو این روم هستید');
    }
    
    logFunctionEnd('isNotJoined', {}, { userId: user.id, roomId });
    await next();
  } catch (error) {
    logError('isNotJoined', error as Error, { query });
    // Re-throw the error to stop middleware chain
    throw error;
  }
};

/**
 * Validate if user is joined in the specified room
 */
async function validateUserJoined(userId: PlayerId, roomId: RoomId): Promise<boolean> {
  logFunctionStart('validateUserJoined', { userId, roomId });
  
  try {
    // Fetch the room from database
    const room = await getPokerRoom(roomId);
    
    if (!room) {
      logFunctionEnd('validateUserJoined', false, { userId, roomId });
      return false;
    }
    
    // Check if user is in the room's player list
    const isJoined = room.players.some(player => player.id === userId);
    
    logFunctionEnd('validateUserJoined', isJoined, { userId, roomId });
    return isJoined;
  } catch (error) {
    logError('validateUserJoined', error as Error, { userId, roomId });
    return false;
  }
} 