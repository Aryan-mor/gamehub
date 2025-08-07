import { PokerRoom, PokerPlayer, PlayerId } from '../types';
import { createPokerActionCallback, createPokerActionCallbackWithParams } from './pokerActionHelper';
import { RoomId } from '@/utils/types';
import { GameHubContext } from '@/plugins';

/**
 * Generate game action keyboard for current player
 * Note: This function requires ctx to be passed from the handler
 */
export function generateGameActionKeyboard(
  room: PokerRoom,
  playerId: PlayerId,
  isCurrentPlayer: boolean,
  ctx?: GameHubContext
): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  if (!ctx) {
    throw new Error('Context is required for generateGameActionKeyboard');
  }

  if (!isCurrentPlayer) {
    // Show waiting keyboard for non-current players
    return {
      inline_keyboard: [
        [
          {
            text: ctx.t('bot.poker.buttons.utility.refresh'),
            callback_data: createPokerActionCallback('REFRESH_GAME', room.id)
          }
        ],
        [
          {
            text: ctx.t('bot.poker.buttons.room.leave'),
            callback_data: createPokerActionCallback('LEAVE_ROOM', room.id)
          }
        ]
      ]
    };
  }
  
  const currentPlayer = room.players.find(p => p.id === playerId);
  if (!currentPlayer) {
    return generateErrorKeyboard();
  }
  
  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
  
  // Check if player can call
  const canCall = currentPlayer.betAmount < room.currentBet;
  const callAmount = room.currentBet - currentPlayer.betAmount;
  
  if (canCall) {
    buttons.push([
      {
        text: `🃏 Call (${callAmount})`,
        callback_data: createPokerActionCallback('CALL', room.id)
      }
    ]);
  } else {
    buttons.push([
      {
        text: ctx.t('bot.poker.buttons.game.check'),
        callback_data: createPokerActionCallback('CHECK', room.id)
      }
    ]);
  }
  
  // Fold button
  buttons.push([
    {
      text: ctx.t('bot.poker.buttons.game.fold'),
      callback_data: createPokerActionCallback('FOLD', room.id)
    }
  ]);
  
  // Raise buttons (if player has enough chips)
  const canRaise = (currentPlayer.chips || 0) > room.currentBet;
  if (canRaise) {
    const raiseOptions = generateRaiseOptions(room, currentPlayer);
    buttons.push(raiseOptions);
  }
  
  // All-in button (if player has chips)
  if ((currentPlayer.chips || 0) > 0) {
    buttons.push([
      {
        text: ctx.t('bot.poker.buttons.game.allIn'),
        callback_data: createPokerActionCallback('ALL_IN', room.id)
      }
    ]);
  }
  
  // Navigation buttons
  buttons.push([
    {
      text: '🚪 خروج از بازی',
      callback_data: createPokerActionCallback('LEAVE_ROOM', room.id)
    }
  ]);
  
  return { inline_keyboard: buttons };
}

/**
 * Generate raise options
 */
function generateRaiseOptions(room: PokerRoom, player: PokerPlayer): Array<{ text: string; callback_data: string }> {
  const minRaise = room.minRaise;
  const playerChips = player.chips || 0;
  const currentBet = room.currentBet;
  
  const options: Array<{ text: string; callback_data: string }> = [];
  
  // Calculate raise amounts
  const raiseAmounts = [
    minRaise,
    minRaise * 2,
    minRaise * 3,
    playerChips
  ].filter(amount => amount <= playerChips && amount > currentBet);
  
  // Add raise buttons
  for (const amount of raiseAmounts.slice(0, 3)) { // Limit to 3 buttons
    options.push({
      text: `💰 +${amount}`,
      callback_data: createPokerActionCallbackWithParams('RAISE', { roomId: room.id, amount: amount.toString() })
    });
  }
  
  return options;
}

/**
 * Generate error keyboard
 */
function generateErrorKeyboard(): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  return {
    inline_keyboard: [
      [
        {
          text: '🔙 بازگشت به منو',
          callback_data: createPokerActionCallbackWithParams('BACK', {})
        }
      ]
    ]
  };
}

/**
 * Generate game state keyboard for active players
 */
export function generateGameStateKeyboard(room: PokerRoom, player: PokerPlayer, isMyTurn: boolean): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
  
  if (isMyTurn) {
    // Game action buttons for current player
    const canCall = player.betAmount < room.currentBet;
    const callAmount = room.currentBet - player.betAmount;
    
    if (canCall) {
      buttons.push([
        {
          text: `🃏 Call (${callAmount})`,
          callback_data: createPokerActionCallback('CALL', room.id)
        }
      ]);
    } else {
      buttons.push([
        {
          text: '👁️ Check',
          callback_data: createPokerActionCallback('CHECK', room.id)
        }
      ]);
    }
    
    buttons.push([
      {
        text: '❌ Fold',
        callback_data: createPokerActionCallback('FOLD', room.id)
      }
    ]);
    
    // Raise button
    if (player.chips > room.currentBet) {
      buttons.push([
        {
          text: '💰 Raise',
          callback_data: createPokerActionCallback('RAISE', room.id)
        }
      ]);
    }
    
    // All-in button
    if (player.chips > 0) {
      buttons.push([
        {
          text: '🔥 All In',
          callback_data: createPokerActionCallback('ALL_IN', room.id)
        }
      ]);
    }
  } else {
    // Waiting for other player
    buttons.push([
      {
        text: '🔄 بروزرسانی',
        callback_data: createPokerActionCallback('REFRESH_GAME', room.id)
      }
    ]);
  }
  
  // Navigation buttons
  buttons.push([
    {
      text: '🚪 خروج از بازی',
      callback_data: createPokerActionCallback('LEAVE_ROOM', room.id)
    }
  ]);
  
  return { inline_keyboard: buttons };
}

/**
 * Generate waiting room keyboard
 */
export function generateWaitingRoomKeyboard(roomId: RoomId, canStart: boolean): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
  
  // Ready/Not Ready buttons removed - players are automatically ready
  
  // Start game button (only for creator when ready)
  if (canStart) {
    buttons.push([
      {
        text: '🎮 شروع بازی',
        callback_data: createPokerActionCallback('START_GAME', roomId)
      }
    ]);
  }
  
  // Room management buttons
  buttons.push([
    {
      text: '👥 Invite Friends',
      callback_data: `games.poker.room.share?roomId=${roomId}`
    },
    {
      text: '📊 Room Info',
      callback_data: `games.poker.room.info?roomId=${roomId}`
    }
  ]);
  
  // Leave room button
  buttons.push([
    {
      text: '🚪 خروج از روم',
      callback_data: `gpl?roomId=${roomId}`
    }
  ]);
  
  return { inline_keyboard: buttons };
} 