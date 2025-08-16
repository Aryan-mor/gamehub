import type { PokerRoom } from './types';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { buildPlayingView, buildWaitingView } from './views';
// import { usersMessageHistory } from '@/plugins/smart-reply';
// import type { InlineKeyboardMarkup } from 'grammy/types';
import { sendOrEditPhotoToUsers } from './photoMessenger';

// Shared inline button type is defined in views.ts; avoid local re-declare to reduce duplication

export async function createRoom(params: Omit<PokerRoom, 'players' | 'readyPlayers' | 'playerNames'>): Promise<PokerRoom> {
  logFunctionStart('roomService.createRoom', { roomId: params.id, createdBy: params.createdBy });
  try {
    const repo = await import('@/actions/games/poker/room/services/roomRepo');
    const created = await repo.createRoom(params);
    logFunctionEnd('roomService.createRoom', { mode: 'db', roomId: created.id });
    return created;
  } catch (err) {
    logError('roomService.createRoom', err as Error, { roomId: params.id });
    throw err;
  }
}

export async function getRoom(roomId: string): Promise<PokerRoom | undefined> {
  try {
    const repo = await import('@/actions/games/poker/room/services/roomRepo');
    return await repo.getRoom(roomId);
  } catch (err) {
    logError('roomService.getRoom', err as Error, { roomId });
    return undefined;
  }
}

export async function addPlayer(roomId: string, userId: string): Promise<void> {
  const repo = await import('@/actions/games/poker/room/services/roomRepo');
  await repo.addPlayer(roomId, userId);
}

export async function removePlayer(roomId: string, userId: string): Promise<void> {
  const repo = await import('@/actions/games/poker/room/services/roomRepo');
  await repo.removePlayer(roomId, userId);
}

export async function markReady(roomId: string, userId: string): Promise<void> {
  const repo = await import('@/actions/games/poker/room/services/roomRepo');
  await repo.setReady(roomId, userId, true);
}

export async function markNotReady(roomId: string, userId: string): Promise<void> {
  const repo = await import('@/actions/games/poker/room/services/roomRepo');
  await repo.setReady(roomId, userId, false);
}

// Central function to broadcast room info to all players
import type { GameHubContext } from '@/plugins';

export async function broadcastRoomInfo(
  ctx: GameHubContext,
  roomId: string,
  targetUserIds?: string[],
  isDetailed?: boolean,
  overrideActingPos?: number
): Promise<void> {
  logFunctionStart('roomService.broadcastRoomInfo', { roomId, targetUserIds });
  
  try {
    const escapeHtml = (input: string): string =>
      input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    // Resolve GameHub context early (used by finance hook too)
    const hub: GameHubContext = ctx;

    // Early finance hook: if DB shows showdown, notify plugin even if room fetch fails
    {
      const { tryInvokeEarlyOnHandEnd } = await import('./financeHook');
      await tryInvokeEarlyOnHandEnd(hub, roomId);
    }

    // Get room data
    const room = await getRoom(roomId);
    if (!room) {
      logError('roomService.broadcastRoomInfo', new Error('room not found'), { roomId });
      return;
    }

    // Early finance hook will be invoked later once context is built
    let handId: string | undefined;

    // Get all players if no specific users provided
    const userIds = targetUserIds || room.players;
    
    // Generate room info message
    const playerCount = room.players.length;
    const maxPlayers = room.maxPlayers || 2;
    const smallBlind = room.smallBlind || 200;
    const bigBlind = smallBlind * 2;
    const timeout = room.turnTimeoutSec || 120;
    const timeoutMinutes = Math.round(timeout / 60);
    const lastUpdate = room.lastUpdate ? new Date(room.lastUpdate).toISOString() : 'Unknown';
    
    // Get player names and map UUID → Telegram chat ID
    const { getByIds } = await import('@/api/users');
    const dbUsers = await getByIds(room.players);
    const adminId = room.createdBy;
    const idToDisplayName: Record<string, string> = {};
    const idToTelegramId: Record<string, number> = {};
    for (const u of dbUsers) {
      const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
      const display = fullName || u.first_name || u.username || String(u.telegram_id) || 'Unknown';
      idToDisplayName[String(u.id)] = escapeHtml(display);
      idToTelegramId[String(u.id)] = Number(u.telegram_id);
    }
    let playerNames = room.players
      .map((uid) => {
        const name = idToDisplayName[uid] || 'Unknown';
        const isAdmin = uid === adminId;
        return `${name} ${isAdmin ? '👑 ' : ''}`;
      })
      .join('\n');
    
    // Inline keyboard and message builders
    const hasAtLeastTwoPlayers = (room.players?.length ?? 0) >= 2;

    // If playing, enrich per-user context via engine adapter
    const isPlaying = room.status === 'playing';
    let potTotal: number | undefined;
    const seatInfoByUser: Record<string, { stack: number; bet: number; hole?: string[] | null; inHand: boolean }> = {};
    let actingUuid: string | undefined;
    let currentBetGlobal: number = 0;
    let boardCards: string[] = [];
    let engineState: any | undefined;
    let seatPosByUuid: Record<string, number> = {};
    let showdownWinners: Array<{ uuid: string; display: string; amount: number; hand: string; combo?: string[] }> = [];
    // handId may already be set by early finance lookup
    if (isPlaying) {
      try {
        const { buildEngineContext } = await import('./engineAdapter');
        const ec = await buildEngineContext(hub, roomId, { smallBlind, maxPlayers }, overrideActingPos);
        potTotal = ec.potTotal;
        currentBetGlobal = ec.currentBetGlobal;
        boardCards = ec.boardCards;
        actingUuid = ec.actingUuid;
        engineState = ec.engineState;
        seatPosByUuid = ec.seatPosByUuid;
        handId = ec.handId;
        Object.assign(seatInfoByUser, ec.seatInfoByUser);
        if (engineState?.street === 'showdown' && typeof potTotal === 'number') {
          const { computeShowdownWinners } = await import('./winners');
          showdownWinners = await computeShowdownWinners(engineState, idToDisplayName, potTotal as number);
        }
      } catch {
        // non-blocking; fallback to basic view without engine details
      }
    }

    // Ensure minimal hand info even if not playing, to support showdown finance hook in tests
    if ((!engineState || !Array.isArray(boardCards) || boardCards.length === 0) && !handId) {
      try {
        const { supabaseFor } = await import('@/lib/supabase');
        const poker = supabaseFor('poker');
        const { data: hands } = await poker.from('hands').select('*').eq('room_id', roomId).order('created_at', { ascending: false }).limit(1);
        const hand = hands && (hands[0] as any);
        handId = hand?.id ?? handId;
        if (Array.isArray(hand?.board)) boardCards = hand.board as string[];
        if (!engineState && String(hand?.street || '') === 'showdown') engineState = { street: 'showdown', version: Number(hand?.version || 0) } as any;
      } catch {}
    }

    // Invoke finance plugin once on showdown (outside per-recipient loops)
    {
      const { invokeOnShowdown } = await import('./financeHook');
      await invokeOnShowdown(hub, { roomId, handId, engineState, boardCards, winners: showdownWinners });
    }

    // Mark acting player with an icon in the list, if available
    if (isPlaying && actingUuid) {
      const lines = playerNames.split('\n');
      playerNames = room.players.map((uid, idx) => {
        const base = lines[idx] || '';
        return uid === actingUuid ? `${base} 🎯` : base;
      }).join('\n');
    }

    // Helper: resolve preferred language for a telegram chat id
    const { getPreferredLanguageFromCache, getPreferredLanguage } = await import('@/modules/global/language');
    const { i18next, i18nPluginInstance } = await import('@/plugins/i18n');
    // Ensure i18next is initialized when broadcasting outside middleware
    try { await i18nPluginInstance.initialize(); } catch {}
    const SUPPORTED_LANGUAGES = ['en', 'fa'] as const;
    type Lang = typeof SUPPORTED_LANGUAGES[number];

    const resolveUserLanguage = async (chatId: number): Promise<Lang> => {
      const cached = getPreferredLanguageFromCache(String(chatId));
      const lang = cached || (await getPreferredLanguage(String(chatId))) || 'en';
      return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang) ? (lang as Lang) : 'en';
    };

    // Factory to create a translator bound to a specific language
    const createTranslatorFor = (lang: Lang) => (key: string, options?: Record<string, unknown>): string => {
      const out = i18next.t(key, { lng: lang, ...(options || {}) });
      if (lang === 'en' && out === '') return key;
      return typeof out === 'string' ? out : key;
    };
    // Default deterministic view (English) for logging/group fallbacks
    const defaultView = (isPlaying ? buildPlayingView : buildWaitingView)({
      roomId,
      playerNames,
      smallBlind,
      bigBlind,
      maxPlayers,
      playerCount,
      timeoutMinutes,
      lastUpdateIso: escapeHtml(lastUpdate),
      hasAtLeastTwoPlayers,
      t: createTranslatorFor('en'),
    }, isDetailed);
    
    const { resolveRecipients } = await import('./recipients');
    const { recipientChatIds, adminTelegramId, adminRecipients, nonAdminRecipients, idToDisplayName: idToDisplayNameResolved, telegramIdToUuid } = await resolveRecipients(hub, roomId, { players: room.players, createdBy: room.createdBy }, targetUserIds);
    // Prefer resolved display names
    Object.assign(idToDisplayName, idToDisplayNameResolved);
    const usePhotoFlow = Boolean((hub as any)?.api?.sendPhoto) && process.env.POKER_SINGLE_PHOTO_FLOW !== 'false' && isPlaying === true;
    hub.log?.debug?.('roomService.recipients', { roomId, targetUserIds, recipientChatIds });

    if (recipientChatIds.length === 0) {
      // Fallback: try explicit targetUserIds if any; otherwise use initiator chat id
      const initiatorId = Number(hub.from?.id);
      const fallback = (Array.isArray(targetUserIds) && targetUserIds.length > 0)
        ? targetUserIds.map((id) => Number(id)).filter((n) => Number.isFinite(n))
        : (Number.isFinite(initiatorId) ? [initiatorId] : []);
      if (fallback.length === 0) {
        logError('roomService.broadcastRoomInfo', new Error('Broadcast failed'), { roomId, targetUserIds });
        return;
      }
      // Use fallback recipients
      if (usePhotoFlow) {
        // Photo flow for fallback recipients (build per-user caption and keyboard)
        for (const chatId of fallback) {
          const lang = await resolveUserLanguage(Number(chatId));
          const t = createTranslatorFor(lang);
          const perUserView = (isPlaying ? buildPlayingView : buildWaitingView)({
            roomId,
            playerNames,
            smallBlind,
            bigBlind,
            maxPlayers,
            playerCount,
            timeoutMinutes,
            lastUpdateIso: escapeHtml(lastUpdate),
            hasAtLeastTwoPlayers,
            t,
          }, isDetailed);
          const inline_keyboard = perUserView.keyboardForPlayer as Array<Array<{ text: string; callback_data: string }>>;
          await sendOrEditPhotoToUsers(hub, roomId, [Number(chatId)], perUserView.message, inline_keyboard, {
            isPlaying,
            boardCards,
            seatInfoByUser,
            actingUuid,
            currentBetGlobal,
            isDetailed,
            telegramIdToUuid,
            
          });
        }
      } else {
        // Text flow: send one-by-one to respect per-user language
        const send = hub.sendOrEditMessageToUsers;
        for (const chatId of fallback) {
          const lang = await resolveUserLanguage(Number(chatId));
          const t = createTranslatorFor(lang);
          const perUserView = (isPlaying ? buildPlayingView : buildWaitingView)({
            roomId,
            playerNames,
            smallBlind,
            bigBlind,
            maxPlayers,
            playerCount,
            timeoutMinutes,
            lastUpdateIso: escapeHtml(lastUpdate),
            hasAtLeastTwoPlayers,
            t,
          }, isDetailed);
          await send(
            [Number(chatId)],
            perUserView.message,
            {
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: perUserView.keyboardForPlayer }
            }
          );
        }
      }
      logFunctionEnd('roomService.broadcastRoomInfo', {
        roomId,
        targetUserIds: fallback.length,
        messageLength: defaultView.message.length,
        note: 'fallback'
      });
      return;
    }

    // adminRecipients and nonAdminRecipients are resolved above

    if (adminRecipients.length > 0) {
      const adminLang = await resolveUserLanguage(Number(adminRecipients[0] || adminTelegramId));
      const tAdmin = createTranslatorFor(adminLang);
      const { sendToAdminRecipients } = await import('./senders');
      await sendToAdminRecipients(adminRecipients, tAdmin, adminId, {
        hub,
        roomId,
        isPlaying,
        isDetailed,
        playerCount,
        maxPlayers,
        timeoutMinutes,
        lastUpdateIso: escapeHtml(lastUpdate),
        playerNames,
        smallBlind,
        bigBlind,
        boardCards,
        currentBetGlobal,
        actingUuid,
        engineState,
        seatPosByUuid,
        seatInfoByUser,
        showdownWinners,
        telegramIdToUuid,
        potTotal,
      } as any);
    }

    if (nonAdminRecipients.length > 0) {
      if (isPlaying) {
        const { sendToNonAdminRecipients } = await import('./senders');
        await sendToNonAdminRecipients(nonAdminRecipients, resolveUserLanguage, createTranslatorFor as any, {
          hub,
          roomId,
          isPlaying,
          isDetailed,
          playerCount,
          maxPlayers,
          timeoutMinutes,
          lastUpdateIso: escapeHtml(lastUpdate),
          playerNames,
          smallBlind,
          bigBlind,
          boardCards,
          currentBetGlobal,
          actingUuid,
          engineState,
          seatPosByUuid,
          seatInfoByUser,
          showdownWinners,
          telegramIdToUuid,
          adminUuid: adminId,
          potTotal,
        } as any);
      } else {
        const { sendToNonAdminRecipients } = await import('./senders');
        await sendToNonAdminRecipients(nonAdminRecipients, resolveUserLanguage, createTranslatorFor as any, {
          hub,
          roomId,
          isPlaying,
          isDetailed,
          playerCount,
          maxPlayers,
          timeoutMinutes,
          lastUpdateIso: escapeHtml(lastUpdate),
          playerNames,
          smallBlind,
          bigBlind,
          boardCards,
          currentBetGlobal,
          actingUuid,
          engineState,
          seatPosByUuid,
          seatInfoByUser,
          showdownWinners,
          telegramIdToUuid,
          adminUuid: adminId,
          potTotal,
        } as any);
      }
    }

    // Also update the group room message if possible (so all members in the group see the update)
    const { sendGroupRoomMessage } = await import('./groupBroadcaster');
    await sendGroupRoomMessage(hub, roomId, isPlaying, defaultView.message, defaultView.keyboardForPlayer as unknown as { text: string; callback_data: string }[][]);
    
    logFunctionEnd('roomService.broadcastRoomInfo', { 
      roomId, 
      targetUserIds: userIds.length,
      messageLength: defaultView.message.length 
    });
  } catch (err) {
    logError('roomService.broadcastRoomInfo', err as Error, { roomId, targetUserIds });
  }
}


// photo helpers moved to photoMessenger.ts


