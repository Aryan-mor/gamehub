import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { generateRaiseAmountKeyboard, generateGameActionKeyboard } from '../../buttonHelpers';
import { processBettingAction, getGameStateDisplay } from '../../services/gameStateService';
import { getPokerRoom } from '../../services/pokerService';
import { validateRoomId, validatePlayerId } from '../../_utils/typeGuards';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.raise';

/**
 * Handle Poker raise action
 */
async function handleRaise(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { user, ctx } = context;
  const { roomId, amount } = query;
  
  if (!roomId) {
    throw new Error('Room ID is required');
  }
  
  if (!amount) {
    // Show raise amount selection if no amount provided
    await showRaiseAmountSelection(context, roomId);
    return;
  }
  
  console.log(`Processing raise action for room ${roomId} with amount ${amount}`);
  
  try {
    // Validate IDs
    const validatedRoomId = validateRoomId(roomId);
    const validatedPlayerId = validatePlayerId(user.id.toString());
    const raiseAmount = parseInt(amount);
    
    if (isNaN(raiseAmount) || raiseAmount <= 0) {
      throw new Error('Invalid raise amount');
    }
    
    // Process the raise action
    const updatedRoom = await processBettingAction(validatedRoomId, validatedPlayerId, 'raise', raiseAmount);
    
    // Get updated game state
    const gameStateMessage = getGameStateDisplay(updatedRoom, validatedPlayerId);
    
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
    const keyboard = generateGameActionKeyboard(updatedRoom.id, !isCurrentPlayerTurn);

    await tryEditMessageText(ctx, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Raise action error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await tryEditMessageText(ctx, `❌ Failed to raise: ${errorMessage}`);
  }
}

/**
 * Show raise amount selection keyboard
 */
async function showRaiseAmountSelection(context: HandlerContext, roomId: string): Promise<void> {
  const { ctx } = context;
  
  try {
    const validatedRoomId = validateRoomId(roomId);
    const room = await getPokerRoom(validatedRoomId);
    
    if (!room) {
      throw new Error('Room not found');
    }
    
    const message = `💰 <b>Select Raise Amount</b>\n\n` +
      `🏠 Room: <code>${room.id}</code>\n` +
      `🎯 Current Bet: ${room.currentBet} coins\n` +
      `📈 Minimum Raise: ${room.minRaise} coins\n\n` +
      `💡 Choose your raise amount:`;
    
    const keyboard = generateRaiseAmountKeyboard(roomId);
    
    await tryEditMessageText(ctx, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Raise amount selection error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await tryEditMessageText(ctx, `❌ Failed to show raise options: ${errorMessage}`);
  }
}

export default handleRaise; 