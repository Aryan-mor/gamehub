import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { generateRoomManagementKeyboard } from '../../buttonHelpers';
import { startPokerGame, getGameStateDisplay } from '../../services/gameStateService';
import { getPokerRoom } from '../../services/pokerService';
import { validateRoomId, validatePlayerId } from '../../_utils/typeGuards';

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
    const validatedRoomId = validateRoomId(roomId);
    const validatedPlayerId = validatePlayerId(user.id.toString());
    
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
    
    // Reset room for new game
    const resetRoom = {
      ...currentRoom,
      status: 'waiting',
      players: currentRoom.players.map(player => ({
        ...player,
        cards: [],
        betAmount: 0,
        totalBet: 0,
        isFolded: false,
        isAllIn: false,
        isReady: false,
        lastAction: undefined
      })),
      deck: [],
      communityCards: [],
      pot: 0,
      currentBet: 0,
      minRaise: currentRoom.bigBlind,
      bettingRound: 'preflop',
      currentPlayerIndex: 0,
      dealerIndex: 0,
      smallBlindIndex: 0,
      bigBlindIndex: 0,
      startedAt: undefined,
      endedAt: undefined,
      updatedAt: Date.now()
    };
    
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
    
    await tryEditMessageText(ctx, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Play again action error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await tryEditMessageText(ctx, `❌ Failed to start new round: ${errorMessage}`);
  }
}

export default handlePlayAgain; 