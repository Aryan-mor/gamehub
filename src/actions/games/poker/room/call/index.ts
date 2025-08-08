import { HandlerContext, createHandler } from '@/modules/core/handler';
import { processBettingAction } from '../../_utils/pokerUtils';
import { validateQueryParams, translatePokerError } from '../../_utils/validators';
import { getGameStateForUser } from '../../_utils/roomInfoHelper';
import PokerKeyboardService from '../../services/pokerKeyboardService';
import { updateAllPlayersInRoom } from '../../services/playerNotificationService';
import { PlayerId, RoomId } from '../../types';
import { bot } from '@/bot';
import type { Bot } from 'grammy';
import type { Context } from 'grammy';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.call';

/**
 * Handle Poker call action
 */
async function handleCall(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { user, ctx } = context;
  const { roomId: validatedRoomId, playerId: validatedPlayerId } = validateQueryParams(query, {
    requireRoomId: true,
    includePlayerIdFrom: user.id,
  });
  
  ctx.log.info('Processing call action', { roomId: validatedRoomId, userId: user.id });

  try {
    if (!validatedRoomId || !validatedPlayerId) {
      throw new Error('Invalid parameters');
    }
    const roomId: RoomId = validatedRoomId as RoomId;
    const playerId: PlayerId = validatedPlayerId as PlayerId;

    // Process the call action
    const updatedRoom = await processBettingAction(roomId, playerId, 'call');
    
    // Check if this player is still the current player
    const isCurrentPlayer = updatedRoom.players[updatedRoom.currentPlayerIndex].id === playerId;
    
    // Generate updated game state display
    const gameStateDisplay = getGameStateForUser(updatedRoom, playerId, ctx);
    const keyboard = PokerKeyboardService.gameAction(updatedRoom, playerId, isCurrentPlayer, ctx);
    
    // Update the message for the current player
    await ctx.replySmart(gameStateDisplay, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
    // Update messages for all other players
    await updateAllPlayersInRoom(bot as unknown as Bot<Context>, updatedRoom, playerId);
    
  } catch (error) {
    ctx.log.error('Call action error', { error: error instanceof Error ? error.message : String(error) });
    const message = translatePokerError(ctx, error, 'poker.error.call');
    await ctx.replySmart(message);
  }
}

export default createHandler(handleCall);