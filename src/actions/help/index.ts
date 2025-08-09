import { HandlerContext, createHandler } from '@/modules/core/handler';

export const key = 'help';

async function handleHelp(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  const text = ctx.t(
    '🤖 Welcome to GameHub!\n\n' +
    'This bot lets you play and manage multiple games, track coins, and interact via inline buttons.\n' +
    '- Use the main menu to navigate.\n' +
    '- Actions are optimized for inline buttons; avoid typing where possible.\n' +
    '- Your progress and active rooms are remembered to resume quickly.\n\n' +
    'Tap Back to return to the start menu.'
  );

  const buttons = [
    { text: ctx.t('🔙 Back'), callback_data: ctx.keyboard.buildCallbackData('start') },
  ];
  const replyMarkup = ctx.keyboard.createInlineKeyboard(buttons);

  await ctx.replySmart(text, { parse_mode: 'HTML', reply_markup: replyMarkup });
}

export default createHandler(handleHelp);


