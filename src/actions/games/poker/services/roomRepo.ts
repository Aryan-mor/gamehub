import type { PokerRoom } from './roomStore';

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
  const rooms = await import('@/api/rooms');
  const { roomPlayers } = await import('@/api');
  const db = await rooms.getById(roomId);
  if (!db) return undefined;
  const players = await roomPlayers.listByRoom(roomId);
  return mapDbRoom(db, players);
}

export async function createRoom(params: Omit<PokerRoom, 'players' | 'readyPlayers' | 'playerNames'>): Promise<PokerRoom> {
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
  return mapDbRoom(db, [{ user_id: params.createdBy, ready: false }]);
}

export async function addPlayer(roomId: string, userId: string): Promise<void> {
  const { roomPlayers } = await import('@/api');
  await roomPlayers.add(roomId, userId, false);
}

export async function removePlayer(roomId: string, userId: string): Promise<void> {
  const { roomPlayers } = await import('@/api');
  await roomPlayers.remove(roomId, userId);
}

export async function setReady(roomId: string, userId: string, ready: boolean): Promise<void> {
  const { roomPlayers } = await import('@/api');
  await roomPlayers.setReady(roomId, userId, ready);
}


