import { HandlerContext, createHandler } from '@/modules/core/handler';
import { isValidUserId } from '@/utils/typeGuards';
import { removePlayer, getRoom, broadcastRoomInfo } from '../services/roomService';
import { ROUTES } from '@/modules/core/routes.generated';

export const key = 'games.poker.room.leave';

/**
 * Handle poker room leave action
 * Removes the user from the room and shows games.start menu
 */
async function handleLeaveRoom(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { roomId, r } = query;
  const roomIdParam = roomId || r;

  ctx.log.info('Poker leave room handler called', { userId: user.id, roomId: roomIdParam });

  // Validate user ID
  if (!isValidUserId(user.id)) {
    throw new Error('Invalid user ID');
  }

  if (!roomIdParam) {
    throw new Error('Room ID is required');
  }

  try {
    // Check if room exists and user is in it
    const room = await getRoom(roomIdParam);
    if (!room) {
      throw new Error('Room not found');
    }

    const userId = user.id.toString();
    if (!room.players.includes(userId)) {
      throw new Error('You are not in this room');
    }

    // Remove player from room
    await removePlayer(roomIdParam, userId);
    ctx.log.info('Player removed from room', { userId, roomId: roomIdParam });

    // Get updated room state
    const updatedRoom = await getRoom(roomIdParam);
    
    // If room still exists, broadcast updated info to remaining players
    if (updatedRoom && updatedRoom.players.length > 0) {
      await broadcastRoomInfo(ctx, roomIdParam);
      ctx.log.info('Broadcasted room update to remaining players', { roomId: roomIdParam });
    }

    // Show games.start action (main games menu)
    const message = ctx.t('poker.room.leave.success');
    
    // Create keyboard that navigates to games.start (main games menu)
    const keyboard = {
      inline_keyboard: [
        [{ text: ctx.t('bot.buttons.backToGames'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.start) }]
      ]
    };

    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });

    ctx.log.info('Leave room action completed successfully', { userId, roomId: roomIdParam });

  } catch (error) {
    ctx.log.error('Leave room error', { 
      error: error instanceof Error ? error.message : String(error),
      userId: user.id,
      roomId: roomIdParam
    });

    const errorMessage = error instanceof Error ? error.message : ctx.t('bot.error.generic');
    await ctx.replySmart(ctx.t('poker.room.leave.error', { error: errorMessage }), {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: ctx.t('bot.buttons.back'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.start) }
        ]]
      }
    });
  }
}

export default createHandler(handleLeaveRoom);
