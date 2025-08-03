import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { generateMainMenuKeyboard } from '../../buttonHelpers';
import { leavePokerRoom, getPokerRoom } from '../../services/pokerService';
import { validateRoomId, validatePlayerId } from '../../_utils/typeGuards';
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from '../../compact-codes';
import { removePlayerMessage, notifyPlayerLeft, getAllRoomMessages, getPlayerMessage } from '../../services/roomMessageService';
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
    const validatedRoomId = validateRoomId(roomIdParam);
    const validatedPlayerId = validatePlayerId(user.id.toString());
    
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
        const newCreator = completeRoom?.players.find(p => p.id === completeRoom.createdBy);
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

    // Use tryEditMessageText to update the existing message
    try {
      await tryEditMessageText(ctx, message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      console.log(`✅ LEAVE MESSAGE SENT SUCCESSFULLY`);
    } catch (error) {
      console.error(`❌ FAILED TO SEND LEAVE MESSAGE:`, error);
      // Fallback: send new message
      await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      console.log(`✅ LEAVE MESSAGE SENT AS NEW MESSAGE`);
    }
    
    // Remove player's message from room
    await removePlayerMessage(validatedRoomId, validatedPlayerId);
    
    // Notify that player left
    await notifyPlayerLeft(validatedRoomId, validatedPlayerId, playerInRoom.username || playerInRoom.name);
    
    // Update messages for remaining players in the room
    if (updatedRoom.players.length > 0) {
      for (const remainingPlayer of updatedRoom.players) {
        if (!remainingPlayer.chatId) {
          console.log(`⚠️ No chatId stored for player ${remainingPlayer.id}, skipping update`);
          continue;
        }
        
        try {
          console.log(`📢 Updating message for remaining player ${remainingPlayer.id} (chatId: ${remainingPlayer.chatId})`);
          
          // Get the stored message ID for this player
          const playerMessage = await getPlayerMessage(validatedRoomId, remainingPlayer.id);
          if (!playerMessage) {
            console.log(`⚠️ No stored message found for player ${remainingPlayer.id}, skipping update`);
            continue;
          }

          // Create a mock context for remaining player using stored chatId and messageId
          const remainingPlayerContext = {
            ...ctx,
            chat: { id: remainingPlayer.chatId },
            from: { id: parseInt(remainingPlayer.id) },
            message: { message_id: playerMessage.messageId }
          };
          
          const playerState = {
            gameType: 'poker' as const,
            roomId: completeRoom.id, // Use completeRoom instead of updatedRoom
            isActive: true,
            lastActivity: Date.now()
          };
          
          // Send updated room state to remaining players
          await handlePokerActiveUser(remainingPlayerContext, playerState, completeRoom);
          console.log(`✅ Updated message for remaining player ${remainingPlayer.id}`);
        } catch (error) {
          console.error(`❌ Failed to update message for remaining player ${remainingPlayer.id}:`, error);
        }
      }
    }
    
  } catch (error) {
    console.error('Room leave error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص رخ داده است';
    const message = `❌ <b>خطا در ترک روم</b>\n\n${errorMessage}`;
    
    await tryEditMessageText(ctx, message, {
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
register(POKER_ACTIONS.LEAVE_ROOM, handleLeave, 'Leave Poker Room');

export default handleLeave; 