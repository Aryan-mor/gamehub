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
      console.log('❌ roomService.broadcastRoomInfo: room not found', { roomId });
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
    const lastUpdate = room.lastUpdate ? new Date(room.lastUpdate).toISOString() : 'Unknown';
    
    // Get player names
    const { getByIds } = await import('@/api/users');
    const dbUsers = await getByIds(room.players);
    const playerNames = dbUsers.map(u => u.first_name || u.username || 'Unknown').join('\n');
    
    // Generate inline keyboard buttons
    const rows = [];
    rows.push([{ text: '🔄 Refresh', callback_data: 'g.pk.r.in' }]);
    rows.push([{ text: '📤 Share', switch_inline_query: `poker ${roomId}` }]);
    
    const message = `🏠 Poker Room Info\n\n📋 Room Details:\n• ID: ${roomId}\n• Status: ⏳ Waiting for players\n• Type: 🌐 Public\n\n⚙️ Game Settings:\n• Small Blind: ${smallBlind}\n• Big Blind: ${bigBlind}\n• Max Players: ${maxPlayers}\n• Turn Timeout: ${timeout}\n\n👥 Players (${playerCount}/${maxPlayers}):\n${playerNames}\n\nLast update: ${lastUpdate}`;
    
    // Broadcast to all users using the public function
    await ctx.sendOrEditMessageToUsers(
      userIds.map(id => Number(id)), 
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


