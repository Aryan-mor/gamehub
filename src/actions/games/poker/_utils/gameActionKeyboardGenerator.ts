import { PokerRoom, PlayerId } from '../types';

/**
 * Generate game action keyboard for current player
 */
export function generateGameActionKeyboard(
  room: PokerRoom,
  playerId: PlayerId,
  isCurrentPlayer: boolean
): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  if (!isCurrentPlayer) {
    // Show waiting keyboard for non-current players
    return {
      inline_keyboard: [
        [
          {
            text: '🔄 بروزرسانی',
            callback_data: `games.poker.room.game.refresh?roomId=${room.id}`
          }
        ],
        [
          {
            text: '🚪 خروج از بازی',
            callback_data: `games.poker.room.leave?roomId=${room.id}`
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
        callback_data: `games.poker.room.call?roomId=${room.id}`
      }
    ]);
  } else {
    buttons.push([
      {
        text: '👁️ Check',
        callback_data: `games.poker.room.check?roomId=${room.id}`
      }
    ]);
  }
  
  // Fold button
  buttons.push([
    {
      text: '❌ Fold',
      callback_data: `games.poker.room.fold?roomId=${room.id}`
    }
  ]);
  
  // Raise buttons (if player has enough chips)
  const canRaise = currentPlayer.balance > room.currentBet;
  if (canRaise) {
    const raiseOptions = generateRaiseOptions(room, currentPlayer);
    buttons.push(raiseOptions);
  }
  
  // All-in button (if player has chips)
  if (currentPlayer.balance > 0) {
    buttons.push([
      {
        text: '🔥 All In',
        callback_data: `games.poker.room.allin?roomId=${room.id}`
      }
    ]);
  }
  
  // Navigation buttons
  buttons.push([
    {
      text: '🚪 خروج از بازی',
      callback_data: `games.poker.room.leave?roomId=${room.id}`
    }
  ]);
  
  return { inline_keyboard: buttons };
}

/**
 * Generate raise options
 */
function generateRaiseOptions(room: PokerRoom, player: any): Array<{ text: string; callback_data: string }> {
  const minRaise = room.minRaise;
  const playerBalance = player.balance;
  const currentBet = room.currentBet;
  
  const options: Array<{ text: string; callback_data: string }> = [];
  
  // Calculate raise amounts
  const raiseAmounts = [
    minRaise,
    minRaise * 2,
    minRaise * 3,
    playerBalance
  ].filter(amount => amount <= playerBalance && amount > currentBet);
  
  // Add raise buttons
  for (const amount of raiseAmounts.slice(0, 3)) { // Limit to 3 buttons
    options.push({
      text: `💰 +${amount}`,
      callback_data: `games.poker.room.raise?roomId=${room.id}&amount=${amount}`
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
          callback_data: 'games.poker.backToMenu'
        }
      ]
    ]
  };
}

/**
 * Generate game state keyboard for active players
 */
export function generateGameStateKeyboard(room: PokerRoom, player: any, isMyTurn: boolean): {
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
          callback_data: `gpcall?roomId=${room.id}`
        }
      ]);
    } else {
      buttons.push([
        {
          text: '👁️ Check',
          callback_data: `gpchk?roomId=${room.id}`
        }
      ]);
    }
    
    buttons.push([
      {
        text: '❌ Fold',
        callback_data: `gpfld?roomId=${room.id}`
      }
    ]);
    
    // Raise button
    if (player.chips > room.currentBet) {
      buttons.push([
        {
          text: '💰 Raise',
          callback_data: `gprse?roomId=${room.id}`
        }
      ]);
    }
    
    // All-in button
    if (player.chips > 0) {
      buttons.push([
        {
          text: '🔥 All In',
          callback_data: `gpall?roomId=${room.id}`
        }
      ]);
    }
  } else {
    // Waiting for other player
    buttons.push([
      {
        text: '🔄 بروزرسانی',
        callback_data: `gpref?roomId=${room.id}`
      }
    ]);
  }
  
  // Navigation buttons
  buttons.push([
    {
      text: '🚪 خروج از بازی',
      callback_data: `gpl?roomId=${room.id}`
    }
  ]);
  
  return { inline_keyboard: buttons };
}

/**
 * Generate waiting room keyboard
 */
export function generateWaitingRoomKeyboard(roomId: string, canStart: boolean): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
  
  // Ready/Not Ready buttons removed - players are automatically ready
  
  // Start game button (only for creator when ready)
  if (canStart) {
    buttons.push([
      {
        text: '🎮 شروع بازی',
        callback_data: `gpsg?roomId=${roomId}`
      }
    ]);
  }
  
  // Room management buttons
  buttons.push([
    {
      text: '👥 دعوت دوستان',
      switch_inline_query: `join_room_${roomId}`
    },
    {
      text: '📊 اطلاعات روم',
      callback_data: `gpinf?roomId=${roomId}`
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