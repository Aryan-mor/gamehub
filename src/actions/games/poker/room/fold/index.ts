import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { 
  validateRoomIdWithError,
  validatePlayerIdWithError,
  processBettingAction,
  getGameStateDisplay,
  generateGameActionKeyboard,
  createUserFriendlyError,
  register,
  POKER_ACTIONS
} from '../../_utils/pokerUtils';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.fold';

/**
 * Handle fold action in poker game
 */
async function handleFold(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { roomId, r } = query;
  const roomIdParam = roomId || r;
  
  if (!roomIdParam) {
    throw new Error('Room ID is required');
  }
  
  try {
    // Validate IDs
    const validatedRoomId = validateRoomIdWithError(roomIdParam);
    const validatedPlayerId = validatePlayerIdWithError(user.id.toString());
    
    // Process the fold action
    const updatedRoom = await processBettingAction(validatedRoomId, validatedPlayerId, 'fold');
    
    // Generate updated game state display
    const gameStateDisplay = getGameStateDisplay(updatedRoom, validatedPlayerId);
    const keyboard = generateGameActionKeyboard(updatedRoom, validatedPlayerId, false);
    
    // Update the message
    await tryEditMessageText(ctx, gameStateDisplay, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Fold action error:', error);
    
    const errorMessage = createUserFriendlyError(error as Error);
    await tryEditMessageText(ctx, `❌ Failed to fold: ${errorMessage}`);
  }
}

// Self-register with compact router
register(POKER_ACTIONS.FOLD, handleFold, 'Fold Hand');

export default handleFold; 