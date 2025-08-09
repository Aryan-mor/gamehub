import { HandlerContext, createHandler } from '@/modules/core/handler';

export const key = 'games.findStep';

async function handleFindStep(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const roomId = query.roomId || (context as HandlerContext & { _query?: Record<string, string> })._query?.roomId;

  // For now, only poker exists → delegate to poker findRoom
  const { dispatch } = await import('@/modules/core/smart-router');
  await dispatch('games.poker.findRoom', { ...context, _query: { roomId } } as HandlerContext & { _query?: Record<string, string> });
}

export default createHandler(handleFindStep);


