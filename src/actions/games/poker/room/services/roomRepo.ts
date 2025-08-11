import type { PokerRoom } from './types';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

function normalizeTelegramId(input: string): string {
  if (/^\d+$/.test(input)) return input;
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0; // 32-bit
  }
  return String(Math.abs(hash));
}

export async function ensureUserUuid(telegramIdRaw: string): Promise<string> {
  const users = await import('@/api/users');
  const telegramId = normalizeTelegramId(telegramIdRaw);
  const existing = await users.getByTelegramId(telegramId);
  if (existing && (existing as any).id) return (existing as any).id as string;
  const created = await users.upsert({ telegram_id: Number(telegramId) });
  return created.id;
}

function mapDbRoom(dbRoom: any, players: Array<{ user_id: string; ready?: boolean }>): PokerRoom {
  const id = String(dbRoom.id);
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
    const players = await roomPlayers.listByRoom((db as any).id as string);
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
    // Add safety timeouts to avoid indefinite hangs on external services
    const withTimeout = async <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
      return await Promise.race<T>([
        promise,
        new Promise<T>((_r, reject) => setTimeout(() => reject(new Error(`timeout:${label}`)), ms)) as Promise<T>,
      ]);
    };

    const creatorUuid = await withTimeout(ensureUserUuid(params.createdBy), 4000, 'ensureUserUuid');
    const maybeUuid = /^[0-9a-fA-F-]{36}$/.test(params.id) ? params.id : undefined;
    const db = await withTimeout(rooms.create({
      id: maybeUuid,
      name: params.name ?? '',
      game_type: 'poker',
      status: 'waiting',
      created_by: creatorUuid,
      max_players: params.maxPlayers,
      stake_amount: params.smallBlind,
      settings: { turnTimeoutSec: params.turnTimeoutSec ?? 240 },
      is_private: params.isPrivate,
    }), 5000, 'rooms.create');
    const roomUuid = (db as any).id as string;
    await withTimeout(roomPlayers.add(roomUuid, creatorUuid, false), 4000, 'roomPlayers.add');
    const mapped = mapDbRoom(db, [{ user_id: creatorUuid, ready: false }]);
    logFunctionEnd('roomRepo.createRoom', { ok: true, roomId: params.id });
    return mapped;
  } catch (err) {
    // Log detailed error for observability
    logError('roomRepo.createRoom', err as Error, { roomId: params.id });
    throw err;
  }
}

export async function addPlayer(roomId: string, userId: string): Promise<void> {
  logFunctionStart('roomRepo.addPlayer', { roomId, userId });
  try {
    const { roomPlayers } = await import('@/api');
    const rooms = await import('@/api/rooms');
    const db = await rooms.getById(roomId);
    if (!db) {
      throw new Error('Room not found');
    }
    const roomUuid = (db as any).id as string;
    const userUuid = await ensureUserUuid(userId);
    await roomPlayers.add(roomUuid, userUuid, false);
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
    const rooms = await import('@/api/rooms');
    const db = await rooms.getById(roomId);
    if (!db) {
      throw new Error('Room not found');
    }
    const roomUuid = (db as any).id as string;
    const userUuid = await ensureUserUuid(userId);
    await roomPlayers.remove(roomUuid, userUuid);
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
    const rooms = await import('@/api/rooms');
    const db = await rooms.getById(roomId);
    if (!db) {
      throw new Error('Room not found');
    }
    const roomUuid = (db as any).id as string;
    const userUuid = await ensureUserUuid(userId);
    await roomPlayers.setReady(roomUuid, userUuid, ready);
    logFunctionEnd('roomRepo.setReady', { ok: true, roomId, userId, ready });
  } catch (err) {
    logError('roomRepo.setReady', err as Error, { roomId, userId, ready });
    throw err;
  }
}


