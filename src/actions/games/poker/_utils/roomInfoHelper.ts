import { PokerRoom, PlayerId, PokerPlayer } from '../types';
import { createPokerActionCallback, createPokerActionCallbackWithParams } from './pokerActionHelper';

/**
 * Get personalized room information for a specific user
 */
export function getRoomInfoForUser(room: PokerRoom, userId: PlayerId): string {
  const isCreator = room.createdBy === userId;
  
  let message = `🏠 <b>اطلاعات روم پوکر</b>\n\n`;
  
  // Room basic info
  message += `📋 <b>مشخصات روم:</b>\n`;
  message += `• نام: ${room.name}\n`;
  message += `• شناسه: <code>${room.id}</code>\n`;
  message += `• وضعیت: ${getStatusDisplay(room.status)}\n`;
  message += `• نوع: ${room.isPrivate ? '🔒 خصوصی' : '🌐 عمومی'}\n\n`;
  
  // Game settings
  message += `⚙️ <b>تنظیمات بازی:</b>\n`;
  message += `• Small Blind: ${room.smallBlind} سکه\n`;
  message += `• Big Blind: ${room.bigBlind} سکه\n`;
  message += `• حداکثر بازیکن: ${room.maxPlayers} نفر\n`;
  message += `• تایم‌اوت نوبت: ${room.turnTimeoutSec} ثانیه\n\n`;
  
  // Players list
  message += `👥 <b>بازیکنان (${room.players.length}/${room.maxPlayers}):</b>\n`;
  
  room.players.forEach((player, index) => {
    const isPlayerCreator = player.id === room.createdBy;
    const isCurrentPlayer = player.id === userId;
    const creatorIcon = isPlayerCreator ? '🧑‍💼' : '';
    const currentPlayerIcon = isCurrentPlayer ? '📍' : '';
    const readyIcon = player.isReady ? '✅' : '⏳';
    
    // Use display name (first_name + last_name) instead of username for privacy
    // The display name should be in player.name, but fallback to username if needed
    const displayName = player.name || player.username || 'Unknown Player';
    
    message += `${index + 1}. ${creatorIcon}${currentPlayerIcon} ${displayName}`;
    
    message += ` ${readyIcon}`;
    
    if (isPlayerCreator) {
      message += ` <i>(سازنده)</i>`;
    }
    
    if (isCurrentPlayer) {
      message += ` <i>(شما)</i>`;
    }
    
    message += '\n';
  });
  
  message += '\n';
  
  // Room status specific info
  if (room.status === 'waiting') {
    message += `⏳ <b>وضعیت روم:</b>\n`;
    message += `• بازیکنان: ${room.players.length}/${room.maxPlayers}\n`;
    message += `• حداقل مورد نیاز: ${room.minPlayers} بازیکن\n\n`;
    
    if (isCreator && room.players.length >= room.minPlayers) {
      message += `🎮 <b>شما می‌توانید بازی را شروع کنید!</b>\n`;
    } else if (isCreator) {
      message += `⏳ <b>منتظر بازیکنان بیشتر...</b>\n`;
    } else {
      message += `⏳ <b>منتظر شروع بازی توسط سازنده...</b>\n`;
    }
  } else if (room.status === 'active' || room.status === 'playing') {
    message += `🎮 <b>بازی در حال اجرا</b>\n`;
    message += `• پات: ${room.pot} سکه\n`;
    message += `• دور: ${room.round || room.bettingRound}\n`;
    if (room.currentPlayerIndex < room.players.length) {
      const currentPlayer = room.players[room.currentPlayerIndex];
      const displayName = currentPlayer.name || currentPlayer.username || 'Unknown Player';
      message += `• نوبت: ${displayName}\n`;
    }
  }
  
  // Add timestamp
  const now = new Date();
  const timestamp = now.toLocaleDateString('fa-IR', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }) + ' ' + now.toLocaleTimeString('fa-IR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  message += `\nآخرین بروزرسانی: ${timestamp} (به زمان کاربر)`;
  
  return message;
}

/**
 * Generate keyboard for room information based on user role
 */
export function generateRoomInfoKeyboard(room: PokerRoom, userId: PlayerId): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string } | { text: string; switch_inline_query: string }>>
} {
  const isCreator = room.createdBy === userId;
  const canStartGame = isCreator && room.players.length >= room.minPlayers && room.status === 'waiting';
  
  const buttons: Array<Array<{ text: string; callback_data: string } | { text: string; switch_inline_query: string }>> = [];
  
  // Start Game button (only for creator when conditions are met)
  if (canStartGame) {
    buttons.push([
      {
        text: '🎮 شروع بازی',
        callback_data: createPokerActionCallback('START_GAME', room.id)
      }
    ]);
  }
  
  // Share button (only when room is not full) - using switch_inline_query to open contacts
  const isRoomFull = room.players.length >= room.maxPlayers;
  console.log(`🔍 ROOM STATUS CHECK: ${room.name} - Players: ${room.players.length}/${room.maxPlayers} - Is Full: ${isRoomFull}`);
  
  if (!isRoomFull) {
    const shareInlineQuery = `gpj-${room.id}`;
    console.log(`🔍 SHARE BUTTON INLINE QUERY: ${shareInlineQuery}`);
    buttons.push([
      {
        text: '📤 اشتراک‌گذاری',
        switch_inline_query: shareInlineQuery
      } as { text: string; switch_inline_query: string }
    ]);
  } else {
    console.log(`🔍 SHARE BUTTON HIDDEN: Room ${room.name} is full (${room.players.length}/${room.maxPlayers})`);
  }
  
  // Refresh and Leave buttons (always available)
  buttons.push([
    {
      text: '🔁 بروزرسانی',
      callback_data: createPokerActionCallback('ROOM_INFO', room.id)
    },
    {
      text: '🚪 خروج از روم',
      callback_data: createPokerActionCallback('LEAVE_ROOM', room.id)
    }
  ]);
  
  // Back to menu button
  buttons.push([
    {
      text: '🔙 بازگشت به منو',
      callback_data: createPokerActionCallback('BACK_TO_MENU', room.id)
    }
  ]);
  
  return { inline_keyboard: buttons };
}

/**
 * Generate keyboard for kick player selection
 */
export function generateKickPlayerKeyboard(room: PokerRoom, kickablePlayers: PokerPlayer[]): {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>
} {
  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
  
  // Add kick buttons for each player (max 2 per row)
  for (let i = 0; i < kickablePlayers.length; i += 2) {
    const row: Array<{ text: string; callback_data: string }> = [];
    
    // First player in row
    const player1 = kickablePlayers[i];
    row.push({
      text: `👢 ${player1.name}`,
      callback_data: createPokerActionCallbackWithParams('KICK_PLAYER', { roomId: room.id, targetPlayerId: player1.id })
    });
    
    // Second player in row (if exists)
    if (i + 1 < kickablePlayers.length) {
      const player2 = kickablePlayers[i + 1];
      row.push({
        text: `👢 ${player2.name}`,
        callback_data: createPokerActionCallbackWithParams('KICK_PLAYER', { roomId: room.id, targetPlayerId: player2.id })
      });
    }
    
    buttons.push(row);
  }
  
  // Navigation buttons
  buttons.push([
    {
      text: '🔙 بازگشت به اطلاعات روم',
      callback_data: createPokerActionCallback('ROOM_INFO', room.id)
    }
  ]);
  
  buttons.push([
    {
      text: '🔙 بازگشت به منو',
      callback_data: createPokerActionCallback('BACK_TO_MENU', room.id)
    }
  ]);
  
  return { inline_keyboard: buttons };
}

/**
 * Get display text for room status
 */
function getStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'waiting': '⏳ منتظر بازیکنان',
    'active': '🎮 فعال',
    'playing': '🎮 در حال بازی',
    'finished': '🏁 تمام شده',
    'cancelled': '❌ لغو شده'
  };
  
  return statusMap[status] || status;
} 