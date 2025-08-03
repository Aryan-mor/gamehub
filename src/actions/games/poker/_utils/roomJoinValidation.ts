import { PokerRoom, PlayerId, RoomId } from '../types';
import { getPokerRoomsForPlayer } from '../services/pokerService';

/**
 * Check if player is already in an active room
 */
export async function isPlayerInActiveRoom(playerId: PlayerId): Promise<boolean> {
  try {
    const playerRooms = await getPokerRoomsForPlayer(playerId);
    return playerRooms.some(room => room.status === 'waiting' || room.status === 'playing');
  } catch (error) {
    console.error('Error checking player active rooms:', error);
    return false;
  }
}

/**
 * Check if room is full
 */
export function isRoomFull(room: PokerRoom): boolean {
  return room.players.length >= room.maxPlayers;
}

/**
 * Check if player is already in the room
 */
export function isPlayerAlreadyInRoom(room: PokerRoom, playerId: PlayerId): boolean {
  return room.players.some(player => player.id === playerId);
}

/**
 * Check if room is accessible (for private rooms)
 */
export function isRoomAccessible(room: PokerRoom, isDirectLink: boolean = false): boolean {
  // Public rooms are always accessible
  if (!room.isPrivate) {
    return true;
  }
  
  // Private rooms are only accessible via direct link
  return isDirectLink;
}

/**
 * Check if room can accept new players
 */
export function canRoomAcceptPlayers(room: PokerRoom): boolean {
  return room.status === 'waiting' && !isRoomFull(room);
}

/**
 * Get room capacity information
 */
export function getRoomCapacityInfo(room: PokerRoom): {
  current: number;
  max: number;
  available: number;
  isFull: boolean;
} {
  const current = room.players.length;
  const max = room.maxPlayers;
  const available = max - current;
  const isFull = current >= max;
  
  return {
    current,
    max,
    available,
    isFull
  };
}

/**
 * Validate room join request
 */
export async function validateRoomJoinRequest(
  room: PokerRoom,
  playerId: PlayerId,
  isDirectLink: boolean = false
): Promise<{
  isValid: boolean;
  error?: string;
  activeRoom?: PokerRoom;
}> {
  // Check if player is already in an active room
  const playerRooms = await getPokerRoomsForPlayer(playerId);
  const activeRoom = playerRooms.find(r => r.status === 'waiting' || r.status === 'playing');
  
  if (activeRoom) {
    return {
      isValid: false,
      error: 'شما در حال حاضر در یک روم فعال هستید. لطفاً ابتدا از روم فعلی خارج شوید.',
      activeRoom: activeRoom
    };
  }
  
  // Check if room can accept players
  if (!canRoomAcceptPlayers(room)) {
    if (room.status !== 'waiting') {
      return {
        isValid: false,
        error: 'این روم در حال حاضر بازیکن نمی‌پذیرد.'
      };
    }
    if (isRoomFull(room)) {
      return {
        isValid: false,
        error: 'این روم پر شده است.'
      };
    }
  }
  
  // Check if player is already in this room
  if (isPlayerAlreadyInRoom(room, playerId)) {
    return {
      isValid: false,
      error: 'شما قبلاً در این روم عضو هستید.'
    };
  }
  
  // Check if room is accessible
  if (!isRoomAccessible(room, isDirectLink)) {
    return {
      isValid: false,
      error: 'این روم خصوصی است و فقط از طریق لینک مستقیم قابل دسترسی است.'
    };
  }
  
  return { isValid: true };
} 