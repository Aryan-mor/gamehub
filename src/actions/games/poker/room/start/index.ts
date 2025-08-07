import { HandlerContext } from '@/modules/core/handler';
import { validateRoomIdWithError, validatePlayerIdWithError, getPokerRoom } from '../../_utils/pokerUtils';
import { startPokerGame } from '../../services/gameStateService';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { generateGameActionKeyboard } from '../../_utils/gameActionKeyboardGenerator';
import { RoomId, PlayerId } from '../../types';
import { bot } from '@/bot';
import { getCardDisplay } from '../../_utils/cardUtils';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.start';

/**
 * Handle starting a poker game in a room
 * Only room creator can execute this action
 */
async function handleStart(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  logFunctionStart('handleStart', { query });
  
  const { user, ctx } = context;
  const { roomId, r } = query;
  const roomIdParam = roomId || r;
  
  console.log(`Processing game start request for user ${user.id}, roomId: ${roomIdParam}`);
  
  if (!roomIdParam) {
    const message = `❌ <b>خطا در شروع بازی</b>\n\n` +
      `شناسه روم مورد نیاز است.`;
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
        ]]
      }
    });
    return;
  }
  
  try {
    // Validate IDs
    const validatedRoomId = validateRoomIdWithError(roomIdParam) as RoomId;
    const validatedPlayerId = validatePlayerIdWithError(user.id.toString()) as PlayerId;
    
    // Get room information
    const room = await getPokerRoom(validatedRoomId);
    if (!room) {
      throw new Error('روم یافت نشد');
    }
    
    // Check if user is the room creator
    if (String(room.createdBy) !== String(validatedPlayerId)) {
      throw new Error('فقط سازنده روم می‌تواند بازی را شروع کند');
    }
    
    // Check if game is already started
    if (room.status !== 'waiting') {
      throw new Error('بازی قبلاً شروع شده است');
    }
    
    // Check minimum players (at least 2 players)
    if (room.players.length < 2) {
      throw new Error('حداقل ۲ بازیکن برای شروع بازی نیاز است');
    }
    
    // Start the poker game using the engine
    const updatedRoom = await startPokerGame(validatedRoomId);
    
    // Send comprehensive game start message to all players
    await sendComprehensiveGameStartMessage(updatedRoom);
    
    // Show success message to the room creator
    const successMessage = `🎮 <b>بازی با موفقیت شروع شد!</b>\n\n` +
      `✅ پیام‌های مربوط به بازی برای تمام بازیکنان ارسال شد.\n\n` +
      `📊 <b>مشخصات بازی:</b>\n` +
      `• تعداد بازیکنان: ${updatedRoom.players.length}\n` +
      `• Small Blind: ${updatedRoom.smallBlind} سکه\n` +
      `• Big Blind: ${updatedRoom.bigBlind} سکه\n` +
      `• پات اولیه: ${updatedRoom.pot} سکه\n\n` +
      `🎯 <b>نوبت فعلی:</b> ${updatedRoom.players[updatedRoom.currentPlayerIndex].name}\n\n` +
      `🃏 کارت‌ها تقسیم شدند و بازی آماده است!\n\n` +
      `⏰ تایمر برای بازیکن اول شروع شد.`;
    
    // Generate keyboard for the room creator
    const keyboard = generateGameActionKeyboard(
      updatedRoom,
      validatedPlayerId,
      updatedRoom.players[updatedRoom.currentPlayerIndex].id === validatedPlayerId
    );
    
    await ctx.replySmart(successMessage, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
    logFunctionEnd('handleStart', updatedRoom, { roomId: validatedRoomId, playerId: validatedPlayerId });
    
  } catch (error) {
    logError('handleStart', error as Error, { query });
    
    const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص رخ داده است';
    const message = `❌ <b>خطا در شروع بازی</b>\n\n${errorMessage}`;
    
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

/**
 * Send comprehensive game start message to all players
 * This combines game info, private cards, and turn status in one message
 */
async function sendComprehensiveGameStartMessage(room: any): Promise<void> {
  try {
    console.log(`🎮 Sending comprehensive game start message to ${room.players.length} players`);
    
    for (const player of room.players) {
      const isCurrentPlayer = player.id === room.players[room.currentPlayerIndex].id;
      const currentPlayer = room.players[room.currentPlayerIndex];
      
      console.log(`📤 Sending comprehensive message to player ${player.id} (${player.name})`);
      
      // Clean up previous messages for this player
      try {
        const { getPlayerMessage, removePlayerMessage } = await import('../../services/roomMessageService');
        const previousMessage = await getPlayerMessage(room.id, player.id);
        if (previousMessage && previousMessage.messageId) {
          await bot.api.deleteMessage(parseInt(player.id), previousMessage.messageId);
          console.log(`🗑️ Deleted previous message ${previousMessage.messageId} for player ${player.id}`);
        }
      } catch (error) {
        console.log(`⚠️ Could not delete previous message for player ${player.id}:`, error);
      }
      
      // Build comprehensive message
      let message = `🎮 <b>بازی شروع شد!</b>\n\n`;
      
      // Game info section
      message += `📊 <b>مشخصات بازی:</b>\n`;
      message += `• تعداد بازیکنان: ${room.players.length}\n`;
      message += `• Small Blind: ${room.smallBlind} سکه\n`;
      message += `• Big Blind: ${room.bigBlind} سکه\n`;
      message += `• پات اولیه: ${room.pot} سکه\n`;
      message += `• دور فعلی: ${getBettingRoundDisplay(room.bettingRound)}\n\n`;
      
      // Private cards section - Hide in Pre-flop
      if (room.bettingRound === 'preflop') {
        message += `🎴 <b>کارت‌های شما:</b>\n`;
        message += `(کارت‌ها در مرحله Pre-flop نمایش داده نمی‌شوند)\n\n`;
      } else {
        if (player.cards && player.cards.length > 0) {
          const handDisplay = player.cards.map((card: any) => getCardDisplay(card)).join(' ');
          message += `🃏 <b>کارت‌های شما:</b>\n`;
          message += `${handDisplay}\n\n`;
        } else {
          message += `🃏 <b>کارت‌های شما:</b>\n`;
          message += `(کارت‌ها هنوز تقسیم نشده‌اند)\n\n`;
        }
      }
      
      // Player status section
      message += `💰 <b>موجودی:</b> ${player.chips} سکه\n`;
      message += `🎯 <b>شرط فعلی:</b> ${player.betAmount} سکه\n\n`;
      
      // Turn status section
      if (isCurrentPlayer) {
        message += `🎯 <b>نوبت شماست!</b>\n\n`;
        message += `انتخاب کنید:\n`;
        message += `• 🃏 Call (برابری)\n`;
        message += `• ❌ Fold (تخلیه)\n`;
        message += `• 💰 Raise (افزایش)`;
      } else {
        // Use display name (first_name + last_name) instead of username for privacy
        const displayName = currentPlayer.name || currentPlayer.username || 'Unknown Player';
        message += `⏳ <b>منتظر ${displayName}...</b>\n\n`;
        message += `بازیکن فعلی در حال تصمیم‌گیری است.`;
      }
      
      // Generate keyboard for this player
      const { generateGameActionKeyboard } = await import('../../_utils/gameActionKeyboardGenerator');
      const keyboard = generateGameActionKeyboard(room, player.id, isCurrentPlayer);
      
      // Send message to player
      const sentMessage = await bot.api.sendMessage(parseInt(player.id), message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      
      // Store the new message ID
      try {
        const { storePlayerMessage } = await import('../../services/roomMessageService');
        await storePlayerMessage(room.id, player.id, sentMessage.message_id, parseInt(player.id));
        console.log(`💾 Stored message ID ${sentMessage.message_id} for player ${player.id}`);
      } catch (error) {
        console.log(`⚠️ Could not store message ID for player ${player.id}:`, error);
      }
      
      console.log(`✅ Sent comprehensive game start message to player ${player.id}`);
    }
  } catch (error) {
    console.error('Error sending comprehensive game start message:', error);
  }
}

/**
 * Get betting round display name
 */
function getBettingRoundDisplay(round: string): string {
  const roundNames: Record<string, string> = {
    'preflop': 'Pre-flop (قبل از فلاپ)',
    'flop': 'Flop (فلاپ)',
    'turn': 'Turn (ترن)',
    'river': 'River (ریور)'
  };
  
  return roundNames[round] || round;
}

// Self-register with compact router
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from '../../compact-codes';

register(POKER_ACTIONS.START_GAME, handleStart, 'Start Poker Game');

export default handleStart; 