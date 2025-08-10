import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getActiveRoomId, setActiveRoomId } from '@/modules/core/userRoomState';
import { getRoom } from '../services/roomService';

export const key = 'games.poker.room.info';

async function handleRoomInfo(context: HandlerContext): Promise<void> {
  const { ctx, user } = context;
  const NS = 'poker.info';
  // Resolve roomId from query, active state, or last-viewed form state
  let roomId = context._query?.roomId || getActiveRoomId(String(user.id)) || '';
  if (!roomId) {
    const saved = ctx.formState?.get<{ roomId?: string }>(NS, user.id);
    roomId = saved?.roomId || '';
  }
  // Persist for future refreshes and set as active
  if (roomId) {
    ctx.formState?.set?.(NS, user.id, { roomId });
    setActiveRoomId(user.id, roomId);
  }
  // If invoked via callback without roomId in payload, re-dispatch self with resolved roomId once
  if ((ctx.callbackQuery?.id || ctx.callbackQuery?.data) && !context._query?.roomId && roomId && context._query?.__rd !== '1') {
    const ROUTES3 = (await import('@/modules/core/routes.generated')).ROUTES;
    const { dispatch } = await import('@/modules/core/smart-router');
    context._query = { ...(context._query || {}), roomId, __rd: '1' };
    await dispatch(ROUTES3.games.poker.room.info, context);
    return;
  }
  const s = context._query?.s;
  ctx.log.debug?.('room.info:resolved', { 
    userId: user.id, 
    ctxFromId: ctx.from?.id,
    ctxChatId: ctx.chat?.id,
    roomId, 
    hasCallback: !!ctx.callbackQuery?.data, 
    query: context._query 
  });
  const room = await getRoom(roomId);
  // Fetch player display names from DB for UUIDs
  // let playerNameMap: Record<string, string> = {};
  // let selfDbId: string | undefined;
  if (room?.players && room.players.length > 0) {
    try {
      // const usersApi = await import('@/api/users');
      // const selfDb = await usersApi.getByTelegramId(String(user.id));
      // selfDbId = (selfDb && (selfDb as any).id) as string | undefined;
      // const infos = await usersApi.getByIds(room.players);
      // playerNameMap = Object.fromEntries(
      //   infos.map((u: any) => {
      //     const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
      //     return [String(u.id), full || u.username || String(u.telegram_id) || String(u.id)];
      //   })
      // );
    } catch (e) {
      ctx.log?.warn?.('room.info:playerNameLookupFailed', { error: (e as Error)?.message });
    }
  }
  // Use any to satisfy grammy types union at runtime while keeping payload small
  const rows: any[] = [];
  const ROUTES = (await import('@/modules/core/routes.generated')).ROUTES;

  // Inline share subview within the same route
  if (s === 'share') {
    const contacts = [
      { id: 'u2', name: 'Friend 1' },
      { id: 'u3', name: 'Friend 2' },
    ];

    for (const c of contacts) {
      rows.push([
        {
          text: c.name,
          callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.info, { s: 'share', u: c.id })
        }
      ]);
    }
    rows.push([
      { text: ctx.t('poker.room.buttons.backToRoomInfo'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.info) }
    ]);

    ctx.log.debug?.('room.info:shareView');
    await ctx.replySmart(ctx.t('poker.room.info.title'), { parse_mode: 'HTML', reply_markup: { inline_keyboard: rows } });
    return;
  }

  // Use the central roomService to broadcast room info to current user
  const { broadcastRoomInfo } = await import('@/actions/games/poker/room/services/roomService');
  await broadcastRoomInfo(ctx, roomId, [String(user.id)]);

  // Persist last viewed roomId for reliable refresh without params
  if (roomId) {
    ctx.formState?.set(NS, user.id, { roomId });
  }
}

export default createHandler(handleRoomInfo);


