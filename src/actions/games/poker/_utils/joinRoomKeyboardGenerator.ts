import { PokerRoom, PlayerId } from '../types';
import { getRoomCapacityInfo } from './roomJoinValidation';

/**
 * Generate keyboard for room after successful join
 */
export function generateJoinSuccessKeyboard(
  room: PokerRoom,
  playerId: PlayerId,
  isCreator: boolean = false
): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const capacity = getRoomCapacityInfo(room);
  const hasMinimumPlayers = room.players.length >= 2;
  
  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
  
  // Add invite button if room is not full
  if (!capacity.isFull) {
    buttons.push([
      {
        text: '➕ دعوت بازیکن جدید',
        callback_data: `games.poker.room.share?roomId=${room.id}`
      }
    ]);
  }
  
  // Add start game button if conditions are met
  if (capacity.isFull && hasMinimumPlayers && isCreator) {
    buttons.push([
      {
        text: '🚀 شروع بازی',
        callback_data: `games.poker.room.start?roomId=${room.id}`
      }
    ]);
  }
  
  // Add view room info button
  buttons.push([
    {
      text: '📋 مشاهده اطلاعات روم',
      callback_data: `games.poker.room.info?roomId=${room.id}`
    }
  ]);
  
  // Add ready/not ready buttons
  buttons.push([
    {
      text: '✅ آماده',
      callback_data: `games.poker.room.ready?roomId=${room.id}`
    },
    {
      text: '⏸️ آماده نیستم',
      callback_data: `games.poker.room.notready?roomId=${room.id}`
    }
  ]);
  
  // Add leave button
  buttons.push([
    {
      text: '🚪 خروج از روم',
      callback_data: `games.poker.room.leave?roomId=${room.id}`
    }
  ]);
  
  // Add back to menu button
  buttons.push([
    {
      text: '🔙 بازگشت به منو',
      callback_data: 'games.poker.backToMenu'
    }
  ]);
  
  return { inline_keyboard: buttons };
}

/**
 * Generate error keyboard
 */
export function generateErrorKeyboard(): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  return {
    inline_keyboard: [
      [
        {
          text: '🔙 بازگشت به منو',
          callback_data: 'games.poker.backToMenu'
        }
      ]
    ]
  };
}

/**
 * Generate room full keyboard
 */
export function generateRoomFullKeyboard(): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  return {
    inline_keyboard: [
      [
        {
          text: '📋 مشاهده روم‌های دیگر',
          callback_data: 'games.poker.room.list'
        }
      ],
      [
        {
          text: '🏠 ساخت روم جدید',
          callback_data: 'games.poker.room.create'
        }
      ],
      [
        {
          text: '🔙 بازگشت به منو',
          callback_data: 'games.poker.backToMenu'
        }
      ]
    ]
  };
} 