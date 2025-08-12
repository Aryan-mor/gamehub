import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getRoom } from '../services/roomService';
import { setActiveRoomId } from '@/modules/core/userRoomState';

export const key = 'games.poker.findRoom';

async function handleFindRoom(context: HandlerContext): Promise<void> {
  const { ctx, user } = context;
  const NS = 'poker.findRoom';
  let roomId = context._query?.roomId || '';
  const room = await getRoom(roomId);
  const users = await import('@/api/users');
  const dbUser = await users.getByTelegramId(user.id);
  const dbUserId = (dbUser && (dbUser as any).id) as string | undefined;
  const isReady = !!(dbUserId && room?.readyPlayers?.includes(dbUserId));
  const s = context._query?.s;

  // Persist last viewed roomId per user to avoid long callback_data
  if (roomId) {
    context.ctx.formState?.set(NS, user.id, { roomId });
    setActiveRoomId(user.id, roomId);
  } else {
    const saved = context.ctx.formState?.get<{ roomId?: string }>(NS, user.id);
    if (saved?.roomId) roomId = saved.roomId;
  }

  const rows: Array<Array<{ text: string; callback_data: string }>> = [];
  const ROUTES = (await import('@/modules/core/routes.generated')).ROUTES;

  if (s === 'share') {
    const contacts = [
      { id: 'u2', name: 'Friend 1' },
      { id: 'u3', name: 'Friend 2' },
    ];
    for (const c of contacts) {
      rows.push([{ text: c.name, callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.findRoom, { s: 'share', u: c.id }) }]);
    }
    rows.push([{ text: ctx.t('poker.room.buttons.copyLink'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.findRoom, { s: 'copy' }) }]);
  } else {
    const readyCount = room?.readyPlayers?.length ?? 0;
    if (!room || room.players.length < 2 || readyCount < 2) {
      // Keep callback_data short; handler resolves roomId from state
      rows.push([{ text: ctx.t('poker.room.buttons.share'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.findRoom, { s: 'share' }) }]);
    } else {
      rows.push([{ text: ctx.t('poker.room.buttons.startGame'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.start) }]);
    }
  }

  // Info button (no roomId in payload; handler resolves from state)
  rows.push([{ text: ctx.t('poker.room.buttons.info'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.info) }]);

  // Ready/Not Ready toggle
  if (isReady) {
    rows.push([{ text: ctx.t('poker.room.buttons.notReady'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.notready) }]);
  } else {
    rows.push([{ text: ctx.t('poker.room.buttons.ready'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.ready) }]);
  }

  rows.push([{ text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.start) }]);

  await ctx.replySmart(ctx.t('poker.room.info.title'), { parse_mode: 'HTML', reply_markup: { inline_keyboard: rows } });
}

export default createHandler(handleFindRoom);


