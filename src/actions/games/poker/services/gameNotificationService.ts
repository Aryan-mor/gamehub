import { PokerRoom, PlayerId } from '../types';
import { sendMessage } from '@/modules/core/telegramHelpers';
import { Bot } from 'grammy';

/**
 * Send game start notification to all players
 */
export async function sendGameStartNotification(
  bot: Bot,
  room: PokerRoom,
  message: string
): Promise<void> {
  try {
    // Send general game start message to all players
    for (const player of room.players) {
      await sendMessage(bot, player.id.toString(), message, {
        parseMode: 'HTML'
      });
    }
  } catch (error) {
    console.error('Error sending game start notification:', error);
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
    
    const message = `🎮 <b>بازی شروع شد!</b>\n\n` +
      `🃏 <b>کارت‌های شما:</b>\n` +
      `${handDisplay}\n\n` +
      `💰 <b>موجودی:</b> ${player.balance} سکه\n` +
      `🎯 <b>شرط فعلی:</b> ${player.betAmount} سکه`;
    
    await sendMessage(bot, playerId.toString(), message, {
      parseMode: 'HTML'
    });
  } catch (error) {
    console.error('Error sending private hand message:', error);
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
      
      await sendMessage(bot, playerId.toString(), message, {
        parseMode: 'HTML'
      });
    } else {
      // Use display name (first_name + last_name) instead of username for privacy
      const displayName = currentPlayer.name || currentPlayer.username || 'Unknown Player';
      const message = `⏳ <b>منتظر ${displayName}...</b>\n\n` +
        `بازیکن فعلی در حال تصمیم‌گیری است.`;
      
      await sendMessage(bot, playerId.toString(), message, {
        parseMode: 'HTML'
      });
    }
  } catch (error) {
    console.error('Error sending turn notification:', error);
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
      await sendMessage(bot, player.id.toString(), updateMessage, {
        parseMode: 'HTML'
      });
    }
  } catch (error) {
    console.error('Error sending game state update:', error);
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