import { HandlerContext } from '@/modules/core/handler';
// Use ctx.poker.generateGameEndKeyboard() instead
import { getHandHistory } from '../../services/gameResultService';
import { getPokerRoom } from '../../services/pokerService';
import { validateRoomId } from '../../_utils/typeGuards';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.history';

/**
 * Handle hand history display for finished games
 */
async function handleHistory(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { ctx } = context;
  const { roomId } = query;
  
  if (!roomId) {
    throw new Error('Room ID is required');
  }
  
  try {
    // Validate IDs
    const validatedRoomId = validateRoomId(roomId);
    
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
    const keyboard = ctx.poker.generateGameEndKeyboard(roomId);
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Hand history display error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(`❌ Failed to show hand history: ${errorMessage}`);
  }
}

export default handleHistory; 