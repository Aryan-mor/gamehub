import { HandlerContext, createHandler } from '@/modules/core/handler';
import { markNotReady } from '../../services/roomStore';

export const key = 'games.poker.room.notready';

async function handleNotReady(context: HandlerContext): Promise<void> {
  const { ctx, user } = context;
  const roomId = (context as HandlerContext & { _query?: Record<string, string> })._query?.roomId || '';
  markNotReady(roomId, user.id);
  await ctx.replySmart(ctx.t('poker.room.info.title'), {
    reply_markup: { inline_keyboard: [[{ text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.findRoom', { roomId }) }]] },
  });
}

export default createHandler(handleNotReady);


