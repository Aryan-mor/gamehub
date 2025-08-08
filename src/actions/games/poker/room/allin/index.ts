import { HandlerContext, createHandler } from '@/modules/core/handler';
import {
  validateRoomIdWithError,
  validatePlayerIdWithError,
  processBettingAction
} from '../../_utils/pokerUtils';
import { getGameStateForUser } from '../../_utils/roomInfoHelper';
import PokerKeyboardService from '../../services/pokerKeyboardService';
import { StartQuerySchema } from '../../_utils/schemas';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.allin';

/**
 * Handle all-in action in a poker game
 */
async function handleAllIn(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { roomId } = StartQuerySchema.parse(query);
  
  try {
    // Validate IDs
    const validatedRoomId = validateRoomIdWithError(roomId);
    const validatedPlayerId = validatePlayerIdWithError(user.id.toString());
    
    // Process the all-in action
    const updatedRoom = await processBettingAction(validatedRoomId, validatedPlayerId, 'all-in');
    
    // Generate updated game state display
    const gameStateDisplay = getGameStateForUser(updatedRoom, validatedPlayerId, ctx);
    const keyboard = PokerKeyboardService.gameAction(updatedRoom, validatedPlayerId, false, ctx);
    
    // Update the message
    await ctx.replySmart(gameStateDisplay, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    ctx.log.error('All-in action error', { error: error instanceof Error ? error.message : String(error) });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(ctx.t('poker.error.allin', { error: errorMessage }));
  }
}

export default createHandler(handleAllIn); 