import { HandlerContext, createHandler } from '@/modules/core/handler';

export const key = 'games.findStep';

async function handleFindStep(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const roomId = query.roomId || context._query?.roomId || '';

  const { dispatch } = await import('@/modules/core/smart-router');
  // If we have a roomId, choose route by room status
  if (roomId) {
    const { getRoom } = await import('@/actions/games/poker/room/services/roomService');
    const room = await getRoom(roomId);
    if (room) {
      // If room is waiting (lobby state): show info; otherwise go to in-game state (start)
      const roomsApi = await import('@/api/rooms');
      const dbRoom = await roomsApi.getById(roomId);
      const status: string = ((): string => {
        if (typeof dbRoom === 'object' && dbRoom !== null && 'status' in dbRoom) {
          const v = (dbRoom as Record<string, unknown>).status;
          return typeof v === 'string' ? v : 'waiting';
        }
        return 'waiting';
      })();
      if (status === 'waiting') {
        await dispatch('games.poker.room.info', { ...context, _query: { roomId } });
        return;
      }
      await dispatch('games.poker.room.start', { ...context, _query: { roomId } });
      return;
    }
  }
  await dispatch('games.poker.start', context);
}

export default createHandler(handleFindStep);


