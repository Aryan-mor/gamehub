import type { PokerRoom } from './types';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { buildPlayingView, buildWaitingView } from './views';

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
  isDetailed?: boolean
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
    type Btn = { text: string } & ({ callback_data: string } | { switch_inline_query: string });
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
    if (isPlaying) {
      try {
        const { supabaseFor } = await import('@/lib/supabase');
        const poker = supabaseFor('poker');
        // latest hand by room
        const { data: hands } = await poker.from('hands').select('*').eq('room_id', roomId).order('created_at', { ascending: false }).limit(1);
        const hand = hands && hands[0];
        const handId = hand?.id;
        if (handId) {
          const { listSeatsByHand } = await import('./seatsRepo');
          const seats = await listSeatsByHand(String(handId));
          for (const s of seats) seatInfoByUser[s.user_id] = { stack: s.stack, bet: s.bet, hole: s.hole };
          if (typeof hand?.acting_pos === 'number') {
            const actingSeat = seats.find((s) => Number(s.seat_pos) === Number(hand.acting_pos));
            actingUuid = actingSeat?.user_id;
          }
          const { data: pots } = await poker.from('pots').select('*').eq('hand_id', handId);
          potTotal = (pots || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
          currentBetGlobal = Number(hand?.current_bet || 0);
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

    const view = (isPlaying ? buildPlayingView : buildWaitingView)({
      roomId,
      playerNames,
      smallBlind,
      bigBlind,
      maxPlayers,
      playerCount,
      timeoutMinutes,
      lastUpdateIso: escapeHtml(lastUpdate),
      hasAtLeastTwoPlayers,
      t: gctx.t.bind(gctx),
      // per-user extras filled when sending to each user below
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
      const send = (ctx as any).sendOrEditMessageToUsers ?? (gctx as any).sendOrEditMessageToUsers;
      await send(
        fallback,
        view.message,
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: view.keyboardForPlayer }
        }
      );
      logFunctionEnd('roomService.broadcastRoomInfo', {
        roomId,
        targetUserIds: fallback.length,
        messageLength: view.message.length,
        note: 'fallback'
      });
      return;
    }

    // Split recipients into admin and non-admin for personalized keyboards
    const adminRecipients = adminTelegramId ? recipientChatIds.filter((id) => id === adminTelegramId) : [];
    const nonAdminRecipients = adminTelegramId ? recipientChatIds.filter((id) => id !== adminTelegramId) : recipientChatIds;

    if (adminRecipients.length > 0) {
      const send = (ctx as any).sendOrEditMessageToUsers ?? (gctx as any).sendOrEditMessageToUsers;
          const adminExtras = isPlaying ? {
          message: ((): string => {
          const base = view.message;
          const info = seatInfoByUser[adminId] || {} as any;
            const extraParts: string[] = [];
            const yourStackLabel = gctx.t('poker.game.field.yourStack') || 'Your stack';
            const yourBetLabel = gctx.t('poker.game.field.yourBet') || 'Your bet';
            const potLabel = gctx.t('poker.game.field.potLabel') || 'Pot';
            if (typeof info.stack === 'number') extraParts.push(`${yourStackLabel}: ${info.stack}`);
            if (typeof info.bet === 'number') extraParts.push(`${yourBetLabel}: ${info.bet}`);
            if (typeof potTotal === 'number') extraParts.push(`${potLabel}: ${potTotal}`);
            const extrasLine = extraParts.join(' | ');
            let cardsBlock = '';
            if (info?.hole && Array.isArray(info.hole) && info.hole.length > 0) {
              const cardsText = info.hole.join(' ');
              cardsBlock = `${gctx.t('poker.game.section.yourCards')}: ${cardsText}\n\n`;
            }
            const suffix = [cardsBlock, extrasLine].filter(Boolean).join('');
            return suffix ? `${base}\n\n${suffix}` : base;
        })(),
      } : undefined;
      // Keyboard selection: acting gets action buttons, others get waiting minimal
      const isAdminActing = actingUuid && adminId === actingUuid;
      const adminInfo = seatInfoByUser[adminId];
      const adminCanCheck = typeof adminInfo?.bet === 'number' ? adminInfo.bet >= currentBetGlobal : false;
      const showDetailsText = gctx.t('poker.room.buttons.showDetails') || '📋 Show Details';
      const showSummaryText = gctx.t('poker.room.buttons.showSummary') || '📝 Show Summary';
      
      const actingRows: Btn[][] = [
        ...(adminCanCheck
          ? [
              [{ text: gctx.t('poker.game.buttons.check'), callback_data: 'g.pk.r.ck' }],
              [{ text: gctx.t('poker.actions.raise'), callback_data: 'g.pk.r.rs' }],
              [{ text: gctx.t('poker.game.buttons.fold'), callback_data: 'g.pk.r.fd' }]
            ]
          : [
              [{ text: gctx.t('poker.game.buttons.call'), callback_data: 'g.pk.r.cl' }],
              [{ text: gctx.t('poker.actions.raise'), callback_data: 'g.pk.r.rs' }],
              [{ text: gctx.t('poker.game.buttons.fold'), callback_data: 'g.pk.r.fd' }]
            ]
        ),
        [{ text: isDetailed ? showSummaryText : showDetailsText, callback_data: `g.pk.r.in?detailed=${!isDetailed}` }]
      ];
      const waitingRows: Btn[][] = [
        [{ text: gctx.t('bot.buttons.refresh'), callback_data: 'g.pk.r.in' }],
        [{ text: isDetailed ? showSummaryText : showDetailsText, callback_data: `g.pk.r.in?detailed=${!isDetailed}` }]
      ];
      await send(
        adminRecipients,
        adminExtras?.message ?? view.message,
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: isPlaying ? (isAdminActing ? actingRows : waitingRows) : view.keyboardForAdmin }
        }
      );
    }

    if (nonAdminRecipients.length > 0) {
      const send = (ctx as any).sendOrEditMessageToUsers ?? (gctx as any).sendOrEditMessageToUsers;
      if (isPlaying) {
        for (const chatId of nonAdminRecipients) {
          const uuid = telegramIdToUuid[chatId];
          const info = uuid ? seatInfoByUser[uuid] : undefined;
          const base = view.message;
          const extraParts: string[] = [];
          
          // Debug: log seat info
          (gctx as any)?.log?.debug?.('roomService.broadcastRoomInfo:seatInfo', { 
            chatId, uuid, info, seatInfoByUser: Object.keys(seatInfoByUser) 
          });
          
          const yourStackLabel = gctx.t('poker.game.field.yourStack') || 'Your stack';
          const yourBetLabel = gctx.t('poker.game.field.yourBet') || 'Your bet';
          const potLabel = gctx.t('poker.game.field.potLabel') || 'Pot';
          if (info && typeof info.stack === 'number') extraParts.push(`${yourStackLabel}: ${info.stack}`);
          if (info && typeof info.bet === 'number') extraParts.push(`${yourBetLabel}: ${info.bet}`);
          if (typeof potTotal === 'number') extraParts.push(`${potLabel}: ${potTotal}`);
          const extrasLine = extraParts.join(' | ');
          let cardsBlock = '';
          if (info?.hole && Array.isArray(info.hole) && info.hole.length > 0) {
            const cardsText = info.hole.join(' ');
            cardsBlock = `${gctx.t('poker.game.section.yourCards')}: ${cardsText}\n\n`;
          }
          const message = [cardsBlock, extrasLine].filter(Boolean).length > 0
            ? `${base}\n\n${[cardsBlock, extrasLine].filter(Boolean).join('')}`
            : base;
          const isActing = actingUuid && uuid === actingUuid;
          const userInfo = info;
          const canCheck = typeof userInfo?.stack === 'number' && typeof userInfo?.bet === 'number'
            ? userInfo.bet >= currentBetGlobal
            : false;
          const showDetailsText = gctx.t('poker.room.buttons.showDetails') || '📋 Show Details';
          const showSummaryText = gctx.t('poker.room.buttons.showSummary') || '📝 Show Summary';
          
          const actingRows: Btn[][] = [
            ...(canCheck
              ? [
                  [{ text: gctx.t('poker.game.buttons.check'), callback_data: 'g.pk.r.ck' }],
                  [{ text: gctx.t('poker.actions.raise'), callback_data: 'g.pk.r.rs' }],
                  [{ text: gctx.t('poker.game.buttons.fold'), callback_data: 'g.pk.r.fd' }]
                ]
              : [
                  [{ text: gctx.t('poker.game.buttons.call'), callback_data: 'g.pk.r.cl' }],
                  [{ text: gctx.t('poker.actions.raise'), callback_data: 'g.pk.r.rs' }],
                  [{ text: gctx.t('poker.game.buttons.fold'), callback_data: 'g.pk.r.fd' }]
                ]
            ),
            [{ text: isDetailed ? showSummaryText : showDetailsText, callback_data: `g.pk.r.in?detailed=${!isDetailed}` }]
          ];
          const waitingRows: Btn[][] = [
            [{ text: gctx.t('bot.buttons.refresh'), callback_data: 'g.pk.r.in' }],
            [{ text: isDetailed ? showSummaryText : showDetailsText, callback_data: `g.pk.r.in?detailed=${!isDetailed}` }]
          ];
          await send(
            [chatId],
            message,
            {
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: isActing ? actingRows : waitingRows }
            }
          );
        }
      } else {
        await send(
          nonAdminRecipients,
          view.message,
          {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: view.keyboardForPlayer }
          }
        );
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
          await (gctx as any).telegram.sendMessage(lastChatId, view.message, {
            parseMode: 'HTML',
            replyMarkup: { inline_keyboard: view.keyboardForPlayer }
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
      messageLength: view.message.length 
    });
  } catch (err) {
    logError('roomService.broadcastRoomInfo', err as Error, { roomId, targetUserIds });
  }
}


