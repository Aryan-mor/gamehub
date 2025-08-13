import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getActiveRoomId, clearActiveRoomId } from '@/modules/core/userRoomState';

export const key = 'games.join.switch';

async function handleSwitch(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user } = context;
  const roomId = (query.roomId || query.r || context._query?.roomId || context._query?.r || '') as string;
  const activeRoomId = getActiveRoomId(user.id);
  const { dispatch } = await import('@/modules/core/smart-router');

  // If user has an active different room, leave it using the official leave action
  if (activeRoomId && activeRoomId !== roomId) {
    (context as unknown as { _query?: Record<string, string> })._query = { roomId: activeRoomId };
    await dispatch('games.poker.room.leave', context);
    // Ensure in-memory state reflects the leave immediately to avoid conflict UI on the next join
    clearActiveRoomId(user.id);
  }

  // Now join the target room using the official join action
  (context as unknown as { _query?: Record<string, string> })._query = { roomId };
  await dispatch('games.join', context);
}

export default createHandler(handleSwitch);


