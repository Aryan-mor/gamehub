import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getRoom } from '../services/roomStore';
import { setActiveRoomId } from '@/modules/core/userRoomState';

export const key = 'games.poker.findRoom';

async function handleFindRoom(context: HandlerContext): Promise<void> {
  const { ctx, user } = context;
  const NS = 'poker.findRoom';
  let roomId = (context as HandlerContext & { _query?: Record<string, string> })._query?.roomId || '';
  const room = getRoom(roomId);
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];
  const isReady = !!room?.readyPlayers?.includes(user.id);
  const s = (context as HandlerContext & { _query?: Record<string, string> })._query?.s;

  // Persist last viewed roomId per user to avoid long callback_data
  if (roomId) {
    context.ctx.formState?.set(NS, user.id, { roomId });
    setActiveRoomId(user.id, roomId);
  } else {
    const saved = context.ctx.formState?.get<{ roomId?: string }>(NS, user.id);
    if (saved?.roomId) roomId = saved.roomId;
  }

  // Inline share view within findRoom when s=share
  if (s === 'share') {
    // Simplify copy link to avoid exceeding callback_data limits; link can be generated client-side via roomId
    const contacts = [
      { id: 'u2', name: 'Friend 1' },
      { id: 'u3', name: 'Friend 2' },
    ];
    for (const c of contacts) {
      rows.push([{ text: c.name, callback_data: ctx.keyboard.buildCallbackData('games.poker.findRoom', { s: 'share', u: c.id }) }]);
    }
    // Copy link pseudo-action
    rows.push([{ text: ctx.t('poker.room.buttons.copyLink'), callback_data: ctx.keyboard.buildCallbackData('games.poker.findRoom', { s: 'copy' }) }]);
  } else {
    const readyCount = room?.readyPlayers?.length ?? 0;
    if (!room || room.players.length < 2 || readyCount < 2) {
      rows.push([{ text: ctx.t('poker.room.buttons.share'), callback_data: ctx.keyboard.buildCallbackData('games.poker.findRoom', { s: 'share' }) }]);
    } else {
      rows.push([{ text: ctx.t('poker.room.buttons.startGame'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.start', { roomId }) }]);
    }
  }

  // Player list/info placeholder button
  rows.push([{ text: ctx.t('poker.room.buttons.info'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.info', { roomId }) }]);

  // Ready/NotReady toggle for current user when in room
  if (room && room.players.includes(user.id)) {
    if (isReady) {
      rows.push([{ text: ctx.t('poker.room.buttons.notReady'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.notready', { roomId }) }]);
    } else {
      rows.push([{ text: ctx.t('poker.room.buttons.ready'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.ready', { roomId }) }]);
    }
  }
  rows.push([{ text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.start') }]);

  await ctx.replySmart(ctx.t('poker.room.info.title'), { parse_mode: 'HTML', reply_markup: { inline_keyboard: rows } });
}

export default createHandler(handleFindRoom);


