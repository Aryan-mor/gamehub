import { HandlerContext } from '@/modules/core/handler';
import { Context } from 'grammy';
import { generateMainMenuKeyboard } from '../../buttonHelpers';
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
  
  console.log(`🚪 LEAVE HANDLER CALLED: Processing room leave for user ${user.id} from room ${roomIdParam}`);
  console.log(`🚪 LEAVE HANDLER DEBUG: query =`, query);
  console.log(`🚪 LEAVE HANDLER DEBUG: roomIdParam =`, roomIdParam);
  console.log(`🚪 LEAVE HANDLER DEBUG: context =`, { userId: user.id, username: user.username, chatId: ctx.chat?.id });

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
        message = `🚪 <b>روم حذف شد!</b>\n\n` +
          `✅ شما روم را ترک کردید و چون سازنده بودید، روم نیز حذف شد.\n\n` +
          `📊 <b>مرحله بعد:</b>\n` +
          `• می‌توانید روم جدید بسازید\n` +
          `• به روم‌های دیگر بپیوندید\n` +
          `• به منوی اصلی بازگردید`;
      } else {
        // Creator left, ownership transferred
        completeRoom?.players.find(p => p.id === completeRoom.createdBy);
        message = `🚪 <b>روم ترک شد!</b>\n\n` +
          `✅ شما روم را ترک کردید.\n\n` +
          `📊 <b>مرحله بعد:</b>\n` +
          `• می‌توانید روم جدید بسازید\n` +
          `• به روم‌های دیگر بپیوندید\n` +
          `• به منوی اصلی بازگردید`;
      }
    } else {
      if (isGameInProgress) {
        message = `🚪 <b>بازی ترک شد!</b>\n\n` +
          `✅ شما بازی پوکر را ترک کردید.\n\n` +
          `📊 <b>مرحله بعد:</b>\n` +
          `• می‌توانید روم جدید بسازید\n` +
          `• به روم‌های دیگر بپیوندید\n` +
          `• به منوی اصلی بازگردید`;
      } else {
        message = `🚪 <b>روم ترک شد!</b>\n\n` +
          `✅ شما روم پوکر را ترک کردید.\n\n` +
          `📊 <b>مرحله بعد:</b>\n` +
          `• می‌توانید روم جدید بسازید\n` +
          `• به روم‌های دیگر بپیوندید\n` +
          `• به منوی اصلی بازگردید`;
      }
    }

    // Generate main menu keyboard
    const keyboard = generateMainMenuKeyboard();

    console.log(`🚪 SENDING LEAVE MESSAGE:`);
    console.log(`  Message: ${message}`);
    console.log(`  Keyboard:`, keyboard);

    // Use ctx.replySmart to update the existing message
    try {
      await ctx.replySmart(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      console.log(`✅ LEAVE MESSAGE SENT SUCCESSFULLY`);
    } catch (error) {
      console.error(`❌ FAILED TO SEND LEAVE MESSAGE:`, error);
      // Fallback: send new message
      await ctx.replySmart(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      console.log(`✅ LEAVE MESSAGE SENT AS NEW MESSAGE`);
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
                chat: { id: player.chatId },
                from: { id: parseInt(player.id) },
                message: { message_id: playerMessage.messageId }
              } as unknown as Context, {
                gameType: 'poker',
                roomId: completeRoom.id,
                isActive: true,
                lastActivity: Date.now()
              }, completeRoom);
            }
          } catch (error) {
            console.error(`Failed to update message for player ${player.id}:`, error);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Room leave error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص رخ داده است';
    const message = `❌ <b>خطا در ترک روم</b>\n\n${errorMessage}`;
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
        ]]
      }
    });
  }
}

// Self-register with compact router
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from '../../compact-codes';

register(POKER_ACTIONS.LEAVE_ROOM, handleLeave, 'Leave Poker Room');

export default handleLeave; 