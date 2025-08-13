import { HandlerContext, createHandler } from '@/modules/core/handler';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

// Local state namespace for join carousel
const NS = 'poker.join.carousel';

interface JoinCarouselState {
  roomIds: string[];
  index: number;
}

export const key = 'games.poker.room.join';

async function handleJoinCarousel(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { ctx, user } = context;
  const step = query.s || context._query?.s || 'init';

  logFunctionStart('poker.join.carousel', { userId: user.id, step });

  try {
    // Helper: i18n with fallback
    const tr = (key: string, fallback: string, options?: Record<string, unknown>): string => {
      const v = ctx.t(key, options) as string;
      const looksLikeKey = v.includes('.') || v.includes('poker.') || v.includes('bot.');
      const hasUnresolved = v.includes('{{');
      return v && !looksLikeKey && !hasUnresolved ? v : fallback;
    };

    // Helper: fetch joinable public rooms for poker
    const loadJoinableRooms = async (): Promise<string[]> => {
      const roomsApi = await import('@/api/rooms');
      const { getRoom } = await import('@/actions/games/poker/room/services/roomRepo');
      const { ensureUserUuid } = await import('@/actions/games/poker/room/services/roomRepo');

      const dbRooms = await roomsApi.getByGameType('poker');
      const selfUuid = await ensureUserUuid(String(user.id));

      const candidates: string[] = [];
      for (const r of dbRooms as Array<Record<string, unknown>>) {
        const isPrivate = Boolean((r as Record<string, unknown>)?.is_private ?? false);
        const status = String((r as Record<string, unknown>)?.status ?? '');
        if (isPrivate) continue;
        if (status !== 'waiting') continue;
        const rid = String((r as Record<string, unknown>)?.id ?? '');
        if (!rid) continue;
        const mapped = await getRoom(rid);
        if (!mapped) continue;
        const isFull = (mapped.players?.length ?? 0) >= (mapped.maxPlayers ?? 0);
        if (isFull) continue;
        const alreadyIn = Array.isArray(mapped.players) && mapped.players.includes(selfUuid);
        if (alreadyIn) continue;
        candidates.push(mapped.id);
      }
      return candidates;
    };

    // Helper: build room info-like message for a room id
    const buildRoomInfoMessage = async (roomId: string): Promise<{
      message: string;
      playerCount: number;
      maxPlayers: number;
    }> => {
      const { getRoom } = await import('@/actions/games/poker/room/services/roomService');
      const { users } = await import('@/api');
      const room = await getRoom(roomId);
      if (!room) {
        return { message: tr('poker.room.error.notFound', '❌ Room not found'), playerCount: 0, maxPlayers: 0 };
      }
      const escapeHtml = (input: string): string => input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const playerCount = room.players.length;
      const maxPlayers = room.maxPlayers || 2;
      const smallBlind = room.smallBlind || 200;
      const bigBlind = smallBlind * 2;
      const timeout = room.turnTimeoutSec || 120;
      const timeoutMinutes = Math.round(timeout / 60);
      const lastUpdate = room.lastUpdate ? new Date(room.lastUpdate).toISOString() : 'Unknown';

      const dbUsers = await users.getByIds(room.players);
      const idToDisplayName: Record<string, string> = {};
      for (const u of dbUsers) {
        const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
        const display = full || u.first_name || u.username || String(u.telegram_id) || 'Unknown';
        idToDisplayName[String(u.id)] = escapeHtml(display);
      }
      const playerNames = room.players
        .map((uid) => {
          const name = idToDisplayName[uid] || 'Unknown';
          const isAdmin = uid === room.createdBy;
          return `${isAdmin ? '👑 ' : ''}${name}`;
        })
        .join('\n');

      const title = tr('poker.room.info.title', '🏠 Poker Room Info');
      const sectionDetails = tr('poker.room.info.section.details', '📋 Room Details');
      const fieldId = tr('poker.room.info.field.id', '• ID');
      const fieldStatus = tr('poker.room.info.field.status', '• Status');
      const fieldType = tr('poker.room.info.field.type', '• Type');
      const sectionSettings = tr('poker.room.info.section.settings', '⚙️ Game Settings');
      const fieldSmallBlind = tr('poker.room.info.field.smallBlind', '• Small Blind');
      const fieldMaxPlayers = tr('poker.room.info.field.maxPlayers', '• Max Players');
      const fieldTurnTimeout = tr('poker.room.info.field.turnTimeout', '• Turn Timeout');
      const sectionPlayers = tr('poker.room.info.section.players', `👥 Players (${playerCount}/${maxPlayers}):`, { count: playerCount, max: maxPlayers });
      const fieldLastUpdate = tr('poker.room.info.field.lastUpdate', 'Last update');

      const message = `${title}\n\n${sectionDetails}\n${fieldId}: ${escapeHtml(roomId)}\n${fieldStatus}: ⏳ Waiting for players\n${fieldType}: 🌐 Public\n\n${sectionSettings}\n${fieldSmallBlind}: ${smallBlind}\n• Big Blind: ${bigBlind}\n${fieldMaxPlayers}: ${maxPlayers}\n${fieldTurnTimeout}: ${timeoutMinutes} min\n\n${sectionPlayers}\n${playerNames}\n\n${fieldLastUpdate}: ${escapeHtml(lastUpdate)}`;

      return { message, playerCount, maxPlayers };
    };

    // Load or initialize carousel state
    let state = ctx.formState?.get<JoinCarouselState>(NS, user.id) || { roomIds: [], index: 0 };

    if (step === 'init') {
      const rooms = await loadJoinableRooms();
      state = { roomIds: rooms, index: 0 };
      ctx.formState?.set(NS, user.id, state);
    } else if (step === 'next') {
      if (state.roomIds.length > 0) {
        state.index = (state.index + 1) % state.roomIds.length;
        ctx.formState?.set(NS, user.id, state);
      }
    } else if (step === 'join') {
      const currentRoomId = state.roomIds[state.index];
      if (!currentRoomId) {
        // Nothing to join; reload and show
        const rooms = await loadJoinableRooms();
        state = { roomIds: rooms, index: 0 };
        ctx.formState?.set(NS, user.id, state);
      } else {
        // Delegate to central join handler
        const { dispatch } = await import('@/modules/core/smart-router');
        (context as unknown as { _query?: Record<string, string> })._query = { roomId: currentRoomId };
        await dispatch('games.join', context);
        logFunctionEnd('poker.join.carousel.join', { roomId: currentRoomId }, { userId: user.id });
        return;
      }
    } else if (step === 'back') {
      const { dispatch } = await import('@/modules/core/smart-router');
      await dispatch('games.poker.start', context);
      return;
    }

    // If no rooms available
    if (!state.roomIds || state.roomIds.length === 0) {
      const noRoomsMsg = tr('poker.join.noRooms', '😕 No public rooms available right now.');
      const backBtn = [{ text: tr('poker.room.buttons.back', '🔙 Back'), callback_data: ctx.keyboard.buildCallbackData('games.poker.start') }];
      await ctx.replySmart(noRoomsMsg, { reply_markup: { inline_keyboard: [backBtn] } });
      logFunctionEnd('poker.join.carousel.empty', {});
      return;
    }

    // Clamp index just in case
    if (state.index < 0 || state.index >= state.roomIds.length) {
      state.index = 0;
      ctx.formState?.set(NS, user.id, state);
    }

    const currentRoomId = state.roomIds[state.index];
    const { message } = await buildRoomInfoMessage(currentRoomId);

    // Build buttons: Join, Another room, Back
    const joinText = tr('poker.join.buttons.join', '✅ Join');
    const anotherText = tr('poker.join.buttons.another', '➡️ Another room');
    const backText = tr('poker.room.buttons.back', '🔙 Back');

    const rows = [
      [{ text: joinText, callback_data: ctx.keyboard.buildCallbackData('games.poker.room.join', { s: 'join' }) }],
      [{ text: anotherText, callback_data: ctx.keyboard.buildCallbackData('games.poker.room.join', { s: 'next' }) }],
      [{ text: backText, callback_data: ctx.keyboard.buildCallbackData('games.poker.start') }],
    ];

    await ctx.replySmart(message, { parse_mode: 'HTML', reply_markup: { inline_keyboard: rows } });
    logFunctionEnd('poker.join.carousel.show', { index: state.index, total: state.roomIds.length, roomId: currentRoomId });
  } catch (error) {
    logError('poker.join.carousel.error', error as Error, { userId: context.user.id });
    await ctx.replySmart(ctx.t('bot.error.generic'));
  }
}

export default createHandler(handleJoinCarousel);


