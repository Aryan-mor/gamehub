import { HandlerContext } from '@/modules/core/handler';
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
import { updateAllPlayersInRoom } from '../../services/playerNotificationService';
import { bot } from '@/bot';

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
    
    // Check if this player is still the current player
    const isCurrentPlayer = updatedRoom.players[updatedRoom.currentPlayerIndex].id === validatedPlayerId;
    
    // Generate updated game state display
    const gameStateDisplay = getGameStateDisplay(updatedRoom, validatedPlayerId);
    const keyboard = generateGameActionKeyboard(updatedRoom, validatedPlayerId, isCurrentPlayer);
    
    // Update the message for the current player
    await ctx.replySmart(gameStateDisplay, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
    // Update messages for all other players
    await updateAllPlayersInRoom(bot, updatedRoom, validatedPlayerId);
    
  } catch (error) {
    console.error('Fold action error:', error);
    
    const errorMessage = createUserFriendlyError(error as Error);
    await ctx.replySmart(`❌ Failed to fold: ${errorMessage}`);
  }
}

// Self-register with compact router
register(POKER_ACTIONS.FOLD, handleFold, 'Fold Hand');

export default handleFold; 