import { api } from '@/lib/api';

// Fetch by internal UUID id
export async function getById(roomUuid: string) {
  return api.rooms.getById(roomUuid);
}

export async function create(roomData: {
  id?: string;
  name: string;
  game_type: string;
  status: string;
  created_by: string;
  max_players: number;
  stake_amount: number;
  settings: Record<string, unknown>;
  is_private: boolean;
}) {
  return api.rooms.create(roomData);
}

export async function update(roomId: string, updates: Record<string, unknown>) {
  return api.rooms.update(roomId, updates);
}

export async function del(roomId: string) {
  return api.rooms.delete(roomId);
}

export async function getActiveRooms() {
  return api.rooms.getActiveRooms();
}

export async function getRoomsForPlayer(createdBy: string) {
  return api.rooms.getRoomsForPlayer(createdBy);
}

export async function getByGameType(gameType: string) {
  return api.rooms.getByGameType(gameType);
}

export async function getByGameTypeAndMaxPlayers(gameType: string, maxPlayers: number) {
  return api.rooms.getByGameTypeAndMaxPlayers(gameType, maxPlayers);
}


