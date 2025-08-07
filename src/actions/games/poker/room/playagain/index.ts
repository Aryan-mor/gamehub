import { HandlerContext } from '@/modules/core/handler';
import { 
  validateRoomIdWithError,
  validatePlayerIdWithError,
  getPokerRoom,
  getGameStateDisplay,
  generateRoomManagementKeyboard
} from '../../_utils/pokerUtils';
import { } from '../../buttonHelpers';
import { startPokerGame, } from '../../services/gameStateService';
import { } from '../../services/pokerService';
import { } from '../../_utils/typeGuards';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.playagain';

/**
 * Handle play again action in a poker game
 */
async function handlePlayAgain(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { roomId } = query;
  
  if (!roomId) {
    throw new Error('Room ID is required');
  }
  
  try {
    // Validate IDs
    const validatedRoomId = validateRoomIdWithError(roomId);
    const validatedPlayerId = validatePlayerIdWithError(user.id.toString());
    
    // Get current room state
    const currentRoom = await getPokerRoom(validatedRoomId);
    if (!currentRoom) {
      throw new Error('Room not found');
    }
    
    // Check if game is finished
    if (currentRoom.status !== 'finished') {
      throw new Error('Game is not finished yet');
    }
    
    // Check if player is the room creator or has permission
    if (currentRoom.createdBy !== validatedPlayerId) {
      throw new Error('Only the room creator can start a new game');
    }
    
    // Reset room for new game (room will be reset by startPokerGame)
    // No need to manually reset here as startPokerGame handles it
    
    // Start new game
    const newGame = await startPokerGame(validatedRoomId);
    
    // Get game state display for the current player
    const gameStateMessage = getGameStateDisplay(newGame, validatedPlayerId);
    
    // Add new game confirmation
    const actionMessage = `\n🔄 <b>New Game Started!</b>\n\n`;
    
    // Check if it's the player's turn
    const currentPlayer = newGame.players[newGame.currentPlayerIndex];
    const isCurrentPlayerTurn = currentPlayer.id === validatedPlayerId;
    
    // Use display name (first_name + last_name) instead of username for privacy
    const displayName = currentPlayer.name || currentPlayer.username || 'Unknown Player';
    
    const turnMessage = isCurrentPlayerTurn 
      ? `\n🎯 <b>It's your turn!</b> Choose your action:`
      : `\n⏳ <b>Waiting for ${displayName}...</b>`;
    
    const message = gameStateMessage + actionMessage + turnMessage;
    
    // Generate appropriate keyboard
    const keyboard = generateRoomManagementKeyboard(newGame.id);
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Play again action error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(`❌ Failed to start new round: ${errorMessage}`);
  }
}

export default handlePlayAgain; 