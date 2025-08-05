import { 
  PokerRoom, 
  PlayerId 
} from '../types';
import { 
  getPokerRoomsForPlayer 
} from '../services/pokerService';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

/**
 * Validate if a player can join a room
 */
export async function validateRoomJoin(
  room: PokerRoom,
  playerId: PlayerId
): Promise<{
  isValid: boolean;
  error?: string;
  activeRoom?: PokerRoom;
}> {
  logFunctionStart('validateRoomJoin', { roomId: room.id, playerId });
  
  try {
    // Check if room exists and is active
    if (!room || room.status === 'finished' || room.status === 'cancelled') {
      return {
        isValid: false,
        error: 'Room not found or no longer active'
      };
    }
    
    // Check if room is full
    if (room.players.length >= room.maxPlayers) {
      return {
        isValid: false,
        error: 'Room is full'
      };
    }
    
    // Check if player is already in the room
    const existingPlayer = room.players.find(p => p.id === playerId);
    if (existingPlayer) {
      return {
        isValid: false,
        error: 'You are already in this room'
      };
    }
    
    // Check if player is already in another active room
    try {
      const userRooms = await getPokerRoomsForPlayer(playerId);
      const activeRoom = userRooms.find(r => 
        r.status === 'waiting' || r.status === 'playing'
      );
      
      if (activeRoom && activeRoom.id !== room.id) {
        console.log(`🚫 VALIDATION FAILED: User ${playerId} is in room ${activeRoom.id} trying to join ${room.id}`);
        return {
          isValid: false,
          error: `شما در روم "${activeRoom.name}" هستید. ابتدا باید از آن روم خارج شوید.`,
          activeRoom
        };
      }
    } catch (error) {
      // If getPokerRoomsForPlayer fails, check if it's a "no rooms found" error
      if (error instanceof Error && error.message.includes('Cannot coerce')) {
        // User has no rooms, allow join
        console.log(`User ${playerId} has no rooms, allowing join`);
      } else {
        // Other error, log and continue
        console.log(`Error checking user rooms for ${playerId}:`, error);
      }
    }
    
    // Check if game is already in progress
    if (room.status === 'playing') {
      return {
        isValid: false,
        error: 'Game is already in progress'
      };
    }
    
    logFunctionEnd('validateRoomJoin', { isValid: true }, { roomId: room.id, playerId });
    return { isValid: true };
    
  } catch (error) {
    logError('validateRoomJoin', error as Error, { roomId: room.id, playerId });
    return {
      isValid: false,
      error: 'Validation failed'
    };
  }
}

/**
 * Validate room creation
 */
export function validateRoomCreation(
  name: string,
  maxPlayers: number,
  smallBlind: number
): {
  isValid: boolean;
  error?: string;
} {
  logFunctionStart('validateRoomCreation', { name, maxPlayers, smallBlind });
  
  try {
    // Validate room name
    if (!name || name.trim().length < 3) {
      return {
        isValid: false,
        error: 'Room name must be at least 3 characters long'
      };
    }
    
    if (name.length > 50) {
      return {
        isValid: false,
        error: 'Room name must be less than 50 characters'
      };
    }
    
    // Validate max players
    if (maxPlayers < 2 || maxPlayers > 8) {
      return {
        isValid: false,
        error: 'Max players must be between 2 and 8'
      };
    }
    
    // Validate small blind
    if (smallBlind < 1) {
      return {
        isValid: false,
        error: 'Small blind must be at least 1'
      };
    }
    
    logFunctionEnd('validateRoomCreation', { isValid: true }, { name, maxPlayers, smallBlind });
    return { isValid: true };
    
  } catch (error) {
    logError('validateRoomCreation', error as Error, { name, maxPlayers, smallBlind });
    return {
      isValid: false,
      error: 'Validation failed'
    };
  }
}

/**
 * Get room capacity information
 */
export function getRoomCapacityInfo(room: PokerRoom): {
  current: number;
  max: number;
  isFull: boolean;
  hasMinimumPlayers: boolean;
} {
  return {
    current: room.players.length,
    max: room.maxPlayers,
    isFull: room.players.length >= room.maxPlayers,
    hasMinimumPlayers: room.players.length >= 2
  };
} 