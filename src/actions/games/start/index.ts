import { HandlerContext, createHandler } from '@/modules/core/handler';

export const key = 'games.start';

async function handleGamesStart(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  const text = ctx.t('🎮 Select a game from the list below:');
  const buttons = [
    { text: ctx.t('🎴 Poker'), callback_data: ctx.keyboard.buildCallbackData('games.poker.start') },
    { text: ctx.t('🔙 Back'), callback_data: ctx.keyboard.buildCallbackData('start') },
  ];
  const replyMarkup = ctx.keyboard.createInlineKeyboard(buttons);
  await ctx.replySmart(text, { reply_markup: replyMarkup });
}

export default createHandler(handleGamesStart);


