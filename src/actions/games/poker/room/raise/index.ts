import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getActiveRoomId, setActiveRoomId } from '@/modules/core/userRoomState';

export const key = 'games.poker.room.raise';

async function handleRaise(context: HandlerContext): Promise<void> {
  const { ctx, user } = context;
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

  const amount = Number(context._query?.a || 0);
  if (!roomId || !Number.isFinite(amount) || amount <= 0) return;

  try {
    const { applyRaiseForUser } = await import('../services/actionFlow');
    await applyRaiseForUser(context, roomId, amount);
  } catch {
    // ignore to keep UI responsive
  }
  try {
    const { broadcastRoomInfo } = await import('../services/roomService');
    await broadcastRoomInfo(ctx as any, roomId);
  } catch {}
}

export default createHandler(handleRaise);


