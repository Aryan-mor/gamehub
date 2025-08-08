import { HandlerContext, createHandler } from '@/modules/core/handler';
import { GameHubContext } from '@/plugins';
import { getPokerRoom, validateRoomIdWithError, validatePlayerIdWithError } from '../../_utils/pokerUtils';
import { startPokerGame } from '../../services/gameStateService';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import PokerKeyboardService from '../../services/pokerKeyboardService';
import { RoomId, PlayerId, PokerRoom } from '../../types';
import { bot } from '@/bot';
import { getCardDisplay } from '../../_utils/cardUtils';
import { StartQuerySchema } from '../../_utils/schemas';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.start';

/**
 * Handle starting a poker game in a room
 * Only room creator can execute this action
 */
async function handleStart(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  logFunctionStart('handleStart', { query });
  
  const { user, ctx } = context;
  const { roomId } = StartQuerySchema.parse(query);
  
  ctx.log.info('Processing game start request', { userId: user.id, roomId });
  
  // roomId already validated by Zod
  
  try {
    // Validate IDs via domain validators (no casts in handlers)
    const validatedRoomId: RoomId = validateRoomIdWithError(roomId);
    const validatedPlayerId: PlayerId = validatePlayerIdWithError(user.id.toString());
    
    // Get room information
    const room = await getPokerRoom(validatedRoomId);
    if (!room) {
      throw new Error(ctx.t('poker.room.error.notFound'));
    }
    
    // Check if user is the room creator
    if (String(room.createdBy) !== String(validatedPlayerId)) {
      throw new Error(ctx.t('poker.room.start.error.onlyCreator'));
    }
    
    // Check if game is already started
    if (room.status !== 'waiting') {
      throw new Error(ctx.t('poker.room.start.error.alreadyStarted'));
    }
    
    // Check minimum players (at least 2 players)
    if (room.players.length < 2) {
      throw new Error(ctx.t('poker.room.start.error.minPlayers'));
    }
    
    // Start the poker game using the engine
    const updatedRoom = await startPokerGame(validatedRoomId);
    
    // Send comprehensive game start message to all players
    await sendComprehensiveGameStartMessage(ctx, updatedRoom);
    
    // Show success message to the room creator
    const successMessage = ctx.t('poker.start.success', {
      players: updatedRoom.players.length,
      smallBlind: updatedRoom.smallBlind,
      bigBlind: updatedRoom.bigBlind,
      pot: updatedRoom.pot,
      currentPlayer: updatedRoom.players[updatedRoom.currentPlayerIndex].name
    });
    
    // Generate keyboard for the room creator
    const keyboard = PokerKeyboardService.gameAction(
      updatedRoom,
      validatedPlayerId,
      updatedRoom.players[updatedRoom.currentPlayerIndex].id === validatedPlayerId,
      ctx
    );
    
    await ctx.replySmart(successMessage, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
    logFunctionEnd('handleStart', updatedRoom, { roomId: validatedRoomId, playerId: validatedPlayerId });
    
  } catch (error) {
    logError('handleStart', error as Error, { query });
    
    const errorMessage = error instanceof Error ? error.message : ctx.t('bot.error.generic');
    const message = ctx.t('poker.start.error.genericDetailed', { error: errorMessage });
    
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

/**
 * Send comprehensive game start message to all players
 * This combines game info, private cards, and turn status in one message
 */
async function sendComprehensiveGameStartMessage(ctx: GameHubContext, room: PokerRoom): Promise<void> {
  try {
    // No ctx available here; keep minimal logging via logger functions if needed.
    
    for (const player of room.players) {
      const isCurrentPlayer = player.id === room.players[room.currentPlayerIndex].id;
      const currentPlayer = room.players[room.currentPlayerIndex];
      
      
      
      // Clean up previous messages for this player
      try {
        const { getPlayerMessage } = await import('../../services/roomMessageService');
        const previousMessage = await getPlayerMessage(room.id, player.id);
        if (previousMessage && previousMessage.messageId) {
          await bot.api.deleteMessage(parseInt(player.id), previousMessage.messageId);
          
        }
      } catch (error) {
        logError('sendComprehensiveGameStartMessage.deletePreviousMessage', error as Error, { roomId: room.id, playerId: player.id });
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
          const handDisplay = player.cards.map((card): string => getCardDisplay(card)).join(' ');
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
      const { default: PokerKeyboardService } = await import('../../services/pokerKeyboardService');
      const keyboard = PokerKeyboardService.gameAction(room, player.id, isCurrentPlayer, ctx);
      
      // Send message to player
      const sentMessage = await bot.api.sendMessage(parseInt(player.id), message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      
      // Store the new message ID
      try {
        const { storePlayerMessage } = await import('../../services/roomMessageService');
        await storePlayerMessage(room.id, player.id, sentMessage.message_id, parseInt(player.id));
      } catch (error) {
        logError('sendComprehensiveGameStartMessage.storePlayerMessage', error as Error, { roomId: room.id, playerId: player.id });
      }
      
      
    }
  } catch (error) {
    logError('sendComprehensiveGameStartMessage', error as Error, { roomId: room?.id });
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

// Registration is handled by smart-router auto-discovery

export default createHandler(handleStart); 