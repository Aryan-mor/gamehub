import { HandlerContext, createHandler } from '@/modules/core/handler';
import { clearActiveRoomId, setActiveRoomId } from '@/modules/core/userRoomState';

export const key = 'games.join.switch';

async function handleSwitch(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { ctx, user } = context;
  const roomId = (query.roomId || query.r || context._query?.roomId || context._query?.r || '') as string;
  clearActiveRoomId(user.id);
  setActiveRoomId(user.id, roomId);
  await ctx.replySmart(ctx.t('poker.join.switched'), { reply_markup: { inline_keyboard: [[{ text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData((await import('@/modules/core/routes.generated')).ROUTES.games.poker.findRoom, { roomId }) }]] } });
}

export default createHandler(handleSwitch);


