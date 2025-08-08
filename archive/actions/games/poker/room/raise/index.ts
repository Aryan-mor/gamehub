import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getPokerRoom } from '../../_utils/pokerUtils';
import { translatePokerError } from '../../_utils/validators';
import { RaiseQuerySchema } from '../../_utils/schemas';
import { validatePlayerIdWithError, validateRoomIdWithError } from '../../_utils/pokerUtils';
import { getGameStateForUser } from '../../_utils/roomInfoHelper';
import PokerKeyboardService from '../../services/pokerKeyboardService';
// Use ctx.poker.generateRaiseAmountKeyboard() instead
import { processBettingAction } from '../../services/gameStateService';
import { } from '../../services/pokerService';
import { } from '../../_utils/typeGuards';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.raise';

/**
 * Handle Poker raise action
 */
async function handleRaise(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { user, ctx } = context;
  const { roomId, amount } = RaiseQuerySchema.parse(query);
  const playerId = validatePlayerIdWithError(String(user.id));
  
  if (amount === undefined || amount === null) {
    // Show raise amount selection if no amount provided
    if (!roomId) {
      throw new Error('Invalid parameters');
    }
    await showRaiseAmountSelection(context, validateRoomIdWithError(roomId));
    return;
  }
  
  ctx.log.info('Processing raise action', { roomId, amount, userId: user.id });
  
  try {
    if (!roomId || !playerId || amount === undefined) {
      throw new Error('Invalid parameters');
    }
    const validatedRoomId = validateRoomIdWithError(roomId);
    const validatedPlayerId = playerId;
    const raiseAmount = amount;
    
    if (isNaN(raiseAmount) || raiseAmount <= 0) {
      throw new Error('Invalid raise amount');
    }
    
    // Process the raise action
    const updatedRoom = await processBettingAction(validatedRoomId, validatedPlayerId, 'raise', raiseAmount);
    
    // Get updated game state
    const gameStateMessage = getGameStateForUser(updatedRoom, validatedPlayerId, ctx);
    
    // Add action confirmation
    const actionMessage = `\n💰 <b>You raised to ${raiseAmount} coins!</b>\n\n`;
    
    // Check if it's still the player's turn
    const currentPlayer = updatedRoom.players[updatedRoom.currentPlayerIndex];
    const isCurrentPlayerTurn = currentPlayer.id === validatedPlayerId;
    
    // Use display name (first_name + last_name) instead of username for privacy
    const displayName = currentPlayer.name || currentPlayer.username || 'Unknown Player';
    
    const turnMessage = isCurrentPlayerTurn 
      ? `\n🎯 <b>It's still your turn!</b> Choose your action:`
      : `\n⏳ <b>Waiting for ${displayName}...</b>`;
    
    const message = gameStateMessage + actionMessage + turnMessage;
    
    // Generate appropriate keyboard
    const keyboard = PokerKeyboardService.gameAction(updatedRoom, validatedPlayerId, isCurrentPlayerTurn, ctx);

    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    ctx.log.error('Raise action error', { error: error instanceof Error ? error.message : String(error) });
    const message = translatePokerError(ctx, error, 'poker.error.raise');
    await ctx.replySmart(message, {
      parse_mode: 'HTML'
    });
  }
}

/**
 * Show raise amount selection keyboard
 */
async function showRaiseAmountSelection(context: HandlerContext, roomId: import('../../types').RoomId): Promise<void> {
  const { ctx } = context;
  
  try {
    const room = await getPokerRoom(roomId);
    
    if (!room) {
      throw new Error('Room not found');
    }
    
    const message = `💰 <b>Select Raise Amount</b>\n\n` +
      `🏠 Room: <code>${room.id}</code>\n` +
      `🎯 Current Bet: ${room.currentBet} coins\n` +
      `📈 Minimum Raise: ${room.minRaise} coins\n\n` +
      `💡 Choose your raise amount:`;
    
    const keyboard = ctx.poker.generateRaiseAmountKeyboard(roomId);
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    ctx.log.error('Raise amount selection error', { error: error instanceof Error ? error.message : String(error) });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(ctx.t('poker.error.raiseOptions', { error: errorMessage }), {
      parse_mode: 'HTML'
    });
  }
}

export default createHandler(handleRaise); 