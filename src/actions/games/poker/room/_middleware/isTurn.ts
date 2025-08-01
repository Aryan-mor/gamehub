import { HandlerContext } from '@/modules/core/handler';
import { Middleware } from '@/modules/core/middleware';
import { validateUser } from '../../utils/validateUser';
import { getRoomId } from '../../utils/getRoomId';

/**
 * Middleware to check if it's the user's turn in the current room
 */
export const isTurn: Middleware = async (ctx: HandlerContext, query: Record<string, string>, next: () => Promise<void>) => {
  try {
    const user = validateUser(ctx);
    const roomId = getRoomId(query);
    
    // TODO: Implement actual turn validation
    // This would typically involve:
    // 1. Fetching the current game state from database/cache
    // 2. Checking if the game is active
    // 3. Verifying it's the user's turn
    // 4. Validating game phase (betting, etc.)
    
    console.log(`Validating if it's user ${user.id}'s turn in room ${roomId}`);
    
    // Simulate validation - replace with actual turn check
    const isUserTurn = await validateUserTurn(user.id, roomId);
    
    if (!isUserTurn) {
      throw new Error('It is not your turn to perform this action');
    }
    
    await next();
  } catch (error) {
    // Re-throw the error to stop middleware chain
    throw error;
  }
};

/**
 * Validate if it's the user's turn in the specified room
 * TODO: Replace with actual implementation
 */
async function validateUserTurn(userId: string, roomId: string): Promise<boolean> {
  // TODO: Implement actual turn validation
  // This is a placeholder implementation
  // In reality, you would:
  // 1. Query your database/cache for the current game state
  // 2. Check if the game is active and in betting phase
  // 3. Verify that userId matches the current player's turn
  // 4. Check if the user has already acted in this round
  
  console.log(`Checking if it's user ${userId}'s turn in room ${roomId}`);
  
  // For now, return true to allow the action
  // Replace this with actual turn validation logic
  return true;
} 