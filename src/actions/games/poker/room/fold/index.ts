import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getActiveRoomId, setActiveRoomId } from '@/modules/core/userRoomState';

export const key = 'games.poker.room.fold';

async function handleFold(context: HandlerContext): Promise<void> {
  const { ctx, user } = context;
  const NS = 'poker.info';
  let roomId = (context as unknown as { _query?: Record<string, string> })._query?.r || (context as unknown as { _query?: Record<string, string> })._query?.roomId || getActiveRoomId(String(user.id)) || '';
  if (!roomId) {
    const saved = ctx.formState?.get<{ roomId?: string }>(NS, user.id);
    roomId = saved?.roomId || '';
  }
  if (roomId) {
    ctx.formState?.set?.(NS, user.id, { roomId });
    setActiveRoomId(user.id, roomId);
  }
  if (roomId) {
    try {
      const { applyFoldForUser } = await import('../services/actionFlow');
      await applyFoldForUser(context, roomId);
    } catch {
      // ignore
    }
    try {
      const { broadcastRoomInfo } = await import('../services/roomService');
      await broadcastRoomInfo(ctx as any, roomId);
    } catch {
      // ignore
    }
  }
}

export default createHandler(handleFold);


