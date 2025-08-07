import { HandlerContext } from '@/modules/core/handler';
// Use ctx.poker.generateMainMenuKeyboard() instead
import { createPokerRoom } from '../../services/pokerService';
import { validatePlayerId } from '../../_utils/typeGuards';
import { CreateRoomRequest } from '../../types';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.newgame';

/**
 * Handle new game action in a poker room
 */
async function handleNewGame(context: HandlerContext): Promise<void> {
  const { user, ctx } = context;
  
  try {
    // Validate user ID
    const validatedPlayerId = validatePlayerId(user.id.toString());
    
    // Create display name from first_name + last_name for privacy
    let displayName = 'Player';
    if (ctx.from?.first_name) {
      displayName = ctx.from.first_name;
      if (ctx.from.last_name) {
        displayName += ` ${ctx.from.last_name}`;
      }
    } else if (user.username) {
      displayName = user.username;
    }
    
    // Create a new room with default settings
    const roomRequest: CreateRoomRequest = {
      name: `Poker Room by ${displayName}`,
      isPrivate: false,
      maxPlayers: 2,
      smallBlind: 5,
      turnTimeoutSec: 60
    };
    
    // Create the new room
    const newRoom = await createPokerRoom(
      roomRequest,
      validatedPlayerId,
      displayName,
      user.username
    );
    
    const message = `🆕 <b>New Room Created!</b>\n\n` +
      `✅ New poker room is ready for players!\n\n` +
      `🎯 <b>Room Details:</b>\n` +
      `• Room ID: <code>${newRoom.id}</code>\n` +
      `• Name: ${newRoom.name}\n` +
      `• Creator: ${displayName}\n` +
      `• Status: Waiting for players\n` +
      `• Players: ${newRoom.players.length}/${newRoom.maxPlayers}\n` +
      `• Blinds: ${newRoom.smallBlind}/${newRoom.bigBlind} coins\n\n` +
      `📊 <b>Next Steps:</b>\n` +
      `• Share room ID with friends\n` +
      `• Wait for players to join\n` +
      `• Start game when ready\n\n` +
      `🎮 <b>Available Actions:</b>\n` +
      `Choose what you'd like to do:`;
    
    const keyboard = ctx.poker.generateMainMenuKeyboard();
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('New game action error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(`❌ Failed to create new room: ${errorMessage}`);
  }
}

export default handleNewGame; 