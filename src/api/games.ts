import { api } from '@/lib/api';

export async function getByRoomId(roomId: string) {
  return api.games.getByRoomId(roomId);
}

export async function create(gameData: Record<string, unknown>) {
  return api.games.create(gameData);
}

export async function update(gameId: string, updates: Record<string, unknown>) {
  return api.games.update(gameId, updates);
}

export async function getActiveForUser() {
  return api.games.getActiveForUser();
}


