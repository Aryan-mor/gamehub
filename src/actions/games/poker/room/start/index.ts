import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getActiveRoomId, setActiveRoomId } from '@/modules/core/userRoomState';

export const key = 'games.poker.room.start';

async function handleRoomStart(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  const { startHandForRoom } = await import('../services/gameFlow');
  const { broadcastRoomInfo, getRoom } = await import('../services/roomService');
  // Resolve roomId from query, active state, or last-viewed form state
  const NS = 'poker.info';
  let roomId = context._query?.roomId || getActiveRoomId(String(context.user.id)) || '';
  if (!roomId) {
    const saved = ctx.formState?.get<{ roomId?: string }>(NS, context.user.id);
    roomId = saved?.roomId || '';
  }
  if (roomId) {
    ctx.formState?.set?.(NS, context.user.id, { roomId });
    setActiveRoomId(context.user.id, roomId);
  }

  if (roomId) {
    try {
      const room = await getRoom(roomId);
      // Only enforce pre-check if room data is available
      if (room) {
        const playerCount = room.players?.length ?? 0;
        if (playerCount < 2) {
        // Show a toast explaining the requirement for 2+ players
        const msg = ctx.t('At least two players are required to start the game. Invite another player or leave the room.');
        (ctx as any).callbackToastText = msg;
        // Still refresh room info so user sees current state
        await broadcastRoomInfo(ctx, roomId);
        return;
        }
      }
    } catch {
      // ignore pre-check errors; fallback to generic error handling below
    }
    try {
      await startHandForRoom(context, roomId);
      // Notify all room players about game start
      await broadcastRoomInfo(ctx, roomId);
    } catch (err) {
      // Specific toast when not enough players
      if (err instanceof Error && err.message === 'not_enough_players') {
        const msg = ctx.t('At least two players are required to start the game. Invite another player or leave the room.');
        (ctx as any).callbackToastText = msg;
        await broadcastRoomInfo(ctx, roomId);
        return;
      }
      // Generic error fallback
      await ctx.replySmart(ctx.t('bot.error.generic'));
      return;
    }
  }
  // No generic message here; personalized messages are sent via broadcastRoomInfo
}

export default createHandler(handleRoomStart);


