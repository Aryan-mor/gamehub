import { HandlerContext, createHandler } from '@/modules/core/handler';
import { 
  validateRoomIdWithError,
  validatePlayerIdWithError,
  processBettingAction,
  createUserFriendlyError
} from '../../_utils/pokerUtils';
import { getGameStateForUser } from '../../_utils/roomInfoHelper';
import PokerKeyboardService from '../../services/pokerKeyboardService';
import { updateAllPlayersInRoom } from '../../services/playerNotificationService';
import { bot } from '@/bot';
import type { Bot } from 'grammy';
import type { Context } from 'grammy';
import { PlayerId } from '../../types';

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
    const gameStateDisplay = getGameStateForUser(updatedRoom, validatedPlayerId, ctx);
    const keyboard = PokerKeyboardService.gameAction(updatedRoom, validatedPlayerId, isCurrentPlayer, ctx);
    
    // Update the message for the current player
    await ctx.replySmart(gameStateDisplay, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
    // Update messages for all other players
    await updateAllPlayersInRoom(bot as unknown as Bot<Context>, updatedRoom, validatedPlayerId as PlayerId);
    
  } catch (error) {
    context.ctx.log.error('Fold action error', { error: error instanceof Error ? error.message : String(error) });
    
    const errorMessage = createUserFriendlyError(error as Error);
    await ctx.replySmart(ctx.t('poker.error.fold', { error: errorMessage }));
  }
}

export default createHandler(handleFold);