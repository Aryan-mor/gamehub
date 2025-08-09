import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getActiveRoomId, setActiveRoomId } from '@/modules/core/userRoomState';

export const key = 'games.join';

async function handleJoin(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { ctx, user } = context;
  const targetRoomId = query.roomId || (context as HandlerContext & { _query?: Record<string, string> })._query?.roomId || '';
  const activeRoomId = getActiveRoomId(user.id);

  if (!activeRoomId) {
    setActiveRoomId(user.id, targetRoomId);
    await ctx.replySmart(ctx.t('poker.join.welcome'), { reply_markup: { inline_keyboard: [[{ text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData((await import('@/modules/core/routes.generated')).ROUTES.games.poker.findRoom, { roomId: targetRoomId }) }]] } });
    return;
  }

  if (activeRoomId === targetRoomId) {
    await ctx.replySmart(ctx.t('poker.join.welcome'), { reply_markup: { inline_keyboard: [[{ text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData((await import('@/modules/core/routes.generated')).ROUTES.games.findStep, { roomId: activeRoomId }) }]] } });
    return;
  }

  const R = (await import('@/modules/core/routes.generated')).ROUTES;
  const rows = [
    [{ text: ctx.t('poker.join.continueActive'), callback_data: ctx.keyboard.buildCallbackData(R.games.findStep, { roomId: activeRoomId }) }],
    [{ text: ctx.t('poker.join.leaveAndJoinNew'), callback_data: ctx.keyboard.buildCallbackData(R.games.join, { s: 'switch', roomId: targetRoomId }) }],
    [{ text: ctx.t('poker.join.leaveActive'), callback_data: ctx.keyboard.buildCallbackData(R.games.start, { s: 'leaveActive', roomId: activeRoomId }) }],
  ];
  await ctx.replySmart(ctx.t('poker.join.conflictTitle'), { reply_markup: { inline_keyboard: rows } });
}

export default createHandler(handleJoin);


