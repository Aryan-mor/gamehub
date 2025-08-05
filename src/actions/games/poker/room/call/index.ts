import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { 
  validateRoomIdWithError,
  validatePlayerIdWithError,
  processBettingAction,
  getGameStateDisplay,
  generateGameActionKeyboard
} from '../../_utils/pokerUtils';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.call';

/**
 * Handle Poker call action
 */
async function handleCall(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { user, ctx } = context;
  const { roomId } = query;
  
  console.log(`Processing call action for room ${roomId}`);

  try {
    // Validate IDs
    const validatedRoomId = validateRoomIdWithError(roomId);
    const validatedPlayerId = validatePlayerIdWithError(user.id.toString());
    
    // Process the call action
    const updatedRoom = await processBettingAction(validatedRoomId, validatedPlayerId, 'call');
    
    // Generate updated game state display
    const gameStateDisplay = getGameStateDisplay(updatedRoom, validatedPlayerId);
    const keyboard = generateGameActionKeyboard(updatedRoom, validatedPlayerId, false);
    
    // Update the message
    await tryEditMessageText(ctx, gameStateDisplay, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Call action error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await tryEditMessageText(ctx, `❌ Failed to call: ${errorMessage}`);
  }
}

export default handleCall; 