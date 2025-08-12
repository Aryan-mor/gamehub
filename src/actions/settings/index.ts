import { HandlerContext, createHandler } from '@/modules/core/handler';

async function handleSettings(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  const { keyboard } = ctx;
  const { ROUTES } = await import('@/modules/core/routes.generated');
  const { encodeAction } = await import('@/modules/core/route-alias');

  const title = ctx.t('settings.title') || '⚙️ Settings';
  const language = ctx.t('settings.language') || '🌐 Language';
  const back = ctx.t('poker.room.buttons.backToMenu') || '🔙 Back to Menu';

  const buttons = [
    { text: language, callbackData: { action: encodeAction(ROUTES.settings.language._self) } },
    { text: back, callbackData: { action: encodeAction(ROUTES.start) } },
  ];

  const replyMarkup = keyboard.createInlineKeyboard(
    buttons.map((b) => ({ text: b.text, callback_data: JSON.stringify(b.callbackData) }))
  );

  await ctx.replySmart(title, { reply_markup: replyMarkup, parse_mode: 'HTML' });
}

export default createHandler(handleSettings);


