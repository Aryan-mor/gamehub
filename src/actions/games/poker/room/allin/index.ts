import { HandlerContext } from '@/modules/core/handler';
import { 
  validateRoomIdWithError,
  validatePlayerIdWithError,
  processBettingAction,
  getGameStateDisplay,
  generateGameActionKeyboard
} from '../../_utils/pokerUtils';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.allin';

/**
 * Handle all-in action in a poker game
 */
async function handleAllIn(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { roomId } = query;
  
  if (!roomId) {
    throw new Error('Room ID is required');
  }
  
  try {
    // Validate IDs
    const validatedRoomId = validateRoomIdWithError(roomId);
    const validatedPlayerId = validatePlayerIdWithError(user.id.toString());
    
    // Process the all-in action
    const updatedRoom = await processBettingAction(validatedRoomId, validatedPlayerId, 'all-in');
    
    // Generate updated game state display
    const gameStateDisplay = getGameStateDisplay(updatedRoom, validatedPlayerId);
    const keyboard = generateGameActionKeyboard(updatedRoom, validatedPlayerId, false);
    
    // Update the message
    await ctx.replySmart(gameStateDisplay, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('All-in action error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(`❌ Failed to go all-in: ${errorMessage}`);
  }
}

export default handleAllIn; 