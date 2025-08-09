export interface PokerRoom {
  id: string;
  name?: string;
  isPrivate: boolean;
  maxPlayers: number;
  smallBlind: number;
  createdBy: string;
  players: string[];
  readyPlayers?: string[];
}

const rooms = new Map<string, PokerRoom>();

export function createRoom(params: Omit<PokerRoom, 'players' | 'readyPlayers'>): PokerRoom {
  const room: PokerRoom = { ...params, players: [params.createdBy], readyPlayers: [] };
  rooms.set(room.id, room);
  return room;
}

export function getRoom(roomId: string): PokerRoom | undefined {
  return rooms.get(roomId);
}

export function addPlayer(roomId: string, userId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  if (!room.players.includes(userId)) room.players.push(userId);
}

export function removePlayer(roomId: string, userId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  room.players = room.players.filter((p) => p !== userId);
}

export function markReady(roomId: string, userId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  if (!room.readyPlayers) room.readyPlayers = [];
  if (!room.readyPlayers.includes(userId)) room.readyPlayers.push(userId);
}

export function markNotReady(roomId: string, userId: string): void {
  const room = rooms.get(roomId);
  if (!room || !room.readyPlayers) return;
  room.readyPlayers = room.readyPlayers.filter((p) => p !== userId);
}


