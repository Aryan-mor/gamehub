import { HandlerContext, createHandler } from '@/modules/core/handler';
import { clearActiveRoomId } from '@/modules/core/userRoomState';

export const key = 'games.leave.active';

async function handleLeaveActive(context: HandlerContext): Promise<void> {
  const { ctx, user } = context;
  clearActiveRoomId(user.id);
  await ctx.replySmart(ctx.t('poker.leave.done'), { reply_markup: { inline_keyboard: [[{ text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData((await import('@/modules/core/routes.generated')).ROUTES.games.poker.start) }]] } });
}

export default createHandler(handleLeaveActive);


