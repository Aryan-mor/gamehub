import { Bot } from 'grammy';
import { PokerGameState, PlayerId } from './state';
import { getCardDisplay, getHandDisplay } from './deal';
import { generateGameActionKeyboard } from '../_utils/gameActionKeyboardGenerator';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Determine current player based on turnIndex and send appropriate notifications
 * If it's the current user's turn, send them action buttons
 * For all other players, notify who is to act
 */
export async function sendTurnNotification(
  bot: Bot,
  gameState: PokerGameState,
  playerId: PlayerId
): Promise<void> {
  logFunctionStart('sendTurnNotification', { roomId: gameState.roomId, playerId });
  
  try {
    // Determine current player based on turnIndex
    const currentPlayer = gameState.players[gameState.currentTurnIndex];
    const isCurrentPlayerTurn = currentPlayer?.id === playerId;
    
    if (isCurrentPlayerTurn) {
      // If it's the current user's turn, send them action buttons
      const message = generateTurnActionMessage(gameState, playerId);
      const keyboard = generateGameActionKeyboard(gameState, playerId, true);
      
      await bot.api.sendMessage(playerId.toString(), message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    } else {
      // For all other players, notify who is to act
      const message = generateWaitingMessage(gameState, playerId);
      const keyboard = generateGameActionKeyboard(gameState, playerId, false);
      
      await bot.api.sendMessage(playerId.toString(), message, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    }
    
    logFunctionEnd('sendTurnNotification', {}, { roomId: gameState.roomId, playerId });
  } catch (error) {
    logError('sendTurnNotification', error as Error, { roomId: gameState.roomId, playerId });
  }
}

/**
 * Send game state update to all players
 */
export async function sendGameStateUpdate(
  bot: Bot,
  gameState: PokerGameState,
  updateMessage: string
): Promise<void> {
  logFunctionStart('sendGameStateUpdate', { roomId: gameState.roomId });
  
  try {
    for (const player of gameState.players) {
      await bot.api.sendMessage(player.id.toString(), updateMessage, {
        parse_mode: 'HTML'
      });
    }
    
    logFunctionEnd('sendGameStateUpdate', {}, { roomId: gameState.roomId });
  } catch (error) {
    logError('sendGameStateUpdate', error as Error, { roomId: gameState.roomId });
  }
}

/**
 * Send private hand message to a specific player
 */
export async function sendPrivateHandMessage(
  bot: Bot,
  gameState: PokerGameState,
  playerId: PlayerId
): Promise<void> {
  logFunctionStart('sendPrivateHandMessage', { roomId: gameState.roomId, playerId });
  
  try {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || !player.hand) {
      return;
    }
    
    const handDisplay = getHandDisplay(player.hand);
    const message = generatePrivateHandMessage(gameState, playerId, handDisplay);
    
    await bot.api.sendMessage(playerId.toString(), message, {
      parse_mode: 'HTML'
    });
    
    logFunctionEnd('sendPrivateHandMessage', {}, { roomId: gameState.roomId, playerId });
  } catch (error) {
    logError('sendPrivateHandMessage', error as Error, { roomId: gameState.roomId, playerId });
  }
}

/**
 * Send game start notification to all players
 */
export async function sendGameStartNotification(
  bot: Bot,
  gameState: PokerGameState
): Promise<void> {
  logFunctionStart('sendGameStartNotification', { roomId: gameState.roomId });
  
  try {
    const message = generateGameStartMessage(gameState);
    
    for (const player of gameState.players) {
      await bot.api.sendMessage(player.id.toString(), message, {
        parse_mode: 'HTML'
      });
    }
    
    logFunctionEnd('sendGameStartNotification', {}, { roomId: gameState.roomId });
  } catch (error) {
    logError('sendGameStartNotification', error as Error, { roomId: gameState.roomId });
  }
}

/**
 * Generate turn action message for current player
 * Make sure messages replace old ones for clarity
 */
function generateTurnActionMessage(gameState: PokerGameState, playerId: PlayerId): string {
  const currentPlayer = gameState.players[gameState.currentTurnIndex];
  const player = gameState.players.find(p => p.id === playerId);
  
  if (!currentPlayer || !player) {
    return '❌ خطا در نمایش نوبت';
  }
  
  const handDisplay = player.hand ? getHandDisplay(player.hand) : '';
  
  let message = `🎯 <b>نوبت شماست!</b>\n\n`;
  
  // Game state info
  message += `📊 <b>وضعیت بازی:</b>\n`;
  message += `• دور: ${gameState.round}\n`;
  message += `• پات: ${gameState.pot} سکه\n`;
  message += `• شرط فعلی: ${gameState.currentBet} سکه\n`;
  message += `• بازیکنان فعال: ${gameState.players.filter(p => !p.hasFolded).length}\n\n`;
  
  // Player info
  message += `👤 <b>اطلاعات شما:</b>\n`;
  message += `• موجودی: ${player.chips} سکه\n`;
  message += `• شرط فعلی: ${player.betAmount} سکه\n`;
  if (handDisplay) {
    message += `• کارت‌های شما: ${handDisplay}\n`;
  }
  message += '\n';
  
  // Action instructions
  message += `🎮 <b>انتخاب کنید:</b>\n`;
  if (player.betAmount < gameState.currentBet) {
    const callAmount = gameState.currentBet - player.betAmount;
    message += `• 🃏 Call (برابری) - ${callAmount} سکه\n`;
  } else {
    message += `• 👁️ Check (بررسی)\n`;
  }
  message += `• ❌ Fold (تخلیه)\n`;
  if (player.chips > gameState.currentBet) {
    message += `• 💰 Raise (افزایش)\n`;
  }
  if (player.chips > 0) {
    message += `• 🔥 All In (همه چیز)\n`;
  }
  
  return message;
}

/**
 * Generate waiting message for other players
 * Make sure messages replace old ones for clarity
 */
function generateWaitingMessage(gameState: PokerGameState, playerId: PlayerId): string {
  const currentPlayer = gameState.players[gameState.currentTurnIndex];
  const player = gameState.players.find(p => p.id === playerId);
  
  if (!currentPlayer || !player) {
    return '❌ خطا در نمایش وضعیت';
  }
  
  let message = `⏳ <b>منتظر ${currentPlayer.name}...</b>\n\n`;
  
  // Game state info
  message += `📊 <b>وضعیت بازی:</b>\n`;
  message += `• دور: ${gameState.round}\n`;
  message += `• پات: ${gameState.pot} سکه\n`;
  message += `• شرط فعلی: ${gameState.currentBet} سکه\n`;
  message += `• بازیکنان فعال: ${gameState.players.filter(p => !p.hasFolded).length}\n\n`;
  
  // Player info
  message += `👤 <b>اطلاعات شما:</b>\n`;
  message += `• موجودی: ${player.chips} سکه\n`;
  message += `• شرط فعلی: ${player.betAmount} سکه\n`;
  if (player.hasFolded) {
    message += `• وضعیت: ❌ تخلیه شده\n`;
  } else if (player.isAllIn) {
    message += `• وضعیت: 🔥 همه چیز\n`;
  } else {
    message += `• وضعیت: ✅ فعال\n`;
  }
  
  return message;
}

/**
 * Generate private hand message
 */
function generatePrivateHandMessage(gameState: PokerGameState, playerId: PlayerId, handDisplay: string): string {
  const player = gameState.players.find(p => p.id === playerId);
  
  if (!player) {
    return '❌ خطا در نمایش کارت‌ها';
  }
  
  let message = `🎮 <b>بازی شروع شد!</b>\n\n`;
  
  message += `🃏 <b>کارت‌های شما:</b>\n`;
  message += `${handDisplay}\n\n`;
  
  message += `💰 <b>موجودی:</b> ${player.chips} سکه\n`;
  message += `🎯 <b>شرط فعلی:</b> ${player.betAmount} سکه\n\n`;
  
  message += `📊 <b>وضعیت بازی:</b>\n`;
  message += `• دور: ${gameState.round}\n`;
  message += `• پات: ${gameState.pot} سکه\n`;
  message += `• بازیکنان: ${gameState.players.length} نفر\n\n`;
  
  message += `⏳ منتظر نوبت خود باشید...`;
  
  return message;
}

/**
 * Generate game start message
 */
function generateGameStartMessage(gameState: PokerGameState): string {
  let message = `🎮 <b>بازی پوکر شروع شد!</b>\n\n`;
  
  message += `📊 <b>مشخصات بازی:</b>\n`;
  message += `• روم: ${gameState.roomName}\n`;
  message += `• بازیکنان: ${gameState.players.length} نفر\n`;
  message += `• Small Blind: ${gameState.smallBlind} سکه\n`;
  message += `• Big Blind: ${gameState.bigBlind} سکه\n`;
  message += `• پات اولیه: ${gameState.pot} سکه\n\n`;
  
  message += `🎯 <b>نوبت فعلی:</b> ${gameState.players[gameState.currentTurnIndex]?.name || 'نامشخص'}\n\n`;
  
  message += `✅ کارت‌ها تقسیم شدند. منتظر نوبت خود باشید.`;
  
  return message;
}

/**
 * Send action result notification
 */
export async function sendActionResultNotification(
  bot: Bot,
  gameState: PokerGameState,
  action: string,
  playerName: string,
  amount?: number
): Promise<void> {
  logFunctionStart('sendActionResultNotification', { roomId: gameState.roomId, action });
  
  try {
    let message = `🎮 <b>عملیات انجام شد</b>\n\n`;
    
    message += `👤 <b>بازیکن:</b> ${playerName}\n`;
    message += `🎯 <b>عملیات:</b> ${getActionDisplayName(action)}\n`;
    if (amount) {
      message += `💰 <b>مبلغ:</b> ${amount} سکه\n`;
    }
    message += '\n';
    
    message += `📊 <b>وضعیت جدید:</b>\n`;
    message += `• پات: ${gameState.pot} سکه\n`;
    message += `• شرط فعلی: ${gameState.currentBet} سکه\n`;
    message += `• نوبت بعدی: ${gameState.players[gameState.currentTurnIndex]?.name || 'نامشخص'}`;
    
    for (const player of gameState.players) {
      await bot.api.sendMessage(player.id.toString(), message, {
        parse_mode: 'HTML'
      });
    }
    
    logFunctionEnd('sendActionResultNotification', {}, { roomId: gameState.roomId, action });
  } catch (error) {
    logError('sendActionResultNotification', error as Error, { roomId: gameState.roomId, action });
  }
}

/**
 * Get action display name in Persian
 */
function getActionDisplayName(action: string): string {
  const actionNames: Record<string, string> = {
    'fold': '❌ تخلیه',
    'check': '👁️ بررسی',
    'call': '🃏 برابری',
    'raise': '💰 افزایش',
    'all-in': '🔥 همه چیز'
  };
  
  return actionNames[action] || action;
} 