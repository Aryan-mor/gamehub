import { HandlerContext } from '@/modules/core/handler';

// Use plugin system for keyboard generation
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
      keyboard = ctx.poker.generateGameEndKeyboard(roomId);
    } else if (room.status === 'playing' && isCurrentPlayerTurn) {
      // Player can act - show game actions
      const player = room.players.find(p => p.id === validatedPlayerId);
      if (player) {
        const canRaise = player.chips > 0 && !player.isAllIn;
        
        if (canRaise) {
          // Show raise options
          keyboard = ctx.poker.generateRaiseAmountKeyboard(roomId);
        } else {
          // Show basic game actions
          keyboard = ctx.poker.generateGameActionKeyboard(roomId, false);
        }
      } else {
        keyboard = ctx.poker.generateGameActionKeyboard(roomId, false);
      }
    } else {
      // Not player's turn - show view-only keyboard
      keyboard = ctx.poker.generateGameActionKeyboard(roomId, true);
    }
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Game state error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(`❌ Failed to show game state: ${errorMessage}`);
  }
}

export default handleGame; 