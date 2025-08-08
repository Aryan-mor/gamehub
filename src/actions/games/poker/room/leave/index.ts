import { HandlerContext } from '@/modules/core/handler';
import { GameHubContext } from '@/plugins';
// Use ctx.poker.generateMainMenuKeyboard() instead
import { 
  validateRoomIdWithError,
  validatePlayerIdWithError,
  getPokerRoom
} from '../../_utils/pokerUtils';
import { leavePokerRoom } from '../../services/pokerService';
import { getPlayerMessage, removePlayerMessage, notifyPlayerLeft } from '../../services/roomMessageService';
import { handlePokerActiveUser } from '../../_engine/activeUser';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.leave';

/**
 * Handle Poker room leaving
 */
async function handleLeave(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { roomId, r } = query;
  const roomIdParam = roomId || r;
  
  ctx.log.info('LEAVE handler called', { userId: user.id, roomId: roomIdParam });
  ctx.log.debug('LEAVE handler debug', { query, roomIdParam, context: { userId: user.id, username: user.username, chatId: ctx.chat?.id } });

  try {
    // Validate IDs
    const validatedRoomId = validateRoomIdWithError(roomIdParam);
    const validatedPlayerId = validatePlayerIdWithError(user.id.toString());
    
    // Get current room state
    const currentRoom = await getPokerRoom(validatedRoomId);
    if (!currentRoom) {
      throw new Error('Room not found');
    }
    
    // Check if user is in the room
    const playerInRoom = currentRoom.players.find(p => p.id === validatedPlayerId);
    if (!playerInRoom) {
      throw new Error('You are not a member of this room');
    }
    
    // Check if game is in progress
    const isGameInProgress = currentRoom.status === 'playing' || currentRoom.status === 'active';
    const isCreator = currentRoom.createdBy === validatedPlayerId;
    
    // Leave the room
    const updatedRoom = await leavePokerRoom(validatedRoomId, validatedPlayerId);
    
    // Get the complete room info after leaving
    const completeRoom = await getPokerRoom(validatedRoomId);
    
    let message: string;
    
    if (isCreator) {
      if (updatedRoom.players.length === 0) {
        // Room was deleted
        message = ctx.t('poker.room.leave.deleted');
      } else {
        // Creator left, ownership transferred
        completeRoom?.players.find(p => p.id === completeRoom.createdBy);
        message = ctx.t('poker.room.leave.creator');
      }
    } else {
      if (isGameInProgress) {
        message = ctx.t('poker.room.leave.gameLeft');
      } else {
        message = ctx.t('poker.room.leave.roomLeft');
      }
    }

    // Generate main menu keyboard
    const keyboard = ctx.poker.generateMainMenuKeyboard();

    ctx.log.debug('Sending LEAVE message', { message, keyboard });

    // Use ctx.replySmart to update the existing message
    try {
      await ctx.replySmart(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      ctx.log.info('LEAVE message sent successfully');
    } catch (error) {
      ctx.log.error('Failed to send LEAVE message', { error: error instanceof Error ? error.message : String(error) });
      // Fallback: send new message
      await ctx.replySmart(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      ctx.log.info('LEAVE message sent as new message');
    }
    
    // Remove player's message from room
    await removePlayerMessage(validatedRoomId, validatedPlayerId);
    
    // Notify that player left
    await notifyPlayerLeft(validatedRoomId, validatedPlayerId, playerInRoom.username || playerInRoom.name);
    
    // Update messages for other players
    if (completeRoom) {
      for (const player of completeRoom.players) {
        if (player.chatId && player.id !== validatedPlayerId) {
          try {
            const playerMessage = await getPlayerMessage(completeRoom.id, player.id);
            if (playerMessage && playerMessage.messageId) {
              await handlePokerActiveUser({
                ...(ctx as GameHubContext),
                chat: { id: player.chatId } as unknown as GameHubContext['chat'],
                from: { id: Number(player.id) } as unknown as GameHubContext['from'],
              } as GameHubContext, {
                gameType: 'poker',
                roomId: completeRoom.id,
                isActive: true,
                lastActivity: Date.now()
              }, completeRoom);
            }
          } catch (error) {
            ctx.log.error('Failed to update message for player', { playerId: player.id, error: error instanceof Error ? error.message : String(error) });
          }
        }
      }
    }
    
  } catch (error) {
    ctx.log.error('Room leave error', { error: error instanceof Error ? error.message : String(error) });
    
    const errorMessage = error instanceof Error ? error.message : ctx.t('bot.error.generic');
    const message = ctx.t('poker.room.leave.error.generic', { error: errorMessage });
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {}) }
        ]]
      }
    });
  }
}

// Self-register with compact router

// Registration is handled by smart-router auto-discovery

export default handleLeave; 