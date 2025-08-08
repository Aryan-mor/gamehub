import { GameHubContext } from '@/plugins';
import { HandlerContext, createHandler } from '@/modules/core/handler';
import { RoomId } from '../../types';
import { PokerRoom as RoomData } from '../../types';
// import { UserId } from '@/utils/types';
import { joinPokerRoom, getPokerRoom } from '../../services/pokerService';
import { validateRoomId } from '../../_utils/typeGuards';
import { validateRoomJoin } from '../../_utils/roomJoinValidation';
import { JoinQuerySchema } from '../../_utils/schemas';
import { validatePlayerIdWithError } from '../../_utils/pokerUtils';
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
  const { roomId: roomIdParam } = JoinQuerySchema.parse(query);
  
  // roomIdParam validated by Zod
  
  try {
    logFunctionStart('handleJoin', { roomId: roomIdParam, userId: user.id });
    
    // Validate IDs
    const validatedRoomId = validateRoomId(roomIdParam);
    const validatedPlayerId = validatePlayerIdWithError(user.id.toString());
    
    // Get room information
    const room = await getPokerRoom(validatedRoomId);
    if (!room) {
      await ctx.replySmart(ctx.t('poker.room.error.notFound'));
      return;
    }
    
    // Validate join request
    const validation = await validateRoomJoin(ctx, room, validatedPlayerId);
    
    ctx.log.debug('JOIN VALIDATION RESULT', {
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
        await ctx.replySmart(ctx.t('poker.room.error.joinFailed', { error: validation.error || '' }));
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
    ctx.log.info('Successfully called handleJoin for room', { roomId: updatedRoom.id });
    
    logFunctionEnd('handleJoin', { success: true }, { roomId: roomIdParam, userId: user.id });
    
  } catch (error) {
    logError('handleJoin', error as Error, { roomId: roomIdParam, userId: user.id });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(ctx.t('poker.room.error.joinFailed', { error: errorMessage }));
  }
}

/**
 * Handle room join conflict - user is already in another room
 */
async function handleRoomJoinConflict(
  ctx: GameHubContext,
  currentRoom: RoomData,
  targetRoomId: RoomId
): Promise<void> {
  const keyboard = {
    inline_keyboard: [
      [{ text: ctx.t('poker.room.buttons.backToRoomInfo'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.info', { roomId: currentRoom.id }) }],
      [
        { text: ctx.t('poker.room.buttons.leave'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.leave', { roomId: currentRoom.id }) },
        targetRoomId ? { text: ctx.t('poker.room.buttons.joinTarget'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.join', { roomId: targetRoomId }) } : { text: ctx.t('poker.room.buttons.joinTarget'), callback_data: ctx.keyboard.buildCallbackData('games.poker.start', {}) }
      ]
    ]
  };
  
  logFunctionStart('handleRoomJoinConflict', {
    currentRoomId: currentRoom.id,
    targetRoomId: targetRoomId
  });
  const message = ctx.t('poker.room.join.conflict', { roomName: currentRoom.name });
  try {
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  } catch {
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }
  
  logFunctionEnd('handleRoomJoinConflict', {}, { success: true });
}

export { handleRoomJoinConflict };
export default createHandler(handleJoin); 