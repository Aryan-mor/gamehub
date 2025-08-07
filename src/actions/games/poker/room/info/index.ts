import { HandlerContext } from '@/modules/core/handler';
import { getPokerRoom } from '../../services/pokerService';
import { validateRoomId, validatePlayerId } from '../../_utils/typeGuards';
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from '../../compact-codes';
import { getRoomInfoForUser, generateRoomInfoKeyboard } from '../../_utils/roomInfoHelper';
import { getPlayerMessage, storePlayerMessage } from '../../services/roomMessageService';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.info';

/**
 * Handle displaying room information
 */
async function handleInfo(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { roomId, r, action } = query;
  const roomIdParam = roomId || r;
  
  logFunctionStart('handleInfo', { userId: user.id, roomId: roomIdParam, action });
  console.log(`Processing room info request for user ${user.id}, roomId: ${roomIdParam}, action: ${action}`);
  
  // Validate context has required information
  if (!ctx.chat?.id) {
    console.error('❌ Missing chat ID in context');
    logError('handleInfo', new Error('Missing chat ID in context'), { userId: user.id, roomId: roomIdParam });
    return;
  }
  
  // Handle share action
  if (action === 'share') {
    try {
      // Import and call the share handler directly
      const handleShare = (await import('../share')).default;
      await handleShare(context, { roomId: roomIdParam });
      return;
    } catch (error) {
      console.error('Share action error:', error);
      const message = `❌ <b>خطا در اشتراک‌گذاری روم</b>\n\nخطا در پردازش درخواست اشتراک‌گذاری.`;
      
      try {
        await ctx.replySmart(message, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
            ]]
          }
        });
      } catch (sendError) {
        console.error('Failed to send share error message:', sendError);
      }
      return;
    }
  }
  
  if (!roomIdParam) {
    const message = `❌ <b>خطا در نمایش اطلاعات روم</b>\n\n` +
      `شناسه روم مورد نیاز است.`;
    
    try {
      await ctx.replySmart(message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
          ]]
        }
      });
    } catch (sendError) {
      console.error('Failed to send room ID error message:', sendError);
    }
    return;
  }
  
  try {
    // Validate IDs
    const validatedRoomId = validateRoomId(roomIdParam);
    const validatedPlayerId = validatePlayerId(user.id.toString());
    
    // Get room information
    const room = await getPokerRoom(validatedRoomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Check if user is in the room
    const playerInRoom = room.players.find(p => p.id === validatedPlayerId);
    if (!playerInRoom) {
      throw new Error('You are not a member of this room');
    }
    
    // Get personalized room information
    const roomInfo = getRoomInfoForUser(room, validatedPlayerId);
    
    // Generate appropriate keyboard
    const keyboard = generateRoomInfoKeyboard(room, validatedPlayerId);
    
    // Get current chat ID - ensure we have a valid chat ID
    const chatId = ctx.chat?.id;
    if (!chatId) {
      throw new Error('Missing chat ID in context');
    }
    
    // Check if we have a stored message for this player
    const existingMessage = await getPlayerMessage(validatedRoomId, validatedPlayerId);
    
    // Delete old message if it exists
    if (existingMessage) {
      try {
        const { bot } = await import('@/bot');
        await bot.api.deleteMessage(existingMessage.chatId, existingMessage.messageId);
        console.log(`🗑️ Deleted old message ${existingMessage.messageId} for player ${validatedPlayerId} in room ${validatedRoomId}`);
        
        // Remove old message from database
        const { api } = await import('@/lib/api');
        await api.roomMessages.deleteByRoomAndUser(validatedRoomId, validatedPlayerId);
      } catch (deleteError) {
        console.log(`⚠️ Failed to delete old message for player ${validatedPlayerId}:`, deleteError);
        // Continue anyway - we'll send a new message
      }
    }
    
    // Send new message with proper error handling
    let sentMessage;
    try {
      sentMessage = await ctx.replySmart(roomInfo, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    } catch (replyError) {
      console.error('Failed to send room info message:', replyError);
      
      // Fallback: try to edit if we have a callback query
      if (ctx.callbackQuery?.message) {
        try {
          await ctx.editMessageText(roomInfo, {
            parse_mode: 'HTML',
            reply_markup: keyboard
          });
          console.log('✅ Successfully edited existing message');
          return;
        } catch (editError) {
          console.error('Failed to edit message:', editError);
          throw new Error('Unable to send or edit room info message');
        }
      } else {
        throw new Error('Unable to send room info message');
      }
    }
    
    // Store the new message ID
    if (sentMessage) {
      await storePlayerMessage(validatedRoomId, validatedPlayerId, sentMessage.message_id, chatId);
      console.log(`💾 Stored new message ID ${sentMessage.message_id} for player ${validatedPlayerId} in room ${validatedRoomId}`);
    }
    
    logFunctionEnd('handleInfo', {}, { success: true, newMessageId: sentMessage?.message_id });
    
  } catch (error) {
    console.error('Room info error:', error);
    logError('handleInfo', error as Error);
    
    const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص رخ داده است';
    const message = `❌ <b>خطا در نمایش اطلاعات روم</b>\n\n${errorMessage}`;
    
    try {
      await ctx.replySmart(message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
          ]]
        }
      });
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
}

// Self-register with compact router
register(POKER_ACTIONS.ROOM_INFO, handleInfo, 'Room Information');

export default handleInfo; 