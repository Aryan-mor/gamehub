import { HandlerContext, createHandler } from '@/modules/core/handler';
import { 
  validateRoomIdWithError,
  validatePlayerIdWithError,
  getPokerRoom,
  createUserFriendlyError
} from '../../_utils/pokerUtils';
import { getGameStateForUser } from '../../_utils/roomInfoHelper';
import PokerKeyboardService from '../../services/pokerKeyboardService';

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
    const gameStateDisplay = getGameStateForUser(room, validatedPlayerId, ctx);
    const keyboard = PokerKeyboardService.gameAction(room, validatedPlayerId, isCurrentPlayer, ctx);
    
    // Update the message
    await ctx.replySmart(gameStateDisplay, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    ctx.log.error('Refresh action error', { error: error instanceof Error ? error.message : String(error) });
    
    const errorMessage = createUserFriendlyError(error as Error);
    await ctx.replySmart(ctx.t('poker.error.refresh', { error: errorMessage }));
  }
}

export default createHandler(handleRefresh);