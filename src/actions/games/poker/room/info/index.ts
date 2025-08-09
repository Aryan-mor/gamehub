import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getRoom } from '../../services/roomStore';

export const key = 'games.poker.room.info';

async function handleRoomInfo(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  const roomId = (context as HandlerContext & { _query?: Record<string, string> })._query?.roomId || '';
  const room = getRoom(roomId);
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];
  if (room) {
    for (const uid of room.players) {
      const isReady = room.readyPlayers?.includes(uid) ? '1' : '0';
      const ROUTES = (await import('@/modules/core/routes.generated')).ROUTES;
      rows.push([
        {
          text: ctx.t('poker.room.info.playerEntry'),
          callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.info, { roomId, u: uid, ready: isReady }),
        },
      ]);
    }
  }
  // add refresh line
  rows.push([{ text: ctx.t('poker.room.buttons.refresh'), callback_data: ctx.keyboard.buildCallbackData((await import('@/modules/core/routes.generated')).ROUTES.games.poker.room.info, { roomId }) }]);

  await ctx.replySmart(ctx.t('poker.room.info.details'), { reply_markup: { inline_keyboard: rows } });
}

export default createHandler(handleRoomInfo);


