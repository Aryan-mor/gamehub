import { HandlerContext, createHandler } from '@/modules/core/handler';
import { markReady } from '../../services/roomService';

export const key = 'games.poker.room.ready';

async function handleReady(context: HandlerContext): Promise<void> {
  const { ctx, user } = context;
  const roomId = context._query?.roomId || '';
  markReady(roomId, user.id);
  const ROUTES = (await import('@/modules/core/routes.generated')).ROUTES;
  await ctx.replySmart(ctx.t('poker.room.info.title'), {
    reply_markup: { inline_keyboard: [[{ text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.findRoom, { roomId }) }]] },
  });
}

export default createHandler(handleReady);


