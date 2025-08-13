import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getActiveRoomId, setActiveRoomId } from '@/modules/core/userRoomState';

export const key = 'games.poker.room.start';

async function handleRoomStart(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  const { startHandForRoom } = await import('../services/gameFlow');
  const { broadcastRoomInfo } = await import('../services/roomService');
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
      await startHandForRoom(context, roomId);
      // Notify all room players about game start
      await broadcastRoomInfo(ctx as any, roomId);
    } catch {
      // Show error
      await ctx.replySmart(ctx.t('bot.error.generic'));
      return;
    }
  }
  // No generic message here; personalized messages are sent via broadcastRoomInfo
}

export default createHandler(handleRoomStart);


