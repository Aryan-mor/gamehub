/**
 * Type guards for custom ID types
 * These functions validate and narrow types at runtime
 */

import { 
  ID, 
  UserId, 
  RoomId, 
  GameId, 
  TransactionId, 
  MessageId 
} from '@/utils/types';

/**
 * Base ID validation - checks if string matches ID pattern
 */
export function isValidId(id: string): id is ID {
  return typeof id === 'string' && id.length > 0 && /^[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * User ID validation - Telegram user IDs are numeric
 */
export function isValidUserId(id: string): id is UserId {
  return /^\d+$/.test(id) && id.length > 0;
}

/**
 * Room ID validation - follows pattern: room_{timestamp}_{userId}
 */
export function isValidRoomId(id: string): id is RoomId {
  return /^room_\d+_\d+$/.test(id);
}

/**
 * Game ID validation - follows pattern: game_{gameType}_{id}
 */
export function isValidGameId(id: string): id is GameId {
  return /^game_[a-zA-Z]+_[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Transaction ID validation - follows pattern: tx_{timestamp}_{random}
 */
export function isValidTransactionId(id: string): id is TransactionId {
  return /^tx_\d+_[a-zA-Z0-9]+$/.test(id);
}

/**
 * Message ID validation - follows pattern: msg_{timestamp}_{random}
 */
export function isValidMessageId(id: string): id is MessageId {
  return /^msg_\d+_[a-zA-Z0-9]+$/.test(id);
}

/**
 * Generic ID validation with type parameter
 */
export function isValidTypedId<T extends ID>(
  id: string, 
  validator: (id: string) => boolean
): id is T {
  return validator(id);
}

/**
 * Safe ID conversion with validation
 * Returns null if validation fails
 */
export function safeIdConversion<T extends ID>(
  id: string, 
  validator: (id: string) => id is T
): T | null {
  return validator(id) ? id as T : null;
}

/**
 * Assert ID is valid, throws error if not
 * Use for critical validation points
 */
export function assertValidId<T extends ID>(
  id: string, 
  validator: (id: string) => id is T,
  context: string = 'ID validation'
): asserts id is T {
  if (!validator(id)) {
    throw new Error(`${context} failed: Invalid ID format for "${id}"`);
  }
}

/**
 * Batch validation for multiple IDs
 */
export function validateIds(ids: Record<string, string>): {
  valid: Record<string, string>;
  invalid: string[];
} {
  const valid: Record<string, string> = {};
  const invalid: string[] = [];

  for (const [key, id] of Object.entries(ids)) {
    if (isValidId(id)) {
      valid[key] = id;
    } else {
      invalid.push(`${key}: ${id}`);
    }
  }

  return { valid, invalid };
}

/**
 * Create a room ID from components
 */
export function createRoomId(timestamp: number, userId: UserId): RoomId {
  const roomId = `room_${timestamp}_${userId}` as RoomId;
  assertValidId(roomId, isValidRoomId, 'Room ID creation');
  return roomId;
}

/**
 * Create a game ID from components
 */
export function createGameId(gameType: string, uniqueId: string): GameId {
  const gameId = `game_${gameType}_${uniqueId}` as GameId;
  assertValidId(gameId, isValidGameId, 'Game ID creation');
  return gameId;
}

/**
 * Create a transaction ID from components
 */
export function createTransactionId(timestamp: number, random: string): TransactionId {
  const txId = `tx_${timestamp}_${random}` as TransactionId;
  assertValidId(txId, isValidTransactionId, 'Transaction ID creation');
  return txId;
}

/**
 * Create a message ID from components
 */
export function createMessageId(timestamp: number, random: string): MessageId {
  const msgId = `msg_${timestamp}_${random}` as MessageId;
  assertValidId(msgId, isValidMessageId, 'Message ID creation');
  return msgId;
} 