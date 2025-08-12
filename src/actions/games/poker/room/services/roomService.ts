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
export async function broadcastRoomInfo(
  ctx: any, 
  roomId: string, 
  targetUserIds?: string[]
): Promise<void> {
  logFunctionStart('roomService.broadcastRoomInfo', { roomId, targetUserIds });
  
  try {
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
      idToDisplayName[String(u.id)] = display;
      idToTelegramId[String(u.id)] = Number(u.telegram_id);
    }
    const playerNames = room.players
      .map((uid) => {
        const name = idToDisplayName[uid] || 'Unknown';
        const isAdmin = uid === adminId;
        return `${isAdmin ? '👑 ' : ''}${name}`;
      })
      .join('\n');
    
    // Generate inline keyboard buttons
    const rows: Array<Array<{ text: string; callback_data?: string; switch_inline_query?: string }>> = [];
    const refreshText = (ctx as any)?.t ? (ctx as any).t('bot.buttons.refresh') : '🔄 Refresh';
    const shareText = (ctx as any)?.t ? (ctx as any).t('bot.buttons.share') : '📤 Share';
    const leaveText = (ctx as any)?.t ? (ctx as any).t('poker.room.buttons.leave') : '🚪 Leave Room';
    
    rows.push([{ text: refreshText, callback_data: 'g.pk.r.in' }]);
    rows.push([{ text: shareText, switch_inline_query: `poker ${roomId}` }]);
    rows.push([{ text: leaveText, callback_data: `g.pk.r.lv?roomId=${roomId}` }]);
    
    const message = `🏠 Poker Room Info\n\n📋 Room Details:\n• ID: ${roomId}\n• Status: ⏳ Waiting for players\n• Type: 🌐 Public\n\n⚙️ Game Settings:\n• Small Blind: ${smallBlind}\n• Big Blind: ${bigBlind}\n• Max Players: ${maxPlayers}\n• Turn Timeout: ${timeoutMinutes} min\n\n👥 Players (${playerCount}/${maxPlayers}):\n${playerNames}\n\nLast update: ${lastUpdate}`;
    
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
      const initiatorId = Number(((ctx as any)?.from?.id) ?? ((ctx as any)?.ctx?.from?.id));
      const fallback = (Array.isArray(targetUserIds) && targetUserIds.length > 0)
        ? targetUserIds.map((id) => Number(id)).filter((n) => Number.isFinite(n))
        : (Number.isFinite(initiatorId) ? [initiatorId] : []);
      if (fallback.length === 0) {
        logError('roomService.broadcastRoomInfo', new Error('no_recipients'), { roomId, targetUserIds });
        return;
      }
      // Use fallback recipients
      await ctx.sendOrEditMessageToUsers(
        fallback,
        message,
        {
          reply_markup: { inline_keyboard: rows }
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

    // Broadcast to all users using the public function
    await ctx.sendOrEditMessageToUsers(
      recipientChatIds,
      message,
      {
        reply_markup: { inline_keyboard: rows }
      }
    );
    
    logFunctionEnd('roomService.broadcastRoomInfo', { 
      roomId, 
      targetUserIds: userIds.length,
      messageLength: message.length 
    });
  } catch (err) {
    logError('roomService.broadcastRoomInfo', err as Error, { roomId, targetUserIds });
  }
}


