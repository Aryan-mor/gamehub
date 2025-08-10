import { HandlerContext, createHandler } from '@/modules/core/handler';
import { markNotReady } from '../../services/roomService';

export const key = 'games.poker.room.notready';

async function handleNotReady(context: HandlerContext): Promise<void> {
  const { ctx, user } = context;
  const roomId = context._query?.roomId || (ctx.formState.get<{ roomId?: string }>('poker.info', user.id)?.roomId ?? '');
  if (roomId) await markNotReady(roomId, user.id);
  const ROUTES = (await import('@/modules/core/routes.generated')).ROUTES;
  await ctx.replySmart(ctx.t('poker.room.info.title'), {
    reply_markup: { inline_keyboard: [[{ text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.findRoom) }]] },
  });
}

export default createHandler(handleNotReady);


