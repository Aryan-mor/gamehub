import { HandlerContext } from '@/modules/core/handler';
import { Middleware } from '@/modules/core/middleware';
import { validateUser } from '../../utils/validateUser';
import { getRoomId } from '../../utils/getRoomId';

/**
 * Middleware to check if user is NOT already joined in the current room
 * Used for join actions to prevent double-joining
 */
export const isNotJoined: Middleware = async (ctx: HandlerContext, query: Record<string, string>, next: () => Promise<void>) => {
  try {
    const user = validateUser(ctx);
    const roomId = getRoomId(query);
    
    console.log(`Validating user ${user.id} is not already joined in room ${roomId}`);
    
    // Simulate validation - replace with actual room membership check
    const isUserJoined = await validateUserJoined(user.id, roomId);
    
    if (isUserJoined) {
      throw new Error('You are already a member of this room');
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
  
  console.log(`Checking if user ${userId} is already joined in room ${roomId}`);
  
  // For now, return false to allow joining
  // Replace this with actual validation logic
  return false;
} 