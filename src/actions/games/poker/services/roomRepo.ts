import type { PokerRoom } from './roomStore';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

function mapDbRoom(dbRoom: any, players: Array<{ user_id: string; ready?: boolean }>): PokerRoom {
  const id = String(dbRoom.room_id || dbRoom.id);
  const smallBlind = Number(dbRoom.small_blind ?? dbRoom.stake_amount ?? 0);
  const maxPlayers = Number(dbRoom.max_players ?? 0);
  const isPrivate = Boolean(dbRoom.is_private ?? false);
  const createdBy = String(dbRoom.created_by ?? '');
  const turnTimeoutSec = Number(dbRoom.settings?.turnTimeoutSec ?? dbRoom.turn_timeout_sec ?? 240);
  const playerIds = players.map(p => String(p.user_id));
  return {
    id,
    isPrivate,
    maxPlayers,
    smallBlind,
    createdBy,
    players: playerIds,
    readyPlayers: players.filter(p => p.ready).map(p => String(p.user_id)),
    turnTimeoutSec,
    lastUpdate: Date.now(),
    playerNames: {},
  };
}

export async function getRoom(roomId: string): Promise<PokerRoom | undefined> {
  logFunctionStart('roomRepo.getRoom', { roomId });
  try {
    const rooms = await import('@/api/rooms');
    const { roomPlayers } = await import('@/api');
    const db = await rooms.getById(roomId);
    if (!db) {
      logFunctionEnd('roomRepo.getRoom', { found: false, roomId });
      return undefined;
    }
    const players = await roomPlayers.listByRoom(roomId);
    const mapped = mapDbRoom(db, players);
    logFunctionEnd('roomRepo.getRoom', { found: true, roomId });
    return mapped;
  } catch (err) {
    logError('roomRepo.getRoom', err as Error, { roomId });
    return undefined;
  }
}

export async function createRoom(params: Omit<PokerRoom, 'players' | 'readyPlayers' | 'playerNames'>): Promise<PokerRoom> {
  logFunctionStart('roomRepo.createRoom', { roomId: params.id, createdBy: params.createdBy });
  try {
    const rooms = await import('@/api/rooms');
    const { roomPlayers } = await import('@/api');
    const db = await rooms.create({
      room_id: params.id,
      name: params.name ?? '',
      game_type: 'poker',
      status: 'waiting',
      created_by: params.createdBy,
      max_players: params.maxPlayers,
      stake_amount: params.smallBlind,
      settings: { turnTimeoutSec: params.turnTimeoutSec ?? 240 },
      is_private: params.isPrivate,
    });
    await roomPlayers.add(params.id, params.createdBy, false);
    const mapped = mapDbRoom(db, [{ user_id: params.createdBy, ready: false }]);
    logFunctionEnd('roomRepo.createRoom', { ok: true, roomId: params.id });
    return mapped;
  } catch (err) {
    logError('roomRepo.createRoom', err as Error, { roomId: params.id });
    throw err;
  }
}

export async function addPlayer(roomId: string, userId: string): Promise<void> {
  logFunctionStart('roomRepo.addPlayer', { roomId, userId });
  try {
    const { roomPlayers } = await import('@/api');
    await roomPlayers.add(roomId, userId, false);
    logFunctionEnd('roomRepo.addPlayer', { ok: true, roomId, userId });
  } catch (err) {
    logError('roomRepo.addPlayer', err as Error, { roomId, userId });
    throw err;
  }
}

export async function removePlayer(roomId: string, userId: string): Promise<void> {
  logFunctionStart('roomRepo.removePlayer', { roomId, userId });
  try {
    const { roomPlayers } = await import('@/api');
    await roomPlayers.remove(roomId, userId);
    logFunctionEnd('roomRepo.removePlayer', { ok: true, roomId, userId });
  } catch (err) {
    logError('roomRepo.removePlayer', err as Error, { roomId, userId });
    throw err;
  }
}

export async function setReady(roomId: string, userId: string, ready: boolean): Promise<void> {
  logFunctionStart('roomRepo.setReady', { roomId, userId, ready });
  try {
    const { roomPlayers } = await import('@/api');
    await roomPlayers.setReady(roomId, userId, ready);
    logFunctionEnd('roomRepo.setReady', { ok: true, roomId, userId, ready });
  } catch (err) {
    logError('roomRepo.setReady', err as Error, { roomId, userId, ready });
    throw err;
  }
}


