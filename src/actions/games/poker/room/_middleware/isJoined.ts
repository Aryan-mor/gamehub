import { HandlerContext } from '@/modules/core/handler';
import { Middleware } from '@/modules/core/middleware';
import { validateUser } from '../../utils/validateUser';
import { getRoomId } from '../../utils/getRoomId';

/**
 * Middleware to check if user is joined in the current room
 */
export const isJoined: Middleware = async (ctx: HandlerContext, query: Record<string, string>, next: () => Promise<void>) => {
  try {
    const user = validateUser(ctx);
    const roomId = getRoomId(query);
    
    // TODO: Implement actual room membership check
    // This would typically involve:
    // 1. Fetching the room from database/cache
    // 2. Checking if user is in the room's player list
    // 3. Validating room state (active, not finished, etc.)
    
    // For now, we'll simulate the check
    // In a real implementation, you would do something like:
    // const room = await getRoom(roomId);
    // if (!room || !room.players.includes(user.id)) {
    //   throw new Error('You are not a member of this room');
    // }
    
    console.log(`Validating user ${user.id} is joined in room ${roomId}`);
    
    // Simulate validation - replace with actual room membership check
    const isUserJoined = await validateUserJoined(user.id, roomId);
    
    if (!isUserJoined) {
      throw new Error('You must be a member of this room to perform this action');
    }
    
    await next();
  } catch (error) {
    // Re-throw the error to stop middleware chain
    throw error;
  }
};

/**
 * Validate if user is joined in the specified room
 * TODO: Replace with actual implementation
 */
async function validateUserJoined(userId: string, roomId: string): Promise<boolean> {
  // TODO: Implement actual room membership validation
  // This is a placeholder implementation
  // In reality, you would:
  // 1. Query your database/cache for the room
  // 2. Check if userId is in the room's players array
  // 3. Verify room is active and not finished
  
  console.log(`Checking if user ${userId} is joined in room ${roomId}`);
  
  // For now, return true to allow the action
  // Replace this with actual validation logic
  return true;
} 