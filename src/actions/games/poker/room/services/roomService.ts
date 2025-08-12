import type { PokerRoom } from './types';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

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
  targetUserIds?: string[]
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
    const playerNames = room.players
      .map((uid) => {
        const name = idToDisplayName[uid] || 'Unknown';
        const isAdmin = uid === adminId;
        return `${isAdmin ? '👑 ' : ''}${name}`;
      })
      .join('\n');
    
    // Generate inline keyboard buttons (base layout)
    type Btn = { text: string } & ({ callback_data: string } | { switch_inline_query: string });
    const baseRows: Btn[][] = [];
    const gctx: GameHubContext = (typeof (ctx as GameHubContext).t === 'function')
      ? (ctx as GameHubContext)
      : (ctx as HandlerContext).ctx as unknown as GameHubContext;
    const tr = (key: string, fallback: string, options?: Record<string, unknown>): string => {
      const v = gctx.t(key, options) as string;
      // If i18n not wired in tests (t returns key), fallback to English
      const looksLikeKey = v.includes('.') || v.includes('poker.') || v.includes('bot.');
      const hasUnresolved = v.includes('{{');
      return v && !looksLikeKey && !hasUnresolved ? v : fallback;
    };
    const refreshText = tr('bot.buttons.refresh', '🔄 Refresh');
    const shareText = tr('bot.buttons.share', '📤 Share');
    const leaveText = tr('poker.room.buttons.leave', '🚪 Leave Room');
    
    baseRows.push([{ text: refreshText, callback_data: 'g.pk.r.in' }]);
    baseRows.push([{ text: shareText, switch_inline_query: `poker ${roomId}` }]);
    baseRows.push([{ text: leaveText, callback_data: `g.pk.r.lv?roomId=${roomId}` }]);

    // Prepare admin-specific layout if conditions met
    const adminTelegramId = idToTelegramId[adminId];
    const hasAtLeastTwoPlayers = (room.players?.length ?? 0) >= 2;
    const startText = tr('poker.room.buttons.startGame', '🎮 Start Game');
    const adminRows: Btn[][] = hasAtLeastTwoPlayers
      ? [
          [{ text: startText, callback_data: 'g.pk.r.st' }],
          [{ text: refreshText, callback_data: 'g.pk.r.in' }],
          [{ text: shareText, switch_inline_query: `poker ${roomId}` }],
          [{ text: leaveText, callback_data: `g.pk.r.lv?roomId=${roomId}` }],
        ]
      : baseRows;
    
    const title = tr('poker.room.info.title', '🏠 Poker Room Info');
    const sectionDetails = tr('poker.room.info.section.details', '📋 Room Details');
    const fieldId = tr('poker.room.info.field.id', '• ID');
    const fieldStatus = tr('poker.room.info.field.status', '• Status');
    const fieldType = tr('poker.room.info.field.type', '• Type');
    const sectionSettings = tr('poker.room.info.section.settings', '⚙️ Game Settings');
    const fieldSmallBlind = tr('poker.room.info.field.smallBlind', '• Small Blind');
    // const fieldRound = gctx.t('poker.room.info.field.round') || '• Round';
    const fieldMaxPlayers = tr('poker.room.info.field.maxPlayers', '• Max Players');
    const fieldTurnTimeout = tr('poker.room.info.field.turnTimeout', '• Turn Timeout');
    const sectionPlayers = tr('poker.room.info.section.players', `👥 Players (${playerCount}/${maxPlayers}):`, { count: playerCount, max: maxPlayers });
    const fieldLastUpdate = tr('poker.room.info.field.lastUpdate', 'Last update');

    const message = `${title}\n\n${sectionDetails}\n${fieldId}: ${escapeHtml(roomId)}\n${fieldStatus}: ⏳ Waiting for players\n${fieldType}: 🌐 Public\n\n${sectionSettings}\n${fieldSmallBlind}: ${smallBlind}\n• Big Blind: ${bigBlind}\n${fieldMaxPlayers}: ${maxPlayers}\n${fieldTurnTimeout}: ${timeoutMinutes} min\n\n${sectionPlayers}\n${playerNames}\n\n${fieldLastUpdate}: ${escapeHtml(lastUpdate)}`;
    
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
      recipientChatIds = room.players
        .map((uuid) => idToTelegramId[uuid])
        .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
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
        message,
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: baseRows }
        }
      );
      logFunctionEnd('roomService.broadcastRoomInfo', {
        roomId,
        targetUserIds: fallback.length,
        messageLength: message.length,
        note: 'fallback'
      });
      return;
    }

    // Split recipients into admin and non-admin for personalized keyboards
    const adminRecipients = recipientChatIds.filter((id) => id === adminTelegramId);
    const nonAdminRecipients = recipientChatIds.filter((id) => id !== adminTelegramId);

    if (adminRecipients.length > 0) {
      const send = (ctx as any).sendOrEditMessageToUsers ?? (gctx as any).sendOrEditMessageToUsers;
      await send(
        adminRecipients,
        message,
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: adminRows }
        }
      );
    }

    if (nonAdminRecipients.length > 0) {
      const send = (ctx as any).sendOrEditMessageToUsers ?? (gctx as any).sendOrEditMessageToUsers;
      await send(
        nonAdminRecipients,
        message,
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: baseRows }
        }
      );
    }
    
    logFunctionEnd('roomService.broadcastRoomInfo', { 
      roomId, 
      targetUserIds: userIds.length,
      messageLength: message.length 
    });
  } catch (err) {
    logError('roomService.broadcastRoomInfo', err as Error, { roomId, targetUserIds });
  }
}


