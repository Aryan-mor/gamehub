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
export const key = 'games.poker.room.call';

/**
 * Handle Poker call action
 */
async function handleCall(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { user, ctx } = context;
  const { roomId, r } = query;
  const roomIdParam = roomId || r;
  
  console.log(`Processing call action for room ${roomIdParam}`);

  try {
    // Validate IDs
    const validatedRoomId = validateRoomIdWithError(roomIdParam);
    const validatedPlayerId = validatePlayerIdWithError(user.id.toString());
    
    // Process the call action
    const updatedRoom = await processBettingAction(validatedRoomId, validatedPlayerId, 'call');
    
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
    console.error('Call action error:', error);
    
    const errorMessage = createUserFriendlyError(error as Error);
    await ctx.replySmart(`❌ Failed to call: ${errorMessage}`);
  }
}

// Self-register with compact router
register(POKER_ACTIONS.CALL, handleCall, 'Call');

export default handleCall; 