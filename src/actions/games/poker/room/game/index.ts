import { HandlerContext, createHandler } from '@/modules/core/handler';

// Use plugin system for keyboard generation
import { getGameStateForUser } from '../../_utils/roomInfoHelper';
import { getPokerRoom } from '../../services/pokerService';
import { validateRoomId, validatePlayerId } from '../../_utils/typeGuards';

/**
 * Handle Poker game action - shows current game state and available actions
 */
async function handleGame(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { user, ctx } = context;
  const { roomId } = query;
  
  ctx.log.info('Showing game state', { roomId, userId: user.id });
  
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
    const gameStateMessage = getGameStateForUser(room, validatedPlayerId, ctx);
    
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
      // Game is finished - show basic navigation
      keyboard = ctx.poker.generateGameActionKeyboard(roomId, false);
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
    ctx.log.error('Game state error', { error: error instanceof Error ? error.message : String(error) });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(ctx.t('poker.error.gameState', { error: errorMessage }));
  }
}

export default createHandler(handleGame); 