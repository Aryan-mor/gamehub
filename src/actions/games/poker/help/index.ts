import { HandlerContext, createHandler } from '@/modules/core/handler';
import { ROUTES } from '@/modules/core/routes.generated';
import { isValidUserId } from '@/utils/typeGuards';

export const key = 'games.poker.help';

async function handlePokerHelp(context: HandlerContext): Promise<void> {
  const { ctx, user } = context;

  if (!isValidUserId(user.id)) {
    throw new Error('Invalid user ID');
  }

  const text = ctx.t(
    'poker.help.text'
  );

  const buttons = [
    { text: ctx.t('poker.room.buttons.back'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.start) },
  ];

  const replyMarkup = ctx.keyboard.createInlineKeyboard(buttons);

  await ctx.replySmart(text, { parse_mode: 'HTML', reply_markup: replyMarkup });
}

export default createHandler(handlePokerHelp);


