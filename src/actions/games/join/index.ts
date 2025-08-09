import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getActiveRoomId, setActiveRoomId } from '@/modules/core/userRoomState';

export const key = 'games.join';

async function handleJoin(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { ctx, user } = context;
  const targetRoomId = query.roomId || (context as HandlerContext & { _query?: Record<string, string> })._query?.roomId || '';
  const activeRoomId = getActiveRoomId(user.id);

  if (!activeRoomId) {
    setActiveRoomId(user.id, targetRoomId);
    await ctx.replySmart(ctx.t('🎴 Poker'), { reply_markup: { inline_keyboard: [[{ text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.findRoom', { roomId: targetRoomId }) }]] } });
    return;
  }

  if (activeRoomId === targetRoomId) {
    await ctx.replySmart(ctx.t('🎴 Poker'), { reply_markup: { inline_keyboard: [[{ text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.findStep', { roomId: activeRoomId }) }]] } });
    return;
  }

  const rows = [
    [{ text: ctx.t('Continue Active Room'), callback_data: ctx.keyboard.buildCallbackData('games.findStep', { roomId: activeRoomId }) }],
    [{ text: ctx.t('Leave Active And Join New'), callback_data: ctx.keyboard.buildCallbackData('games.join.switch', { roomId: targetRoomId }) }],
    [{ text: ctx.t('Leave Active'), callback_data: ctx.keyboard.buildCallbackData('games.leave.active', { roomId: activeRoomId }) }],
  ];
  await ctx.replySmart(ctx.t('🎴 Poker'), { reply_markup: { inline_keyboard: rows } });
}

export default createHandler(handleJoin);


