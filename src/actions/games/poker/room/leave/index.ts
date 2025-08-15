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
  
  // Resolve roomId from query parameters using the same pattern as other handlers
  let roomIdParam: string = context._query?.roomId || query.roomId || query.r || '';
  
  // Try to get from active room state if not in query
  if (!roomIdParam) {
    const { getActiveRoomId } = await import('@/modules/core/userRoomState');
    roomIdParam = getActiveRoomId(String(user.id)) || '';
  }
  
  // Try to get from form state as fallback
  if (!roomIdParam) {
    const saved = ctx.formState?.get<{ roomId?: string }>('poker.info', user.id);
    roomIdParam = saved?.roomId || '';
  }

  ctx.log.info('Poker leave room handler called', { 
    userId: user.id, 
    roomId: roomIdParam,
    queryRoomId: context._query?.roomId,
    fallbackUsed: !context._query?.roomId
  });

  // Validate user ID
  if (!isValidUserId(user.id)) {
    throw new Error('Invalid user ID');
  }

  if (!roomIdParam) {
    throw new Error('Room ID is required');
  }

  try {
    // Confirmation step: require c=1 to proceed
    const confirmed = context._query?.c === '1' || query.c === '1';
    if (!confirmed) {
      const yesCb = `g.pk.r.lv?r=${roomIdParam}&c=1`;
      const backCb = `g.pk.r.in?r=${roomIdParam}`;
      await ctx.replySmart(ctx.t('poker.room.leave.confirm') || 'Are you sure you want to leave?', {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: ctx.t('bot.buttons.yes') || '✅ Yes', callback_data: yesCb },
            { text: ctx.t('poker.room.buttons.backToRoomInfo') || '🔙 Back to Room Info', callback_data: backCb }
          ]]
        }
      });
      return;
    }
    ctx.log.info('Starting leave room process', { userId: user.id, roomId: roomIdParam });

    // Check if room exists and user is in it
    const room = await getRoom(roomIdParam);
    ctx.log.info('Room lookup result', { roomFound: !!room, roomId: roomIdParam });
    
    if (!room) {
      throw new Error('Room not found');
    }

    const telegramUserId = user.id.toString();
    
    // Convert Telegram ID to UUID to match the format used in the database
    const { ensureUserUuid } = await import('../services/roomRepo');
    const userUuid = await ensureUserUuid(telegramUserId);
    
    ctx.log.info('Checking if user is in room', { 
      telegramUserId, 
      userUuid, 
      playersInRoom: room.players, 
      userInRoom: room.players.includes(userUuid) 
    });
    
    if (!room.players.includes(userUuid)) {
      throw new Error('You are not in this room');
    }

    // If room is in playing state, fold user first when still in-hand (to avoid blocking the hand)
    try {
      const roomStatus: string | undefined = (room as any)?.status;
      if (roomStatus === 'playing') {
        const { supabaseFor } = await import('@/lib/supabase');
        const poker = supabaseFor('poker');
        const { data: hands } = await poker
          .from('hands')
          .select('*')
          .eq('room_id', roomIdParam)
          .order('created_at', { ascending: false })
          .limit(1);
        const hand = hands && (hands[0] as any);
        if (hand?.id) {
          const { listSeatsByHand } = await import('../services/seatsRepo');
          const seats = await listSeatsByHand(String(hand.id));
          const meSeat = (seats || []).find((s: any) => String(s.user_id) === String(userUuid));
          if (meSeat && meSeat.in_hand === true && meSeat.is_all_in !== true) {
            const { applyFoldForUser } = await import('../services/actionFlow');
            await applyFoldForUser(context, roomIdParam);
          }
        }
      }
    } catch (e) {
      ctx.log.warn?.('leave:pre-fold-check failed (ignored)', { roomId: roomIdParam, err: (e as Error)?.message });
    }

    // Remove player from room (pass Telegram ID, the function will convert it)
    ctx.log.info('Attempting to remove player from room', { telegramUserId, userUuid, roomId: roomIdParam });
    await removePlayer(roomIdParam, telegramUserId);
    ctx.log.info('Player removed from room successfully', { telegramUserId, userUuid, roomId: roomIdParam });

    // Clear active room state for the user immediately after leaving
    try {
      const { clearActiveRoomId } = await import('@/modules/core/userRoomState');
      clearActiveRoomId(user.id);
    } catch { /* noop */ }

    // Get updated room state
    const updatedRoom = await getRoom(roomIdParam);
    
    // If room still exists, handle admin reassignment/closure and broadcast updates
    if (updatedRoom) {
      try {
        const roomsApi = await import('@/api/rooms');
        if (updatedRoom.players.length === 0) {
          // Close the room if empty
          await roomsApi.update(roomIdParam, { status: 'finished' });
          ctx.log.info('Room closed (no players remain)', { roomId: roomIdParam });
        } else {
          // Reassign admin if the leaving user was the admin
          if (room.createdBy === userUuid) {
            const newAdmin = updatedRoom.players[0];
            await roomsApi.update(roomIdParam, { created_by: newAdmin });
            ctx.log.info('Room admin reassigned', { roomId: roomIdParam, newAdmin });
          }
        }
      } catch (e) {
        ctx.log.warn?.('Leave room post-update failed (ignored)', { roomId: roomIdParam, error: (e as Error)?.message });
      }
      // Broadcast update to remaining players (regardless of update success)
      if (updatedRoom.players.length > 0) {
        await broadcastRoomInfo(ctx, roomIdParam);
        ctx.log.info('Broadcasted room update to remaining players', { roomId: roomIdParam });
      }
    }

    // Directly redirect to games.start action instead of showing a message
    const { dispatch } = await import('@/modules/core/smart-router');
    await dispatch(ROUTES.games.start, context);
    
    ctx.log.info('Leave room action completed successfully', { telegramUserId, userUuid, roomId: roomIdParam });

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
          { text: ctx.t('poker.room.buttons.back'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.start) }
        ]]
      }
    });
  }
}

export default createHandler(handleLeaveRoom);
