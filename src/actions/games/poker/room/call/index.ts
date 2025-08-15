import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getActiveRoomId, setActiveRoomId } from '@/modules/core/userRoomState';

export const key = 'games.poker.room.call';

async function handleCall(context: HandlerContext): Promise<void> {
  const { ctx, user } = context;

  // Resolve roomId from query, active state, or last-viewed form state
  const NS = 'poker.info';
  let roomId = context._query?.r || context._query?.roomId || getActiveRoomId(String(user.id)) || '';
  if (!roomId) {
    const saved = ctx.formState?.get<{ roomId?: string }>(NS, user.id);
    roomId = saved?.roomId || '';
  }
  if (roomId) {
    ctx.formState?.set?.(NS, user.id, { roomId });
    setActiveRoomId(user.id, roomId);
  }

  if (roomId) {
    // First apply CALL on DB state
    try {
      const { applyCallForUser } = await import('../services/actionFlow');
      await applyCallForUser(context, roomId);
    } catch {
      // ignore to keep UI responsive
    }
    // Then broadcast updated room info to this user
    try {
      const { broadcastRoomInfo } = await import('../services/roomService');
      // Broadcast to all room players so everyone sees the updated state
      await broadcastRoomInfo(ctx as any, roomId);
    } catch {
      // ignore UI broadcast error
    }
  }
}

export default createHandler(handleCall);


