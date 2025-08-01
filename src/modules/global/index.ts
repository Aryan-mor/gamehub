/**
 * Global utilities and configurations
 */

export const GAME_CONFIG = {
  POKER: {
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 8,
    DEFAULT_CHIPS: 1000,
    SMALL_BLIND: 10,
    BIG_BLIND: 20,
  }
};

export const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: 'Room not found',
  ROOM_FULL: 'Room is full',
  NOT_YOUR_TURN: 'It\'s not your turn',
  INSUFFICIENT_FUNDS: 'Insufficient funds',
  INVALID_ACTION: 'Invalid action',
  USER_NOT_IN_ROOM: 'User not in room',
};

export const SUCCESS_MESSAGES = {
  ROOM_CREATED: 'Room created successfully',
  JOINED_ROOM: 'Joined room successfully',
  LEFT_ROOM: 'Left room successfully',
  ACTION_PROCESSED: 'Action processed successfully',
};

/**
 * Generate a unique room ID
 */
export function generateRoomId(): string {
  return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate room ID format
 */
export function isValidRoomId(roomId: string): boolean {
  return /^room_\d+_[a-zA-Z0-9]+$/.test(roomId);
} 