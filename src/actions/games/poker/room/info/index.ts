import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getActiveRoomId, setActiveRoomId } from '@/modules/core/userRoomState';
import { getRoom } from '../../services/roomService';

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
    ctx.formState?.set(NS, user.id, { roomId });
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
  ctx.log.debug?.('room.info:resolved', { roomId, hasCallback: !!ctx.callbackQuery?.data, query: context._query });
  const room = getRoom(roomId);
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

  // add refresh & share (keep payload small; include roomId for tests and explicitness)
  rows.push([{ text: ctx.t('poker.room.buttons.refresh'), callback_data: ctx.keyboard.buildCallbackData(ROUTES.games.poker.room.info, { roomId }) }]);
  
  // Use Telegram inline mode: open chat picker, then inline composer prefilled
  rows.push([{ text: ctx.t('poker.room.buttons.share'), switch_inline_query: `poker ${roomId}` }]);

  // Compose English-first message (keys exist in locales)
  const roomType = room?.isPrivate ? ctx.t('poker.room.info.type.private') : ctx.t('poker.room.info.type.public');
  const smallBlind = room?.smallBlind ?? 0;
  const bigBlind = smallBlind * 2;
  const maxPlayers = room?.maxPlayers ?? 0;
  const playerCount = room?.players.length ?? 0;
  const timeout = room?.turnTimeoutSec ?? 240;
  const status = ctx.t('poker.room.status.waiting');
  // Force lastUpdate to include ms to ensure difference even within the same second
  const currentTime = new Date().toISOString();
  const displayLastUpdate = room?.lastUpdate ? currentTime : '-';

  const header = ctx.t('poker.room.info.title');
  const detailsTitle = ctx.t('poker.room.info.section.details');
  const settingsTitle = ctx.t('poker.room.info.section.settings');
  const playersTitle = ctx.t('poker.room.info.section.players').replace('{{count}}', String(playerCount)).replace('{{max}}', String(maxPlayers));

  // Build player display names: prefer first_name + last_name from ctx cache if available
  const playerLines: string[] = [];
  for (const [index, playerId] of (room?.players || []).entries()) {
    // Prefer stored display name from room.playerNames
    const mappedName = room?.playerNames?.[playerId];
    // Fallback to current ctx.from only for self
    const isSelf = ctx.from && String(ctx.from.id) === String(playerId);
    const firstName = isSelf ? ctx.from?.first_name : undefined;
    const lastName = isSelf ? ctx.from?.last_name : undefined;
    const fullName = mappedName || [firstName, lastName].filter(Boolean).join(' ').trim();
    playerLines.push(`${index + 1}. ${fullName || playerId}`);
  }

  const message = `${header}\n\n` +
    `${detailsTitle}\n` +
    `• ${ctx.t('poker.room.info.field.id')}: ${roomId}\n` +
    `• ${ctx.t('poker.room.info.field.status')}: ${status}\n` +
    `• ${ctx.t('poker.room.info.field.type')}: ${roomType}\n\n` +
    `${settingsTitle}\n` +
    `• ${ctx.t('poker.room.info.field.smallBlind')}: ${smallBlind}\n` +
    `• ${ctx.t('poker.room.info.field.bigBlind')}: ${bigBlind}\n` +
    `• ${ctx.t('poker.room.info.field.maxPlayers')}: ${maxPlayers}\n` +
    `• ${ctx.t('poker.room.info.field.turnTimeout')}: ${timeout}\n\n` +
    `${playersTitle}\n` +
    (playerLines.join('\n') || '') +
    (room?.players?.length ? '\n\n' : '\n') +
    `${ctx.t('poker.room.info.field.lastUpdate')}: ${displayLastUpdate}`;

  ctx.log.debug?.('room.info:render', { playerCount, maxPlayers, timeout, lastUpdate: displayLastUpdate });
  // If a target chat is provided (broadcasting), send as a new message, not edit
  const targetChatId = context._query?.chatId;
  await ctx.replySmart(message, { parse_mode: 'HTML', reply_markup: { inline_keyboard: rows }, chatId: targetChatId });

  // Persist last viewed roomId for reliable refresh without params
  if (roomId) {
    ctx.formState?.set(NS, user.id, { roomId });
  }
}

export default createHandler(handleRoomInfo);


