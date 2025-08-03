import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { generateGameEndKeyboard } from '../../buttonHelpers';
import { getHandHistory, getGameSummary } from '../../services/gameResultService';
import { getPokerRoom } from '../../services/pokerService';
import { validateRoomId, validatePlayerId } from '../../_utils/typeGuards';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.history';

/**
 * Handle hand history display for finished games
 */
async function handleHistory(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { roomId } = query;
  
  if (!roomId) {
    throw new Error('Room ID is required');
  }
  
  try {
    // Validate IDs
    const validatedRoomId = validateRoomId(roomId);
    const validatedPlayerId = validatePlayerId(user.id.toString());
    
    // Get current room state
    const room = await getPokerRoom(validatedRoomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Check if game is finished
    if (room.status !== 'finished') {
      throw new Error('Game is not finished yet');
    }
    
    // Get detailed hand history
    const handHistoryMessage = getHandHistory(room);
    
    // Add navigation options
    const actionMessage = `\n📋 <b>Navigation:</b>\n` +
      `Choose what to view next:`;
    
    const message = handHistoryMessage + actionMessage;
    
    // Generate game end keyboard with options
    const keyboard = generateGameEndKeyboard(roomId);
    
    await tryEditMessageText(ctx, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Hand history display error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await tryEditMessageText(ctx, `❌ Failed to show hand history: ${errorMessage}`);
  }
}

export default handleHistory; 