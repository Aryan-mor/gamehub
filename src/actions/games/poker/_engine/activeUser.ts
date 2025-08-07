import { Context } from 'grammy';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { getMessageUpdater } from '@/modules/core/messageUpdater';
import { getPokerRoom } from '../services/pokerService';
import { PokerRoom, PokerPlayer, PlayerId, RoomId } from '../types';
import { generateGameStateKeyboard } from '../_utils/gameActionKeyboardGenerator';
import { generateErrorKeyboard } from '../_utils/joinRoomKeyboardGenerator';
// import { roomUpdateService } from '../services/roomUpdateService';

interface PlayerState {
  gameType: 'poker';
  roomId: string;
  isActive: boolean;
  lastActivity: number;
}

/**
 * Extract user info from context
 */
function extractUserInfo(ctx: Context): { userId: string; chatId: number } {
  return {
    userId: ctx.from?.id?.toString() || '0',
    chatId: ctx.chat?.id || 0
  };
}

/**
 * Handle active poker user - show current game state and appropriate actions
 */
export async function handlePokerActiveUser(
  ctx: Context, 
  _playerState: PlayerState, 
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
      await handleGameEndState(ctx, freshRoom, player);
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
  player: PokerPlayer, 
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
  
  // Use the new room info format
  const { getRoomInfoForUser, generateRoomInfoKeyboard } = await import('../_utils/roomInfoHelper');
  const message = getRoomInfoForUser(room, userId);
  const keyboard = generateRoomInfoKeyboard(room, userId);
  
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
  player: PokerPlayer, 
  userId: PlayerId
): Promise<void> {
  const currentPlayer = room.players[room.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === userId;
  // const bettingRound = room.bettingRound; // TODO: Use when needed
  
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
  player: PokerPlayer
): Promise<void> {
  const message = `🏁 <b>بازی تمام شد!</b>\n\n` +
    `🏠 <b>روم:</b> ${room.name}\n` +
    `💰 <b>پات نهایی:</b> ${room.pot} سکه\n\n` +
    `📊 <b>وضعیت شما:</b>\n` +
    `• سکه‌ها: ${player.chips}\n` +
    `• وضعیت: ${player.isFolded ? '❌ تا شده' : player.isAllIn ? '🔥 همه چیز' : '✅ فعال'}\n\n` +
    `🎮 برای شروع بازی جدید، از منوی اصلی استفاده کنید.`;
  
  const keyboard = generateErrorKeyboard(); // Changed from generateLeaveRoomKeyboard()
  
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