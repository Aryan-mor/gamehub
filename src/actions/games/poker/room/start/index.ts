import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { validateRoomIdWithError, validatePlayerIdWithError, getPokerRoom } from '../../_utils/pokerUtils';
import { startPokerGame } from '../../services/gameStateService';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { generateGameActionKeyboard } from '../../_utils/gameActionKeyboardGenerator';
import { RoomId, PlayerId } from '../../types';

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
    
    await tryEditMessageText(ctx, message, {
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
    if (room.createdBy !== validatedPlayerId) {
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
    
          // Convert room to game state for notifications
      // const gameState = updatedRoom; // This line was removed as per the edit hint
    
    // Initialize timeout tracking for the room
    // initializeRoomTimeout(updatedRoom); // This line was removed as per the edit hint
    
    // Update turn start time for the first player
    // updateTurnStartTime(updatedRoom); // This line was removed as per the edit hint
    
    // Send notifications to all players
    // sendGameStartNotification(bot, gameState); // This line was removed as per the edit hint
    
    // Send private hand messages to each player
    // for (const player of updatedRoom.players) { // This line was removed as per the edit hint
    //   await sendPrivateHandMessage(bot, gameState, player.id); // This line was removed as per the edit hint
    // }
    
    // Send turn notifications to all players
    // Only the current player gets action buttons, others get waiting messages
    // for (const player of updatedRoom.players) { // This line was removed as per the edit hint
    //   await sendTurnNotification(bot, gameState, player.id); // This line was removed as per the edit hint
    // }
    
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
    
    await tryEditMessageText(ctx, successMessage, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
    logFunctionEnd('handleStart', updatedRoom, { roomId: validatedRoomId, playerId: validatedPlayerId });
    
  } catch (error) {
    logError('handleStart', error as Error, { query });
    
    const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص رخ داده است';
    const message = `❌ <b>خطا در شروع بازی</b>\n\n${errorMessage}`;
    
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
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from '../../compact-codes';

register(POKER_ACTIONS.START_GAME, handleStart, 'Start Poker Game');

export default handleStart; 