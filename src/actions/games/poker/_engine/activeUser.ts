import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { GameHubContext } from '@/plugins';
import { getPokerRoom } from '../services/pokerService';
import { PokerRoom, PokerPlayer, PlayerId, RoomId } from '../types';
import PokerKeyboardService from '../services/pokerKeyboardService';
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
function extractUserInfo(ctx: GameHubContext): { userId: string; chatId: number } {
  return {
    userId: ctx.from?.id?.toString() || '0',
    chatId: ctx.chat?.id || 0
  };
}

/**
 * Handle active poker user - show current game state and appropriate actions
 */
export async function handlePokerActiveUser(
  ctx: GameHubContext, 
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
      ctx.log.warn('Room not found', { roomId });
      return;
    }
    
    // Check if user is still in the room
    const player = freshRoom.players.find(p => p.id === userId);
    if (!player) {
      ctx.log.warn('User not in room', { userId });
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
    ctx.log.error('Error handling active poker user', { error: error instanceof Error ? error.message : String(error) });
    ctx.log.error('Error displaying game status');
  }
}

/**
 * Handle waiting room state - show room info and appropriate actions
 */
async function handleWaitingRoomState(
  ctx: GameHubContext, 
  room: PokerRoom, 
  _player: PokerPlayer, 
  userId: PlayerId
): Promise<void> {
  // const isCreator = room.createdBy === userId;
  // const playerCount = room.players.length;
  // const maxPlayers = room.maxPlayers;
  
  // Debug logging
  ctx.log.debug('ACTIVE USER DEBUG', {
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
  const message = getRoomInfoForUser(room, userId, ctx);
  const keyboard = generateRoomInfoKeyboard(room, userId);
  
  try {
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  } catch (error) {
    ctx.log.error('Message update failed', { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Handle active game state - show game interface
 */
async function handleActiveGameState(
  ctx: GameHubContext, 
  room: PokerRoom, 
  player: PokerPlayer, 
  userId: PlayerId
): Promise<void> {
  const currentPlayer = room.players[room.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === userId;
  // const bettingRound = room.bettingRound; // TODO: Use when needed
  
  const { getGameStateForUser } = await import('../_utils/roomInfoHelper');
  let message = getGameStateForUser(room, userId, ctx);
  
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
  const keyboard = PokerKeyboardService.gameAction(room, userId, isMyTurn, ctx);
  
  try {
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  } catch (error) {
    ctx.log.error('Message update failed', { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Handle game end state - show results
 */
async function handleGameEndState(
  ctx: GameHubContext, 
  room: PokerRoom, 
  player: PokerPlayer
): Promise<void> {
  const endStatus = player.isFolded ? 'poker.game.status.folded' : player.isAllIn ? 'poker.game.status.allIn' : 'poker.game.status.active';
  const msg = ctx.t('poker.game.end.summary', { roomName: room.name, pot: String(room.pot), chips: String(player.chips), status: ctx.t(endStatus) });
  
  const keyboard = generateErrorKeyboard(); // Changed from generateLeaveRoomKeyboard()
  
  try {
    await ctx.replySmart(msg, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  } catch (error) {
    ctx.log.error('Message update failed', { error: error instanceof Error ? error.message : String(error) });
  }
} 