import { HandlerContext, createHandler } from '@/modules/core/handler';
import { ROUTES } from '@/modules/core/routes.generated';

export const key = 'games.start';

async function handleGamesStart(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  const text = ctx.t('bot.games.choose');
  const buttons = [
    { text: ctx.t('bot.games.poker'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.start) },
    { text: ctx.t('poker.room.buttons.back'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.start) },
  ];
  const replyMarkup = ctx.keyboard.createInlineKeyboard(buttons);
  await ctx.replySmart(text, { reply_markup: replyMarkup });
}

export default createHandler(handleGamesStart);


