import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { generateGameActionKeyboard, generateRaiseAmountKeyboard, generateGameEndKeyboard } from '../../buttonHelpers';
import { getGameStateDisplay } from '../../services/gameStateService';
import { getPokerRoom } from '../../services/pokerService';
import { validateRoomId, validatePlayerId } from '../../_utils/typeGuards';

/**
 * Handle Poker game action - shows current game state and available actions
 */
async function handleGame(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { user, ctx } = context;
  const { roomId } = query;
  
  console.log(`Showing game state for room ${roomId}`);
  
  try {
    // Validate IDs
    const validatedRoomId = validateRoomId(roomId);
    const validatedPlayerId = validatePlayerId(user.id.toString());
    
    // Get current room state
    const room = await getPokerRoom(validatedRoomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Get game state display
    const gameStateMessage = getGameStateDisplay(room, validatedPlayerId);
    
    // Check if it's the player's turn (only for active games)
    let turnMessage = '';
    let isCurrentPlayerTurn = false;
    
    if (room.status === 'playing') {
      const currentPlayer = room.players[room.currentPlayerIndex];
      isCurrentPlayerTurn = currentPlayer.id === validatedPlayerId;
      
      turnMessage = isCurrentPlayerTurn 
        ? `\n🎯 <b>It's your turn!</b> Choose your action:`
                 // Use display name (first_name + last_name) instead of username for privacy
         const displayName = currentPlayer.name || currentPlayer.username || 'Unknown Player';
         
         turnMessage = isCurrentPlayerTurn 
           ? `\n🎯 <b>It's your turn!</b> Choose your action:`
           : `\n⏳ <b>Waiting for ${displayName}...</b>`;
    }
    
    const message = gameStateMessage + turnMessage;
    
    // Generate appropriate keyboard based on game status
    let keyboard;
    if (room.status === 'finished') {
      // Game is finished - show game end options
      keyboard = generateGameEndKeyboard(roomId);
    } else if (room.status === 'playing' && isCurrentPlayerTurn) {
      // Player can act - show game actions
      const player = room.players.find(p => p.id === validatedPlayerId);
      if (player) {
        const canCheck = player.betAmount >= room.currentBet;
        const canRaise = player.chips > 0 && !player.isAllIn;
        
        if (canRaise) {
          // Show raise options
          keyboard = generateRaiseAmountKeyboard(roomId);
        } else {
          // Show basic game actions
          keyboard = generateGameActionKeyboard(roomId, false);
        }
      } else {
        keyboard = generateGameActionKeyboard(roomId, false);
      }
    } else {
      // Not player's turn - show view-only keyboard
      keyboard = generateGameActionKeyboard(roomId, true);
    }
    
    await tryEditMessageText(ctx, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Game state error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await tryEditMessageText(ctx, `❌ Failed to show game state: ${errorMessage}`);
  }
}

export default handleGame; 