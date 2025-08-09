const userActiveRoom = new Map<string, string>();

export function getActiveRoomId(userId: string): string | undefined {
  return userActiveRoom.get(userId);
}

export function setActiveRoomId(userId: string, roomId: string): void {
  userActiveRoom.set(userId, roomId);
}

export function clearActiveRoomId(userId: string): void {
  userActiveRoom.delete(userId);
}


