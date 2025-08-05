import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { generateGameEndKeyboard } from '../../buttonHelpers';
import { trackGameStatistics } from '../../services/gameResultService';
import { getPokerRoom } from '../../services/pokerService';
import { validateRoomId, validatePlayerId } from '../../_utils/typeGuards';
import { getGameResultDisplay } from '../../services/gameResultService';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.gameEnd';

/**
 * Handle game end display - shows final results and winner
 */
async function handleGameEnd(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
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
    
    // Track statistics for the player
    await trackGameStatistics(room, validatedPlayerId);
    
    // Get detailed game result display
    const gameResultMessage = getGameResultDisplay(room);
    
    // Add action options
    const actionMessage = `\n🎮 <b>What's Next?</b>\n` +
      `Choose your next action:`;
    
    const message = gameResultMessage + actionMessage;
    
    // Generate game end keyboard with options
    const keyboard = generateGameEndKeyboard(roomId);
    
    await tryEditMessageText(ctx, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Game end display error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await tryEditMessageText(ctx, `❌ Failed to show game results: ${errorMessage}`);
  }
}

export default handleGameEnd; 