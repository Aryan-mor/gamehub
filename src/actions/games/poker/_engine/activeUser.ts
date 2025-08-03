import { Context } from 'grammy';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { extractUserInfo } from '@/modules/core/telegramHelpers';
import { getMessageUpdater } from '@/modules/core/messageUpdater';
import { getPokerRoom } from '../services/pokerService';
import { PokerRoom, PlayerId, RoomId } from '../types';
import { generateGameStateKeyboard, generateWaitingRoomKeyboard } from '../_utils/gameActionKeyboardGenerator';
import { generateLeaveRoomKeyboard } from '../_utils/joinRoomKeyboardGenerator';
import { roomUpdateService } from '../services/roomUpdateService';

interface PlayerState {
  gameType: 'poker';
  roomId: string;
  isActive: boolean;
  lastActivity: number;
}

/**
 * Handle active poker user - show current game state and appropriate actions
 */
export async function handlePokerActiveUser(
  ctx: Context, 
  playerState: PlayerState, 
  room: PokerRoom
): Promise<void> {
  try {
    const userInfo = extractUserInfo(ctx);
    const userId = userInfo.userId as PlayerId;
    const roomId = room.id as RoomId;
    
    logFunctionStart('handlePokerActiveUser', { 
      userId, 
      roomId, 
      gameStatus: room.status 
    });
    
    // Get fresh room data
    const freshRoom = await getPokerRoom(roomId);
    if (!freshRoom) {
      console.log('❌ Room not found:', roomId);
      return;
    }
    
    // Check if user is still in the room
    const player = freshRoom.players.find(p => p.id === userId);
    if (!player) {
      console.log('❌ User not in room:', userId);
      return;
    }
    
    // Handle different game states
    if (freshRoom.status === 'waiting') {
      await handleWaitingRoomState(ctx, freshRoom, player, userId);
    } else if (freshRoom.status === 'playing') {
      await handleActiveGameState(ctx, freshRoom, player, userId);
    } else {
      await handleGameEndState(ctx, freshRoom, player, userId);
    }
    
    logFunctionEnd('handlePokerActiveUser', {}, { 
      userId, 
      roomId, 
      gameStatus: freshRoom.status 
    });
    
  } catch (error) {
    logError('handlePokerActiveUser', error as Error, {});
    console.error('Error handling active poker user:', error);
    console.log('❌ Error displaying game status');
  }
}

/**
 * Handle waiting room state - show room info and appropriate actions
 */
async function handleWaitingRoomState(
  ctx: Context, 
  room: PokerRoom, 
  player: any, 
  userId: PlayerId
): Promise<void> {
  const isCreator = room.createdBy === userId;
  const playerCount = room.players.length;
  const maxPlayers = room.maxPlayers;
  
  // Debug logging
  console.log(`🔍 ACTIVE USER DEBUG:`, {
    roomId: room.id,
    roomName: room.name,
    maxPlayers: room.maxPlayers,
    playerCount: room.players.length,
    currentUserId: userId,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      username: p.username,
      isCurrentUser: p.id === userId
    }))
  });
  
  // Get room updates
  const notificationMessage = roomUpdateService.getNotificationMessage(room);
  
  let message = `🏠 <b>روم پوکر: ${room.name}</b>\n\n`;
  
  // Add notification if any
  if (notificationMessage) {
    message += `📢 <b>آخرین تغییرات:</b>\n${notificationMessage}\n\n`;
  }
  
  // Add room full notification for admin
  const isAdmin = room.createdBy === userId;
  const isRoomFull = room.players.length >= room.maxPlayers;
  if (isAdmin && isRoomFull) {
    message += `🎉 <b>روم پر شد!</b>\n` +
      `همه بازیکنان حاضر هستند. می‌توانید بازی را شروع کنید.\n\n`;
  }
  
  message += `📊 <b>وضعیت روم:</b>\n` +
    `• بازیکنان: ${playerCount}/${maxPlayers}\n` +
    `• Small Blind: ${room.smallBlind} سکه\n` +
    `• تایم‌اوت: ${room.turnTimeoutSec || 60} ثانیه\n` +
    `• نوع: ${room.isPrivate ? '🔒 خصوصی' : '🌐 عمومی'}\n\n` +
    `👥 <b>بازیکنان حاضر:</b>\n` +
    `${room.players.map(p => {
      // Use display name (first_name + last_name) instead of username for privacy
      const displayName = p.name || 'Unknown Player';
      const status = p.isReady ? '✅' : '⏸️';
      const isCurrentUser = p.id === userId ? ' (شما)' : '';
      return `• ${displayName} ${status}${isCurrentUser}`;
    }).join('\n')}\n\n` +
    `📊 <b>وضعیت شما:</b>\n` +
    `• سکه‌ها: ${player.chips}\n` +
    `• آماده: ✅ بله (اتوماتیک)\n\n`;
  
  let keyboard;
  if (isCreator) {
    // Creator can start game if enough players are ready
    const readyPlayers = room.players.filter(p => p.isReady).length;
    const canStart = readyPlayers >= room.minPlayers;
    
    if (canStart) {
      message += `🎮 <b>آماده شروع بازی!</b>\n` +
        `همه بازیکنان آماده هستند. می‌توانید بازی را شروع کنید.`;
      keyboard = generateWaitingRoomKeyboard(room.id, true); // Show start button
    } else if (isRoomFull) {
      message += `⏳ <b>در انتظار شروع بازی</b>\n` +
        `روم پر شده است. منتظر شروع بازی توسط سازنده هستیم.`;
      keyboard = generateWaitingRoomKeyboard(room.id, false);
    } else {
      message += `⏳ <b>در انتظار بازیکنان</b>\n` +
        `نیاز به ${room.minPlayers - readyPlayers} بازیکن دیگر برای شروع بازی.`;
      keyboard = generateWaitingRoomKeyboard(room.id, false);
    }
  } else {
    // Regular player can toggle ready status or leave
    message += `⏳ <b>در انتظار شروع بازی</b>\n` +
      `سازنده روم بازی را شروع خواهد کرد.`;
    keyboard = generateWaitingRoomKeyboard(room.id, false);
  }
  
  try {
    const messageUpdater = getMessageUpdater();
    const result = await messageUpdater.updateMessageWithKeyboard(
      ctx.chat?.id || 0,
      ctx.message?.message_id,
      message,
      keyboard
    );
    
    if (result.success) {
      console.log(`✅ Message updated successfully, new message ID: ${result.newMessageId}`);
      
      // Store new message ID if it's different from the original
      if (result.newMessageId && result.newMessageId !== ctx.message?.message_id) {
        console.log(`💾 New message ID ${result.newMessageId} should be stored in database`);
        // TODO: Store new message ID in database for future updates
      }
    } else {
      console.log(`❌ Failed to update message:`, result.error);
    }
  } catch (error) {
    console.log(`❌ Message update failed:`, error);
  }
}

/**
 * Handle active game state - show game interface
 */
async function handleActiveGameState(
  ctx: Context, 
  room: PokerRoom, 
  player: any, 
  userId: PlayerId
): Promise<void> {
  const currentPlayer = room.players[room.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === userId;
  const bettingRound = room.bettingRound;
  
  let message = `🎮 <b>بازی پوکر در حال اجرا</b>\n\n` +
    `🏠 <b>روم:</b> ${room.name}\n` +
    `💰 <b>پات:</b> ${room.pot} سکه\n` +
    `🎯 <b>شرط فعلی:</b> ${room.currentBet} سکه\n\n`;
  
  // Show community cards if any
  if (room.communityCards && room.communityCards.length > 0) {
    message += `🃏 <b>کارت‌های مشترک:</b>\n` +
      `${room.communityCards.map(card => `[${card}]`).join(' ')}\n\n`;
  }
  
  // Show player's hand (private)
  if (player.cards && player.cards.length > 0) {
    message += `🎴 <b>کارت‌های شما:</b>\n` +
      `${player.cards.map(card => `[${card}]`).join(' ')}\n\n`;
  }
  
  // Show current player and turn status
  if (isMyTurn) {
    message += `🎯 <b>نوبت شماست!</b>\n` +
      `لطفاً تصمیم خود را بگیرید.`;
  } else {
    message += `⏳ <b>نوبت:</b> ${currentPlayer?.name || 'نامشخص'}\n` +
      `در انتظار تصمیم بازیکن...`;
  }
  
  // Show player status
  message += `\n\n📊 <b>وضعیت شما:</b>\n` +
    `• سکه‌ها: ${player.chips}\n` +
    `• شرط فعلی: ${player.betAmount}\n` +
    `• وضعیت: ${player.isFolded ? '❌ تا شده' : player.isAllIn ? '🔥 همه چیز' : '✅ فعال'}`;
  
  // Generate appropriate keyboard based on turn and game state
  const keyboard = generateGameStateKeyboard(room, player, isMyTurn);
  
  try {
    const messageUpdater = getMessageUpdater();
    const result = await messageUpdater.updateMessageWithKeyboard(
      ctx.chat?.id || 0,
      ctx.message?.message_id,
      message,
      keyboard
    );
    
    if (result.success) {
      console.log(`✅ Message updated successfully`);
    } else {
      console.log(`❌ Failed to update message:`, result.error);
    }
  } catch (error) {
    console.log(`❌ Message update failed:`, error);
  }
}

/**
 * Handle game end state - show results
 */
async function handleGameEndState(
  ctx: Context, 
  room: PokerRoom, 
  player: any, 
  userId: PlayerId
): Promise<void> {
  const message = `🏁 <b>بازی تمام شد!</b>\n\n` +
    `🏠 <b>روم:</b> ${room.name}\n` +
    `💰 <b>پات نهایی:</b> ${room.pot} سکه\n\n` +
    `📊 <b>وضعیت شما:</b>\n` +
    `• سکه‌ها: ${player.chips}\n` +
    `• وضعیت: ${player.isFolded ? '❌ تا شده' : player.isAllIn ? '🔥 همه چیز' : '✅ فعال'}\n\n` +
    `🎮 برای شروع بازی جدید، از منوی اصلی استفاده کنید.`;
  
  const keyboard = generateLeaveRoomKeyboard();
  
  try {
    const messageUpdater = getMessageUpdater();
    const result = await messageUpdater.updateMessageWithKeyboard(
      ctx.chat?.id || 0,
      ctx.message?.message_id,
      message,
      keyboard
    );
    
    if (result.success) {
      console.log(`✅ Message updated successfully`);
    } else {
      console.log(`❌ Failed to update message:`, result.error);
    }
  } catch (error) {
    console.log(`❌ Message update failed:`, error);
  }
} 