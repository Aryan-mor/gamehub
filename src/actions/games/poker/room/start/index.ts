import { HandlerContext, createHandler } from '@/modules/core/handler';

export const key = 'games.poker.room.start';

async function handleRoomStart(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  const ROUTES = (await import('@/modules/core/routes.generated')).ROUTES;
  const buttons = [
    // Do NOT include roomId to keep callback_data under Telegram's 64-byte limit
    { text: ctx.t('poker.game.buttons.check'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.check) },
    { text: ctx.t('poker.game.buttons.call'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.call) },
    { text: ctx.t('poker.game.buttons.fold'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.fold) },
  ];
  const replyMarkup = ctx.keyboard.createInlineKeyboard(buttons);
  await ctx.replySmart(ctx.t('poker.game.state.initial'), { reply_markup: replyMarkup });
}

export default createHandler(handleRoomStart);


