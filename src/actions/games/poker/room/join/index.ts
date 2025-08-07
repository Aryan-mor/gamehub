import { Context } from 'grammy';
import { HandlerContext } from '@/modules/core/handler';
import { PlayerId, RoomId } from '../../types';
import { PokerRoom as RoomData } from '../../types';
import { UserId } from '@/utils/types';
import { joinPokerRoom, getPokerRoom } from '../../services/pokerService';
import { validateRoomId, validatePlayerId } from '../../_utils/typeGuards';
import { validateRoomJoin } from '../../_utils/roomJoinValidation';
// import { generateJoinRoomKeyboard } from '../../_utils/joinRoomKeyboardGenerator';
// import { getRoomInfoForUser, generateRoomInfoKeyboard } from '../../_utils/roomInfoHelper';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.join';

/**
 * Handle room join action
 */
async function handleJoin(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { roomId, r } = query;
  const roomIdParam = roomId || r;
  
  if (!roomIdParam) {
    throw new Error('Room ID is required');
  }
  
  try {
    logFunctionStart('handleJoin', { roomId: roomIdParam, userId: user.id });
    
    // Validate IDs
    const validatedRoomId = validateRoomId(roomIdParam);
    const validatedPlayerId = validatePlayerId(user.id.toString());
    
    // Get room information
    const room = await getPokerRoom(validatedRoomId);
    if (!room) {
      await ctx.reply('❌ Room not found');
      return;
    }
    
    // Validate join request
    const validation = await validateRoomJoin(room, validatedPlayerId);
    
    console.log(`🔍 JOIN VALIDATION RESULT:`, {
      isValid: validation.isValid,
      error: validation.error,
      activeRoom: validation.activeRoom?.id,
      targetRoom: room.id,
      playerId: validatedPlayerId
    });
    
    if (!validation.isValid) {
      // If user is in another room, show conflict resolution options
      if (validation.error && validation.error.includes('شما در روم') && validation.activeRoom) {
        await handleRoomJoinConflict(ctx, validation.activeRoom, validatedRoomId);
        return;
      } else {
        // Send new message instead of editing for better UX
        await ctx.reply(`❌ ${validation.error}`);
            return;
  }
  
  logFunctionEnd('handleRoomJoinConflictCallback', {}, { success: true });
}
    
    // Join the room
    const updatedRoom = await joinPokerRoom({
      roomId: validatedRoomId,
      playerId: validatedPlayerId,
      playerName: user.username || 'Unknown Player',
      username: user.username,
      chips: 1000, // Default starting chips
      chatId: ctx.chat?.id
    });
    
    // The room info has already been sent by joinPokerRoom service
    // No need to send another message here
    console.log('✅ Successfully called handleJoin for room', updatedRoom.id);
    
    logFunctionEnd('handleJoin', { success: true }, { roomId: roomIdParam, userId: user.id });
    
  } catch (error) {
    logError('handleJoin', error as Error, { roomId: roomIdParam, userId: user.id });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.reply(`❌ Failed to join room: ${errorMessage}`);
  }
}

/**
 * Handle room join conflict - user is already in another room
 */
async function handleRoomJoinConflict(
  ctx: Context,
  currentRoom: RoomData,
  targetRoomId: RoomId
): Promise<void> {
  const keyboard = {
    inline_keyboard: [
      [{ text: '🔙 بازگشت به روم فعلی', callback_data: `gpj_b:${currentRoom.id}` }],
      [{ text: '🔄 خروج و پیوستن', callback_data: `gpj_lj:${currentRoom.id}:${targetRoomId}` }],
      [{ text: ctx.t('poker.room.buttons.exitGame'), callback_data: `gpj_l:${currentRoom.id}` }]
    ]
  };
  
  logFunctionStart('handleRoomJoinConflict', {
    currentRoomId: currentRoom.id,
    targetRoomId: targetRoomId,
    callbackData: `gpj_lj:${currentRoom.id}:${targetRoomId}`,
    length: `gpj_lj:${currentRoom.id}:${targetRoomId}`.length
  });
  const message = `❌ شما در روم "${currentRoom.name}" هستید. ابتدا باید از آن روم خارج شوید.`;
  try {
    await ctx.editMessageText(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  } catch {
    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }
  
  logFunctionEnd('handleRoomJoinConflict', {}, { success: true });
}

/**
 * Handle room join conflict callback
 */
async function handleRoomJoinConflictCallback(
  ctx: Context,
  action: string,
  currentRoomId: RoomId,
  targetRoomId: RoomId | undefined,
  playerId: PlayerId
): Promise<void> {
  logFunctionStart('handleRoomJoinConflictCallback', {
    action,
    currentRoomId,
    targetRoomId,
    playerId
  });
  if (action === 'back') {
    // Show current room info
    const { getPokerRoom } = await import('../../services/pokerService');
    const { getRoomInfoForUser, generateRoomInfoKeyboard } = await import('../../_utils/roomInfoHelper');
    const room = await getPokerRoom(currentRoomId);
    if (room) {
      const info = getRoomInfoForUser(room, playerId);
      const keyboard = generateRoomInfoKeyboard(room, playerId);
      try {
        await ctx.editMessageText(info, { parse_mode: 'HTML', reply_markup: keyboard as any });
      } catch {
        await ctx.reply(info, { parse_mode: 'HTML', reply_markup: keyboard as any });
      }
    }
    return;
  }
  if (action === 'leave_join' && targetRoomId) {
    try {
      const { leavePokerRoom, joinPokerRoom, getPokerRoom } = await import('../../services/pokerService');
      await leavePokerRoom(currentRoomId, playerId);
      await joinPokerRoom({ roomId: targetRoomId, playerId, playerName: 'Unknown Player', chips: 1000 });
      const newRoom = await getPokerRoom(targetRoomId);
      if (newRoom) {
        const { getRoomInfoForUser, generateRoomInfoKeyboard } = await import('../../_utils/roomInfoHelper');
        const info = getRoomInfoForUser(newRoom, playerId);
        const keyboard = generateRoomInfoKeyboard(newRoom, playerId);
        try {
          await ctx.editMessageText(info, { parse_mode: 'HTML', reply_markup: keyboard as any });
        } catch {
          await ctx.reply(info, { parse_mode: 'HTML', reply_markup: keyboard as any });
        }
      }
    } catch {
      await ctx.editMessageText('❌ خطا در پیوستن به روم جدید. لطفاً دوباره تلاش کنید.', { parse_mode: 'HTML' });
    }
    return;
  }
  if (action === 'leave') {
    try {
      const { leavePokerRoom } = await import('../../services/pokerService');
      await leavePokerRoom(currentRoomId, playerId);
      
      // Use the main start game handler to show the main menu
      const { default: handleStartGame } = await import('../../../start');
      const context = {
        ctx,
        user: {
          id: playerId as unknown as UserId,
          username: 'Unknown'
        }
      };
      
      try {
        await handleStartGame(context);
      } catch {
        // Fallback to simple message if start game handler fails
        await ctx.editMessageText('✅ شما از روم خارج شدید و به صفحه اصلی بازگشتید.', { parse_mode: 'HTML' });
      }
    } catch {
      await ctx.editMessageText('❌ خطا در خروج از روم. لطفاً دوباره تلاش کنید.', { parse_mode: 'HTML' });
    }
    return;
  }
  
  logFunctionEnd('handleRoomJoinConflictCallback', {}, { success: true });
}

// Self-register with compact router
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from '../../compact-codes';

register(POKER_ACTIONS.JOIN_ROOM, handleJoin, 'Join Poker Room');

export { handleRoomJoinConflict, handleRoomJoinConflictCallback };
export default handleJoin; 