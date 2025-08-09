import { HandlerContext, createHandler } from '@/modules/core/handler';
import { clearActiveRoomId, setActiveRoomId } from '@/modules/core/userRoomState';

export const key = 'games.join.switch';

async function handleSwitch(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { ctx, user } = context;
  const roomId = query.roomId || (context as HandlerContext & { _query?: Record<string, string> })._query?.roomId || '';
  clearActiveRoomId(user.id);
  setActiveRoomId(user.id, roomId);
  await ctx.replySmart(ctx.t('🎴 Poker'), { reply_markup: { inline_keyboard: [[{ text: ctx.t('Continue'), callback_data: ctx.keyboard.buildCallbackData('games.poker.findRoom', { roomId }) }]] } });
}

export default createHandler(handleSwitch);


