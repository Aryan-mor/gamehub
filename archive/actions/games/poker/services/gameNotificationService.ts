import { Bot } from 'grammy';
import { PokerRoom, PlayerId } from '../types';
import { logError } from '@/modules/core/logger';

/**
 * Send game start notification to all players
 */
export async function sendGameStartNotification(
  bot: Bot,
  room: PokerRoom
): Promise<void> {
  try {
    // Send general game start message to all players
    for (const player of room.players) {
      await bot.api.sendMessage(parseInt(player.id), '🎮 بازی شروع شد!', { parse_mode: 'HTML' });
    }
  } catch (error) {
    logError('sendGameStartNotification', error as Error, { roomId: room.id });
  }
}

/**
 * Send private hand message to a specific player
 */
export async function sendPrivateHandMessage(
  bot: Bot,
  playerId: PlayerId,
  room: PokerRoom,
  playerIndex: number
): Promise<void> {
  try {
    const player = room.players[playerIndex];
    if (!player || !player.hand) {
      return;
    }
    
    const handDisplay = player.hand.map(card => getCardDisplay(card)).join(' ');
    
    const _message = `🎮 <b>بازی شروع شد!</b>\n\n` +
      `🃏 <b>کارت‌های شما:</b>\n` +
      `${handDisplay}\n\n` +
      `💰 <b>موجودی:</b> ${player.balance} سکه\n` +
      `🎯 <b>شرط فعلی:</b> ${player.betAmount} سکه`;
    
      await bot.api.sendMessage(parseInt(playerId), _message, { parse_mode: 'HTML' });
  } catch (error) {
    logError('sendPrivateHandMessage', error as Error, { roomId: room.id, playerId });
  }
}

/**
 * Send turn notification to current player
 */
export async function sendTurnNotification(
  bot: Bot,
  room: PokerRoom,
  playerId: PlayerId,
  isCurrentPlayer: boolean
): Promise<void> {
  try {
    const currentPlayer = room.players[room.currentPlayerIndex];
    
    if (isCurrentPlayer) {
      const message = `🎯 <b>نوبت شماست!</b>\n\n` +
        `انتخاب کنید:\n` +
        `• 🃏 Call (برابری)\n` +
        `• ❌ Fold (تخلیه)\n` +
        `• 💰 Raise (افزایش)`;
      
      await bot.api.sendMessage(parseInt(playerId), message, { parse_mode: 'HTML' });
    } else {
      // Use display name (first_name + last_name) instead of username for privacy
      const displayName = currentPlayer.name || currentPlayer.username || 'Unknown Player';
      const message = `⏳ <b>منتظر ${displayName}...</b>\n\n` +
        `بازیکن فعلی در حال تصمیم‌گیری است.`;
      
      await bot.api.sendMessage(parseInt(playerId), message, { parse_mode: 'HTML' });
    }
  } catch (error) {
    logError('sendTurnNotification', error as Error, { roomId: room.id, playerId, isCurrentPlayer });
  }
}

/**
 * Send game state update to all players
 */
export async function sendGameStateUpdate(
  bot: Bot,
  room: PokerRoom,
  updateMessage: string
): Promise<void> {
  try {
    for (const player of room.players) {
      await bot.api.sendMessage(parseInt(player.id), updateMessage, { parse_mode: 'HTML' });
    }
  } catch (error) {
    logError('sendGameStateUpdate', error as Error, { roomId: room.id });
  }
}

/**
 * Get card display string
 */
function getCardDisplay(card: string): string {
  const suitSymbols: Record<string, string> = {
    'h': '♥️',
    'd': '♦️',
    'c': '♣️',
    's': '♠️'
  };
  
  const rank = card.slice(0, -1);
  const suit = card.slice(-1);
  
  return `${rank}${suitSymbols[suit]}`;
} 