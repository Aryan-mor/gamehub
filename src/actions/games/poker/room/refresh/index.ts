import { HandlerContext } from '@/modules/core/handler';
import { 
  validateRoomIdWithError,
  validatePlayerIdWithError,
  getPokerRoom,
  getGameStateDisplay,
  generateGameActionKeyboard,
  createUserFriendlyError,
  register,
  POKER_ACTIONS
} from '../../_utils/pokerUtils';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.refresh';

/**
 * Handle refresh game action
 */
async function handleRefresh(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
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
    
    // Get current room state
    const room = await getPokerRoom(validatedRoomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Check if this player is the current player
    const isCurrentPlayer = room.players[room.currentPlayerIndex].id === validatedPlayerId;
    
    // Generate updated game state display
    const gameStateDisplay = getGameStateDisplay(room, validatedPlayerId);
    const keyboard = generateGameActionKeyboard(room, validatedPlayerId, isCurrentPlayer);
    
    // Update the message
    await ctx.replySmart(gameStateDisplay, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Refresh action error:', error);
    
    const errorMessage = createUserFriendlyError(error as Error);
    await ctx.replySmart(`❌ Failed to refresh: ${errorMessage}`);
  }
}

// Self-register with compact router
register(POKER_ACTIONS.REFRESH_GAME, handleRefresh, 'Refresh Game');

export default handleRefresh; 