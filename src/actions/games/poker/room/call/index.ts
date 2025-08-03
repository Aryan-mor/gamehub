import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { generateGameActionKeyboard } from '../../buttonHelpers';
import { processBettingAction, getGameStateDisplay } from '../../services/gameStateService';
import { validateRoomId, validatePlayerId } from '../../_utils/typeGuards';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.call';

/**
 * Handle Poker call action
 */
async function handleCall(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { user, ctx } = context;
  const { roomId } = query;
  
  console.log(`Processing call action for room ${roomId}`);

  try {
    // Validate IDs
    const validatedRoomId = validateRoomId(roomId);
    const validatedPlayerId = validatePlayerId(user.id.toString());
    
    // Process the call action
    const updatedRoom = await processBettingAction(validatedRoomId, validatedPlayerId, 'call');
    
    // Get updated game state
    const gameStateMessage = getGameStateDisplay(updatedRoom, validatedPlayerId);
    
    // Add action confirmation
    const actionMessage = `\n🃏 <b>You called!</b>\n\n`;
    
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
    console.error('Call action error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await tryEditMessageText(ctx, `❌ Failed to call: ${errorMessage}`);
  }
}

export default handleCall; 