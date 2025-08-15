import type { PokerRoom } from './types';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { buildPlayingView, buildWaitingView } from './views';
import { usersMessageHistory } from '@/plugins/smart-reply';
import type { InputMediaPhoto, InlineKeyboardMarkup } from 'grammy/types';

// Shared inline button type
type Btn = { text: string } & ({ callback_data: string } | { switch_inline_query: string });

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
import type { HandlerContext } from '@/modules/core/handler';

export async function broadcastRoomInfo(
  ctx: GameHubContext | HandlerContext,
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
    // Get room data
    const room = await getRoom(roomId);
    if (!room) {
      logError('roomService.broadcastRoomInfo', new Error('room not found'), { roomId });
      return;
    }

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
    const gctx: GameHubContext = (typeof (ctx as GameHubContext).t === 'function')
      ? (ctx as GameHubContext)
      : (ctx as HandlerContext).ctx as unknown as GameHubContext;
    const adminTelegramId = idToTelegramId[adminId];
    const hasAtLeastTwoPlayers = (room.players?.length ?? 0) >= 2;
    const telegramIdToUuid: Record<number, string> = Object.fromEntries(
      Object.entries(idToTelegramId).map(([uuid, tg]) => [tg as number, uuid])
    );

    // If playing, enrich per-user context (light placeholder using seats/pots when available)
    const isPlaying = room.status === 'playing';
    let potTotal: number | undefined;
    const seatInfoByUser: Record<string, { stack: number; bet: number; hole?: string[] | null }> = {};
    let actingUuid: string | undefined;
    let currentBetGlobal: number = 0;
    let boardCards: string[] = [];
    // Engine-derived state for accurate per-user actions
    let engineState: any | undefined;
    let seatPosByUuid: Record<string, number> = {};
    let showdownWinners: Array<{ uuid: string; display: string; amount: number; hand: string; combo?: string[] }> = [];
    if (isPlaying) {
      try {
        const { supabaseFor } = await import('@/lib/supabase');
        const poker = supabaseFor('poker');
        // latest hand by room
        const { data: hands } = await poker.from('hands').select('*').eq('room_id', roomId).order('created_at', { ascending: false }).limit(1);
        const hand = hands && hands[0];
        const handId = hand?.id;
        (gctx as any)?.log?.debug?.('roomService.handFromDb', {
          roomId,
          handId,
          acting_pos: hand?.acting_pos,
          street: hand?.street,
          current_bet: hand?.current_bet,
          version: hand?.version
        });
        boardCards = Array.isArray(hand?.board) ? (hand?.board as string[]) : [];
        if (handId) {
          const { listSeatsByHand } = await import('./seatsRepo');
          const seats = await listSeatsByHand(String(handId));
          for (const s of seats) seatInfoByUser[s.user_id] = { stack: s.stack, bet: s.bet, hole: s.hole };
          const actingPos = overrideActingPos !== undefined ? overrideActingPos : Number(hand?.acting_pos || 0);
          if (typeof actingPos === 'number') {
            const actingSeat = seats.find((s) => Number(s.seat_pos) === actingPos);
            actingUuid = actingSeat?.user_id;
          }
          const { data: pots } = await poker.from('pots').select('*').eq('hand_id', handId);
          potTotal = (pots || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
          currentBetGlobal = Number(hand?.current_bet || 0);
          // Build engine state
          seatPosByUuid = Object.fromEntries(seats.map((s: any) => [String(s.user_id), Number(s.seat_pos)]));
          try {
            const engine = await import('@gamehub/poker-engine');
            const handForEngine = {
              id: String(handId),
              street: String(hand?.street || 'preflop') as any,
              button_pos: Number(hand?.button_pos || 0),
              acting_pos: overrideActingPos !== undefined ? overrideActingPos : Number(hand?.acting_pos || 0),
              min_raise: Number(hand?.min_raise || Number(room.smallBlind || 100) * 2),
              current_bet: Number(hand?.current_bet || 0),
              deck_seed: String(hand?.deck_seed || ''),
              board: Array.isArray(hand?.board) ? (hand?.board as string[]) : [],
            };
            (gctx as any)?.log?.debug?.('roomService.handForEngine', {
              roomId,
              handId,
              acting_pos: handForEngine.acting_pos,
              street: handForEngine.street,
              current_bet: handForEngine.current_bet
            });
            engineState = engine.reconstructStateFromDb({
              config: { smallBlind: Number(room.smallBlind || 100), bigBlind: Number(room.smallBlind || 100) * 2, maxPlayers: Number(room.maxPlayers || seats.length || 2) },
              hand: handForEngine,
              seats: seats.map((s: any) => ({
                hand_id: String(handId),
                seat_pos: Number(s.seat_pos),
                user_id: String(s.user_id),
                stack: Number(s.stack || 0),
                bet: Number(s.bet || 0),
                in_hand: Boolean(s.in_hand !== false),
                is_all_in: Boolean(s.is_all_in === true),
                hole: (s.hole as string[] | null) as any,
              })),
              pots: (pots as any[])?.map((p: any) => ({ hand_id: String(handId), amount: Number(p.amount || 0), eligible_seats: Array.isArray(p.eligible_seats) ? p.eligible_seats : [] })) || [],
            });
            (gctx as any)?.log?.debug?.('roomService.engineState', {
              roomId,
              street: engineState?.street,
              actingPos: engineState?.actingPos,
              actingUuid,
              board: engineState?.board,
              currentBet: engineState?.currentBet
            });

            // If showdown, compute winners for display using pokersolver (main pot only)
            if (engineState?.street === 'showdown') {
              try {
                const mod: any = await import('pokersolver');
                const Hand = (mod && (mod.Hand || (mod.default && mod.default.Hand))) as { solve: (cards: string[]) => { descr?: string }; winners: (hands: Array<{ descr?: string }>) => Array<{ descr?: string }> };
                if (!Hand || typeof Hand.solve !== 'function' || typeof Hand.winners !== 'function') {
                  throw new Error('pokersolver.Hand not available');
                }
                const toSolver = (code: string): string => {
                  const rankMap: Record<string, string> = { '10': 'T', T: 'T', J: 'J', Q: 'Q', K: 'K', A: 'A' };
                  const suitMap: Record<string, string> = { '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c' };
                  const m = code.match(/^(10|[2-9TJQKA])([♠♥♦♣])$/);
                  if (!m) return code;
                  const r = rankMap[m[1]] || m[1];
                  const s = suitMap[m[2]] || m[2];
                  return `${r}${s}`;
                };
                const solverBoard = (Array.isArray(engineState.board) ? engineState.board : []).map(toSolver);
                const activeSeats = (engineState.seats || []).filter((s: any) => s && s.inHand && Array.isArray(s.hole) && s.hole.length === 2);
                const seatToHand: Array<{ uuid: string; display: string; hand: { descr?: string; cards?: Array<{ value?: string; suit?: string }> } } > = activeSeats.map((s: any) => {
                  const uuid = String(s.userRef ?? s.user_id);
                  const hole = (s.hole as string[]).map(toSolver);
                  const cards = [...hole, ...solverBoard];
                  const hand = Hand.solve(cards) as { descr?: string };
                  const display = idToDisplayName[uuid] || 'Unknown';
                  return { uuid, display, hand };
                });
                const winners = Hand.winners(seatToHand.map((x) => x.hand)) as Array<{ descr?: string; cards?: Array<{ value?: string; suit?: string }> }>;
                const mainPot = typeof potTotal === 'number' ? potTotal : 0;
                const perWinner = winners && winners.length > 0 ? Math.floor(mainPot / winners.length) : 0;
                const toDisplay = (card: { value?: string; suit?: string } | undefined): string => {
                  if (!card) return '';
                  const r = String(card.value ?? '').toUpperCase();
                  const s = String(card.suit ?? '').toLowerCase();
                  const rank = r === 'T' ? '10' : r;
                  const suitMap: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
                  const suit = suitMap[s] || '';
                  return `${rank}${suit}`;
                };
                showdownWinners = seatToHand
                  .filter((x) => winners.includes(x.hand))
                  .map((x) => ({ 
                    uuid: x.uuid, 
                    display: x.display, 
                    amount: perWinner, 
                    hand: String(x.hand?.descr || ''),
                    combo: Array.isArray(x.hand?.cards) ? (x.hand!.cards!.slice(0,5).map(toDisplay).filter(Boolean) as string[]) : undefined
                  }));
              } catch (e) {
                (gctx as any)?.log?.warn?.('roomService.showdown:winners:failed', { err: (e as Error)?.message });
                showdownWinners = [];
              }
            }
          } catch {
            // engine optional; fallback to simple logic already computed
          }
        }
      } catch {
        // non-blocking
      }
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
    
    // Resolve recipient chat IDs:
    // - If explicit targetUserIds provided (Telegram IDs as strings), use them
    // - Else map room player UUIDs → Telegram chat IDs via idToTelegramId
    let recipientChatIds: number[] = [];
    if (Array.isArray(targetUserIds) && targetUserIds.length > 0) {
      const numeric = targetUserIds.map((id) => Number(id)).filter((n) => Number.isFinite(n));
      if (numeric.length === targetUserIds.length) {
        recipientChatIds = numeric;
      } else {
        // Assume provided IDs are UUIDs → map to telegram ids
        recipientChatIds = targetUserIds
          .map((uuid) => idToTelegramId[uuid])
          .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
      }
    } else {
      // Default recipients
      recipientChatIds = room.players
        .map((uuid) => idToTelegramId[uuid])
        .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
      // When playing, send to all players by default for game state updates
      // This ensures all players get notified when game starts or state changes
    }

    const usePhotoFlow = Boolean((gctx as any)?.api?.sendPhoto) && process.env.POKER_SINGLE_PHOTO_FLOW !== 'false' && isPlaying === true;

    (gctx as any)?.log?.debug?.('roomService.recipients', { roomId, targetUserIds, recipientChatIds });
    if (recipientChatIds.length === 0) {
      // Fallback: try explicit targetUserIds if any; otherwise use initiator chat id
      const initiatorId = Number((gctx as any)?.from?.id);
      const fallback = (Array.isArray(targetUserIds) && targetUserIds.length > 0)
        ? targetUserIds.map((id) => Number(id)).filter((n) => Number.isFinite(n))
        : (Number.isFinite(initiatorId) ? [initiatorId] : []);
      if (fallback.length === 0) {
        logError('roomService.broadcastRoomInfo', new Error('no_recipients'), { roomId, targetUserIds });
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
          const inline_keyboard = perUserView.keyboardForPlayer as unknown as Array<Array<{ text: string; callback_data: string }>>;
          await sendOrEditPhotoToUsers(gctx, roomId, [Number(chatId)], perUserView.message, inline_keyboard, {
            isPlaying,
            boardCards,
            seatInfoByUser,
            actingUuid,
            currentBetGlobal,
            isDetailed,
            idToTelegramId,
            telegramIdToUuid,
            adminId
          });
        }
      } else {
        // Text flow: send one-by-one to respect per-user language
        const send = (ctx as any).sendOrEditMessageToUsers ?? (gctx as any).sendOrEditMessageToUsers;
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

    // Split recipients into admin and non-admin for personalized keyboards
    const adminRecipients = adminTelegramId ? recipientChatIds.filter((id) => id === adminTelegramId) : [];
    const nonAdminRecipients = adminTelegramId ? recipientChatIds.filter((id) => id !== adminTelegramId) : recipientChatIds;
    (gctx as any)?.log?.debug?.('roomService.recipientGroups', { roomId, adminTelegramId, adminRecipients, nonAdminRecipients });

    if (adminRecipients.length > 0) {
      // Build admin-specific translator and view
      const adminLang = await resolveUserLanguage(Number(adminRecipients[0]));
      const tAdmin = createTranslatorFor(adminLang);
      const adminBaseView = (isPlaying ? buildPlayingView : buildWaitingView)({
        roomId,
        playerNames,
        smallBlind,
        bigBlind,
        maxPlayers,
        playerCount,
        timeoutMinutes,
        lastUpdateIso: escapeHtml(lastUpdate),
        hasAtLeastTwoPlayers,
        t: tAdmin,
      }, isDetailed);

      const adminInfo = seatInfoByUser[adminId];
        const adminCanCheck = typeof adminInfo?.bet === 'number' ? adminInfo.bet >= currentBetGlobal : false;
        const toggleDetailsText = isDetailed 
            ? tAdmin('poker.room.buttons.toggleSummary')
            : tAdmin('poker.room.buttons.toggleDetails');
           
          const actingRows: Btn[][] = [
            ...(adminCanCheck
              ? [
                  [{ text: tAdmin('poker.game.buttons.check'), callback_data: 'g.pk.r.ck' }],
                  [{ text: tAdmin('poker.actions.raise'), callback_data: 'g.pk.r.rs' }],
                  [{ text: tAdmin('poker.game.buttons.fold'), callback_data: 'g.pk.r.fd' }]
                ]
              : [
                  [{ text: tAdmin('poker.game.buttons.call'), callback_data: 'g.pk.r.cl' }],
                  [{ text: tAdmin('poker.actions.raise'), callback_data: 'g.pk.r.rs' }],
                  [{ text: tAdmin('poker.game.buttons.fold'), callback_data: 'g.pk.r.fd' }]
                ]
            ),
            [{ text: toggleDetailsText, callback_data: `g.pk.r.in?r=${roomId}&d=${!isDetailed}` }]
          ];
          const waitingRows: Btn[][] = [
            [{ text: tAdmin('bot.buttons.refresh'), callback_data: `g.pk.r.in?r=${roomId}` }],
            [{ text: toggleDetailsText, callback_data: `g.pk.r.in?r=${roomId}&d=${!isDetailed}` }]
          ];

      const isAdminActing = actingUuid && adminId === actingUuid;
      const postRoundRows: Btn[][] = [
        [{ text: tAdmin('poker.room.buttons.startGame') || '▶️ Start Game', callback_data: 'g.pk.r.st' }],
        [{ text: tAdmin('bot.buttons.refresh') || '🔄 Refresh', callback_data: `g.pk.r.in?r=${roomId}` }],
        [{ text: (isDetailed ? tAdmin('poker.room.buttons.toggleSummary') : tAdmin('poker.room.buttons.toggleDetails')), callback_data: `g.pk.r.in?r=${roomId}&d=${!isDetailed}` }]
      ];
      let keyboard = isPlaying ? (isAdminActing ? actingRows : waitingRows) : adminBaseView.keyboardForAdmin;
      if (isPlaying && engineState) {
        if (engineState.street === 'showdown') {
          keyboard = postRoundRows;
        } else {
        const engine = await import('@gamehub/poker-engine');
        const pos = seatPosByUuid[adminId];
        const allowed = typeof pos === 'number' ? engine.computeAllowedActions(engineState, pos) : [];
        const canCheck = allowed.includes('CHECK');
        const canRaise = allowed.includes('RAISE');
        const acting = typeof pos === 'number' && pos === Number(engineState.actingPos);
        (gctx as any)?.log?.debug?.('roomService.keyboardForAdmin', {
          roomId,
          adminTelegramId,
          adminUuid: adminId,
          pos,
          allowed,
          acting
        });
        const actionRows: Btn[][] = [
          [
            canCheck ? { text: tAdmin('poker.game.buttons.check'), callback_data: 'g.pk.r.ck' } : { text: tAdmin('poker.game.buttons.call'), callback_data: 'g.pk.r.cl' }
          ],
          ...(canRaise ? [[{ text: tAdmin('poker.actions.raise'), callback_data: 'g.pk.r.rs' }]] : []),
          [{ text: tAdmin('poker.game.buttons.fold'), callback_data: 'g.pk.r.fd' }],
          [{ text: toggleDetailsText, callback_data: `g.pk.r.in?r=${roomId}&d=${!isDetailed}` }]
        ];
        keyboard = acting && allowed.length > 0 ? actionRows : waitingRows;
        }
      }

      // Build personalized caption
      const base = adminBaseView.message;
      // Add board and cards and stack information before "Last update"
      let cardsBlock = '';
      let boardBlock = '';
      if (Array.isArray(boardCards) && boardCards.length > 0) {
        const boardLabel = tAdmin('poker.game.section.communityCards') || 'Community Cards';
        boardBlock = `\n\n${boardLabel}:\n${boardCards.join(' ')}`;
      }
      if (adminInfo?.hole && Array.isArray(adminInfo.hole) && adminInfo.hole.length > 0) {
        const cardsText = adminInfo.hole.join(' ');
        cardsBlock = `\n\n${tAdmin('poker.game.section.yourCards')}:\n${cardsText}`;
      }
      
      let stackBlock = '';
      const extraParts: string[] = [];
      const yourStackLabel = tAdmin('poker.game.field.yourStack') || 'Your stack';
      const yourBetLabel = tAdmin('poker.game.field.yourBet') || 'Your bet';
      const potLabel = tAdmin('poker.game.field.potLabel') || 'Pot';
      if (typeof adminInfo?.stack === 'number') extraParts.push(`${yourStackLabel}: ${adminInfo.stack}`);
      if (typeof adminInfo?.bet === 'number') extraParts.push(`${yourBetLabel}: ${adminInfo.bet}`);
      if (typeof potTotal === 'number') extraParts.push(`${potLabel}: ${potTotal}`);
      if (extraParts.length > 0) {
        stackBlock = `\n\n${extraParts.join(' | ')}`;
      }

      // Results block for showdown
      let resultsBlock = '';
      if (engineState?.street === 'showdown' && showdownWinners.length > 0) {
        const lines = showdownWinners.map((w) => `• ${w.display}: +${w.amount}${w.hand ? ` (${w.hand})` : ''}${w.combo && w.combo.length ? `\n  ⮑ ${w.combo.join(' ')}` : ''}`);
        resultsBlock = `\n\n🏁 Results:\n${lines.join('\n')}`;
      }

      
      // Insert cards and stack before "Last update"
      const lastUpdatePattern = `\n\nLast update:`;
      const parts = base.split(lastUpdatePattern);
      const adminCaption = parts.length > 1 
        ? `${parts[0]}${boardBlock}${cardsBlock}${stackBlock}${resultsBlock}${lastUpdatePattern}${parts[1]}`
        : `${base}${boardBlock}${cardsBlock}${stackBlock}${resultsBlock}`;

      if (usePhotoFlow) {
        await sendOrEditPhotoToUsers(gctx, roomId, adminRecipients, adminCaption, keyboard, {
          isPlaying,
          boardCards,
          seatInfoByUser,
          actingUuid,
          currentBetGlobal,
          isDetailed,
          idToTelegramId,
          telegramIdToUuid,
          adminId
        });
      } else {
        const send = (ctx as any).sendOrEditMessageToUsers ?? (gctx as any).sendOrEditMessageToUsers;
        await send(
          adminRecipients,
          adminCaption,
          {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: keyboard }
          }
        );
      }
    }

    if (nonAdminRecipients.length > 0) {
      if (isPlaying) {
        for (const chatId of nonAdminRecipients) {
          const lang = await resolveUserLanguage(Number(chatId));
          const tUser = createTranslatorFor(lang);
          const perUserView = buildPlayingView({
            roomId,
            playerNames,
            smallBlind,
            bigBlind,
            maxPlayers,
            playerCount,
            timeoutMinutes,
            lastUpdateIso: escapeHtml(lastUpdate),
            hasAtLeastTwoPlayers,
            t: tUser,
          }, isDetailed);
          const uuid = telegramIdToUuid[chatId];
          const info = uuid ? seatInfoByUser[uuid] : undefined;
          const base = perUserView.message;
          
          // Debug: log seat info
          (gctx as any)?.log?.debug?.('roomService.broadcastRoomInfo:seatInfo', { 
            chatId, uuid, info, seatInfoByUser: Object.keys(seatInfoByUser) 
          });
          
          // Add board and cards and stack information before "Last update"
          let cardsBlock = '';
          let boardBlock = '';
          if (Array.isArray(boardCards) && boardCards.length > 0) {
            const boardLabel = tUser('poker.game.section.communityCards') || 'Community Cards';
            boardBlock = `\n\n${boardLabel}:\n${boardCards.join(' ')}`;
          }
          if (info?.hole && Array.isArray(info.hole) && info.hole.length > 0) {
            const cardsText = info.hole.join(' ');
            cardsBlock = `\n\n${tUser('poker.game.section.yourCards')}:\n${cardsText}`;
          }
          
          let stackBlock = '';
          const extraParts: string[] = [];
          const yourStackLabel = tUser('poker.game.field.yourStack') || 'Your stack';
          const yourBetLabel = tUser('poker.game.field.yourBet') || 'Your bet';
          const potLabel = tUser('poker.game.field.potLabel') || 'Pot';
          if (info && typeof info.stack === 'number') extraParts.push(`${yourStackLabel}: ${info.stack}`);
          if (info && typeof info.bet === 'number') extraParts.push(`${yourBetLabel}: ${info.bet}`);
          if (typeof potTotal === 'number') extraParts.push(`${potLabel}: ${potTotal}`);
          if (extraParts.length > 0) {
            stackBlock = `\n\n${extraParts.join(' | ')}`;
          }
          
          // Results block for showdown
          let resultsBlock = '';
          if (engineState?.street === 'showdown' && showdownWinners.length > 0) {
            const lines = showdownWinners.map((w) => `• ${w.display}: +${w.amount}${w.hand ? ` (${w.hand})` : ''}${w.combo && w.combo.length ? `\n  ⮑ ${w.combo.join(' ')}` : ''}`);
            resultsBlock = `\n\n🏁 Results:\n${lines.join('\n')}`;
          }


          // Insert cards and stack before "Last update"
          const lastUpdatePattern = `\n\nLast update:`;
          const parts = base.split(lastUpdatePattern);
          const message = parts.length > 1 
            ? `${parts[0]}${boardBlock}${cardsBlock}${stackBlock}${resultsBlock}${lastUpdatePattern}${parts[1]}`
            : `${base}${boardBlock}${cardsBlock}${stackBlock}${resultsBlock}`;
          const isActing = actingUuid && uuid === actingUuid;
          let canCheck = false;
          let canRaise = false;
          if (engineState && typeof seatPosByUuid[uuid] === 'number') {
            const engine = await import('@gamehub/poker-engine');
            const allowed = engine.computeAllowedActions(engineState, seatPosByUuid[uuid]);
            canCheck = allowed.includes('CHECK');
            canRaise = allowed.includes('RAISE');
            (gctx as any)?.log?.debug?.('roomService.keyboardForUser', {
              roomId,
              chatId,
              uuid,
              pos: seatPosByUuid[uuid],
              allowed,
              isActing
            });
          } else {
            const userInfo = info;
            canCheck = typeof userInfo?.stack === 'number' && typeof userInfo?.bet === 'number' ? userInfo.bet >= currentBetGlobal : false;
          }
          const toggleDetailsText = isDetailed 
            ? tUser('poker.room.buttons.toggleSummary')
            : tUser('poker.room.buttons.toggleDetails');
          
          const actingRows: Btn[][] = [
            [canCheck ? { text: tUser('poker.game.buttons.check'), callback_data: 'g.pk.r.ck' } : { text: tUser('poker.game.buttons.call'), callback_data: 'g.pk.r.cl' }],
            ...(canRaise ? [[{ text: tUser('poker.actions.raise'), callback_data: 'g.pk.r.rs' }]] : []),
            [{ text: tUser('poker.game.buttons.fold'), callback_data: 'g.pk.r.fd' }],
            [{ text: toggleDetailsText, callback_data: `g.pk.r.in?r=${roomId}&d=${!isDetailed}` }]
          ];
          const waitingRows: Btn[][] = [
            [{ text: tUser('bot.buttons.refresh'), callback_data: `g.pk.r.in?r=${roomId}` }],
            [{ text: toggleDetailsText, callback_data: `g.pk.r.in?r=${roomId}&d=${!isDetailed}` }]
          ];

          let rowsToUse = waitingRows;
          if (engineState?.street === 'showdown') {
            rowsToUse = waitingRows;
          } else if (isActing) {
            if (engineState && typeof seatPosByUuid[uuid] === 'number') {
              const engine = await import('@gamehub/poker-engine');
              const al = engine.computeAllowedActions(engineState, seatPosByUuid[uuid]);
              rowsToUse = al && al.length > 0 ? actingRows : waitingRows;
            } else {
              rowsToUse = (canCheck || canRaise) ? actingRows : waitingRows;
            }
          }

          if (usePhotoFlow) {
            await sendOrEditPhotoToUsers(gctx, roomId, [chatId], message, rowsToUse, {
              isPlaying,
              boardCards,
              seatInfoByUser,
              actingUuid,
              currentBetGlobal,
              isDetailed,
              idToTelegramId,
              telegramIdToUuid,
              adminId
            });
          } else {
            const send = (ctx as any).sendOrEditMessageToUsers ?? (gctx as any).sendOrEditMessageToUsers;
            await send(
              [chatId],
              message,
              {
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: rowsToUse }
              }
            );
          }
        }
      } else {
        // Waiting state: send text per user with per-user language
        const send = (ctx as any).sendOrEditMessageToUsers ?? (gctx as any).sendOrEditMessageToUsers;
        for (const chatId of nonAdminRecipients) {
          const lang = await resolveUserLanguage(Number(chatId));
          const tUser = createTranslatorFor(lang);
          const perUserView = buildWaitingView({
            roomId,
            playerNames,
            smallBlind,
            bigBlind,
            maxPlayers,
            playerCount,
            timeoutMinutes,
            lastUpdateIso: escapeHtml(lastUpdate),
            hasAtLeastTwoPlayers,
            t: tUser,
          }, isDetailed);
          await send(
            [chatId],
            perUserView.message,
            {
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: perUserView.keyboardForPlayer }
            }
          );
        }
      }
    }

    // Also update the group room message if possible (so all members in the group see the update)
    try {
      const roomsApi = await import('@/api/rooms');
      const dbRoom: any = await roomsApi.getById(roomId);
      const lastChatId = Number(dbRoom?.last_chat_id);
      if (Number.isFinite(lastChatId) && (gctx as any)?.telegram?.sendMessage) {
        // Skip group broadcast during playing to avoid leaking private context
        if (!isPlaying) {
          await (gctx as any).telegram.sendMessage(lastChatId, defaultView.message, {
            parseMode: 'HTML',
            replyMarkup: { inline_keyboard: defaultView.keyboardForPlayer }
          });
        }
      }
    } catch {
      // Ignore group broadcast errors in environments/tests without telegram plugin
      (gctx as unknown as { log?: { debug?: (msg: string, obj: unknown) => void } })?.log?.debug?.('roomService.broadcastRoomInfo:group-send:skipped', { roomId });
    }
    
    logFunctionEnd('roomService.broadcastRoomInfo', { 
      roomId, 
      targetUserIds: userIds.length,
      messageLength: defaultView.message.length 
    });
  } catch (err) {
    logError('roomService.broadcastRoomInfo', err as Error, { roomId, targetUserIds });
  }
}


// --- helpers for photo-based updates ---

type SendPhotoContext = GameHubContext;

interface PhotoSendContext {
  isPlaying: boolean;
  boardCards: string[];
  seatInfoByUser: Record<string, { stack: number; bet: number; hole?: string[] | null }>;
  actingUuid?: string;
  currentBetGlobal: number;
  isDetailed?: boolean;
  idToTelegramId: Record<string, number>;
  telegramIdToUuid: Record<number, string>;
  adminId: string;
}

function normalizeCardCodeToAssetName(code: string): string {
  const rankMap: Record<string, string> = { A: 'ace', K: 'king', Q: 'queen', J: 'jack', T: '10' };
  const suitMap: Record<string, string> = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
  const match = code.match(/^(10|[2-9TJQKA])([♠♥♦♣])$/);
  if (!match) return code;
  const [, rawRank, rawSuit] = match;
  const rank = rankMap[rawRank] || rawRank;
  const suit = suitMap[rawSuit] || rawSuit;
  return `${rank}_of_${suit}`;
}

function toAssetCards(board: string[], hole: string[]): { cards: string[]; template: 'poker-table' } {
  // Always use poker-table: [ flop-1, flop-2, flop-3, turn, river, player-1, player-2 ]
  const paddedBoard = [
    board[0] ?? 'blank',
    board[1] ?? 'blank',
    board[2] ?? 'blank',
    board[3] ?? 'blank',
    board[4] ?? 'blank',
  ];
  const paddedHole = [
    (hole && hole[0]) ? hole[0] : 'blank',
    (hole && hole[1]) ? hole[1] : 'blank',
  ];
  const cards = [...paddedBoard, ...paddedHole].map((c) => normalizeCardCodeToAssetName(c));
  return { cards, template: 'poker-table' };
}

async function getTemplateFileId(cardsAssets: string[], debugTag: string | undefined, templateId: 'poker-table' | 'full-game'): Promise<{ fileId?: string; usedTemplate: 'poker-table' | 'full-game' } > {
  // Generate and send to card service channel to obtain a reusable fileId
  // Then read it from cache
  // Skip remote send in environments without bot credentials; fall back to buffer path
  if (!process.env.BOT_TOKEN || !process.env.TARGET_CHANNEL_ID) {
    return { fileId: undefined, usedTemplate: templateId };
  }
    const cardImageService = await import('../../../../../../packages/card-image-service/dist/index.js');
  const { generateAndSendTemplateImage, generateTemplateRequestHash, ImageCache } = cardImageService as {
    generateAndSendTemplateImage: (
      templateId: string,
      cards: string[],
      style?: string,
      debugTag?: string,
      format?: 'png' | 'webp' | 'jpeg',
      transparent?: boolean,
      asDocument?: boolean
    ) => Promise<string>;
    generateTemplateRequestHash: (opts: { templateId: string; cards: string[]; style?: string; debugTag?: string; format?: 'png' | 'webp' | 'jpeg'; transparent?: boolean }) => string;
    ImageCache: new () => { get: (hash: string) => { fileId?: string } | null };
  };

  try {
    await generateAndSendTemplateImage(templateId, cardsAssets, 'general', debugTag, 'jpeg', false, false);
    const hash = generateTemplateRequestHash({ templateId, cards: cardsAssets, style: 'general', debugTag, format: 'jpeg', transparent: false });
    const cache = new ImageCache();
    const cached = cache.get(hash);
    return { fileId: cached?.fileId, usedTemplate: templateId };
  } catch {
    return { fileId: undefined, usedTemplate: templateId };
  }
}

async function sendOrEditPhotoToUsers(
  gctx: SendPhotoContext,
  roomId: string,
  userIds: number[],
  caption: string,
  keyboard: Btn[][],
  extra: PhotoSendContext
): Promise<void> {
  for (const userId of userIds) {
    const chatId = userId;
    const uuid = extra.telegramIdToUuid[chatId];
    const hole = (uuid && extra.seatInfoByUser[uuid]?.hole) ? (extra.seatInfoByUser[uuid]?.hole as string[]) : [];
    const { cards: cardsAssets, template } = toAssetCards(extra.boardCards, hole);
    const debugTag = `room:${roomId}`;
    const { fileId } = await getTemplateFileId(cardsAssets, debugTag, template);

    const previous = usersMessageHistory[String(chatId)];
    const callbackMessage = (gctx as any)?.callbackQuery?.message as { message_id?: number; chat?: { id?: number | string }; photo?: Array<{ file_id: string }> } | undefined;
    const callbackChatId = callbackMessage?.chat?.id !== undefined ? String(callbackMessage.chat.id) : undefined;
    const callbackMessageId = callbackMessage?.message_id;
    const isInitiator = String((gctx as any)?.from?.id ?? '') === String(chatId);
    const isFromCallbackAndSameChat = Boolean(callbackMessageId && callbackChatId === String(chatId));
    const hasCallbackPhoto = Array.isArray(callbackMessage?.photo) && callbackMessage!.photo!.length > 0;
    const existingPhotoFileId = hasCallbackPhoto ? callbackMessage!.photo![callbackMessage!.photo!.length - 1]!.file_id : undefined;
    const isEditingCurrentMessage = Boolean(isInitiator && isFromCallbackAndSameChat && hasCallbackPhoto && previous && previous.messageId === callbackMessageId);

    const inline_keyboard: InlineKeyboardMarkup['inline_keyboard'] = keyboard as InlineKeyboardMarkup['inline_keyboard'];

    try {
      (gctx as any)?.log?.debug?.('roomService.sendOrEditPhotoToUsers.intent', { roomId, chatId: String(chatId), isEditingCurrentMessage, hasPrevious: !!previous, hasCallbackPhoto, fileId: !!fileId, existingPhotoFileId: !!existingPhotoFileId });
      if (isEditingCurrentMessage && previous) {
        // Prefer editing media: use new fileId when available, otherwise regenerate buffer and edit media with new content
        if (fileId) {
          const media: InputMediaPhoto = { type: 'photo', media: fileId as string, caption, parse_mode: 'HTML' };
          await (gctx as any).api.editMessageMedia(String(chatId), previous.messageId, media, { reply_markup: { inline_keyboard } });
        } else {
          const cardImageService = await import('../../../../../../packages/card-image-service/dist/index.js');
          const { generateTemplateBufferOnly } = cardImageService as { generateTemplateBufferOnly: (templateId: string, cards: string[], style?: string, debugTag?: string, format?: 'png' | 'webp' | 'jpeg', transparent?: boolean) => Promise<Buffer> };
          const { InputFile } = await import('grammy');
          const buffer = await generateTemplateBufferOnly(template, cardsAssets, 'general', debugTag, 'jpeg', false);
          const media: InputMediaPhoto = { type: 'photo', media: new InputFile(buffer, 'table.jpg') as any, caption, parse_mode: 'HTML' };
          await (gctx as any).api.editMessageMedia(String(chatId), previous.messageId, media, { reply_markup: { inline_keyboard } });
        }
        // Update history timestamp
        usersMessageHistory[String(chatId)] = {
          chatId: String(chatId),
          messageId: previous.messageId,
          timestamp: Date.now(),
          userId: String(chatId),
          messageType: 'room_info'
        };
        continue;
      }

      // Not editing current: delete previous if exists and send new photo
      if (previous) {
        try {
          await (gctx as any).api.deleteMessage(previous.chatId, previous.messageId);
        } catch {
          // ignore
        }
      }

      if (fileId) {
        const sent = await (gctx as any).api.sendPhoto(String(chatId), fileId, { caption, parse_mode: 'HTML', reply_markup: { inline_keyboard } });
        (gctx as any)?.log?.debug?.('roomService.sendPhoto.sent', { roomId, chatId: String(chatId), via: 'fileId', messageId: sent?.message_id });
        usersMessageHistory[String(chatId)] = { chatId: String(chatId), messageId: sent.message_id, timestamp: Date.now(), userId: String(chatId), messageType: 'room_info' };
      } else {
        // Fallback to buffer generation
        const cardImageService = await import('../../../../../../packages/card-image-service/dist/index.js');
        const { generateTemplateBufferOnly } = cardImageService as { generateTemplateBufferOnly: (templateId: string, cards: string[], style?: string, debugTag?: string, format?: 'png' | 'webp' | 'jpeg', transparent?: boolean) => Promise<Buffer> };
        const { InputFile } = await import('grammy');
        const buffer = await generateTemplateBufferOnly(template, cardsAssets, 'general', debugTag, 'jpeg', false);
        const sent = await (gctx as any).api.sendPhoto(String(chatId), new InputFile(buffer, 'table.jpg'), { caption, parse_mode: 'HTML', reply_markup: { inline_keyboard } });
        (gctx as any)?.log?.debug?.('roomService.sendPhoto.sent', { roomId, chatId: String(chatId), via: 'buffer', messageId: sent?.message_id });
        usersMessageHistory[String(chatId)] = { chatId: String(chatId), messageId: sent.message_id, timestamp: Date.now(), userId: String(chatId), messageType: 'room_info' };
      }
    } catch (error) {
      logError('roomService.sendOrEditPhotoToUsers', error as Error, { roomId, chatId: String(chatId) });
    }
  }
}


