import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getPokerRoom } from '../../services/pokerService';
import { validateRoomId, validatePlayerId } from '../../_utils/typeGuards';
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
  ctx.log.info('Processing room info request', { userId: user.id, roomId: roomIdParam, action });
  
  // Validate context has required information
  if (!ctx.chat?.id) {
    ctx.log.error('Missing chat ID in context');
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
      ctx.log.error('Share action error', { error: error instanceof Error ? error.message : String(error) });
      const message = ctx.t('poker.room.info.error.share');
      
      try {
        await ctx.replySmart(message, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {}) }
            ]]
          }
        });
      } catch (sendError) {
        ctx.log.error('Failed to send share error message', { error: sendError instanceof Error ? sendError.message : String(sendError) });
      }
      return;
    }
  }
  
  if (!roomIdParam) {
    const message = ctx.t('poker.room.info.error.missingRoomId');
    
    try {
      await ctx.replySmart(message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {}) }
          ]]
        }
      });
    } catch (sendError) {
      ctx.log.error('Failed to send room ID error message', { error: sendError instanceof Error ? sendError.message : String(sendError) });
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
    const roomInfo = getRoomInfoForUser(room, validatedPlayerId, ctx);
    
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
        ctx.log.info('Deleted old message for player', { messageId: existingMessage.messageId, playerId: validatedPlayerId, roomId: validatedRoomId });
        
        // Remove old message from database
        const { api } = await import('@/lib/api');
        await api.roomMessages.deleteByRoomAndUser(validatedRoomId, validatedPlayerId);
      } catch (deleteError) {
        ctx.log.warn('Failed to delete old message for player', { playerId: validatedPlayerId, error: deleteError instanceof Error ? deleteError.message : String(deleteError) });
        // Continue anyway - we'll send a new message
      }
    }
    
    // Send new message with proper error handling
    let sentMessage: { message_id: number } | undefined;
    try {
      await ctx.replySmart(roomInfo, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      // replySmart may not return a message; skip storing if not available
    } catch (replyError) {
      ctx.log.error('Failed to send room info message', { error: replyError instanceof Error ? replyError.message : String(replyError) });
      
      // Fallback: try to edit if we have a callback query
      if (ctx.callbackQuery?.message) {
        try {
          await ctx.editMessageText(roomInfo, {
            parse_mode: 'HTML',
            reply_markup: keyboard
          });
          ctx.log.info('Successfully edited existing message');
          return;
        } catch (editError) {
          ctx.log.error('Failed to edit message', { error: editError instanceof Error ? editError.message : String(editError) });
          throw new Error('Unable to send or edit room info message');
        }
      } else {
        throw new Error('Unable to send room info message');
      }
    }
    
    // Store the new message ID
    if (sentMessage?.message_id) {
      await storePlayerMessage(validatedRoomId, validatedPlayerId, sentMessage.message_id, chatId);
      ctx.log.info('Stored new message ID', { messageId: sentMessage.message_id, playerId: validatedPlayerId, roomId: validatedRoomId });
    }
    
    logFunctionEnd('handleInfo', {}, { success: true, newMessageId: sentMessage?.message_id });
    
  } catch (error) {
    ctx.log.error('Room info error', { error: error instanceof Error ? error.message : String(error) });
    logError('handleInfo', error as Error);
    
    const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص رخ داده است';
    const message = ctx.t('poker.room.info.error.generic', { error: errorMessage });
    
    try {
      await ctx.replySmart(message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {}) }
          ]]
        }
      });
    } catch (sendError) {
      ctx.log.error('Failed to send error message', { error: sendError instanceof Error ? sendError.message : String(sendError) });
    }
  }
}

// Self-register with compact router
// Registration is handled by smart-router auto-discovery

export default createHandler(handleInfo); 