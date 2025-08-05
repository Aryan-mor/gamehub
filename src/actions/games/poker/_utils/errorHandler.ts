import { RoomId, PlayerId } from '../types';

/**
 * Custom error types for poker game
 */
export class PokerGameError extends Error {
  constructor(
    message: string,
    public code: string,
    public userFriendlyMessage: string
  ) {
    super(message);
    this.name = 'PokerGameError';
  }
}

/**
 * Error codes and their user-friendly messages
 */
export const ERROR_MESSAGES = {
  // Room errors
  ROOM_NOT_FOUND: 'Room not found or has been deleted',
  ROOM_FULL: 'This room is full and cannot accept more players',
  ROOM_NOT_WAITING: 'This room is not accepting new players',
  ROOM_ALREADY_PLAYING: 'Game is already in progress',
  ROOM_NOT_PLAYING: 'Game is not in progress',
  ROOM_NOT_FINISHED: 'Game is not finished yet',
  
  // Player errors
  PLAYER_NOT_IN_ROOM: 'You are not in this room',
  PLAYER_ALREADY_IN_ROOM: 'You are already in this room',
  PLAYER_NOT_TURN: 'It is not your turn',
  PLAYER_ALREADY_FOLDED: 'You have already folded',
  PLAYER_NOT_ENOUGH_CHIPS: 'You do not have enough chips for this action',
  PLAYER_ALREADY_READY: 'You are already ready',
  PLAYER_NOT_READY: 'You are not ready',
  
  // Game errors
  GAME_NOT_STARTED: 'Game has not started yet',
  GAME_ALREADY_STARTED: 'Game has already started',
  GAME_FINISHED: 'Game is already finished',
  GAME_NOT_ENOUGH_PLAYERS: 'Need at least 2 players to start',
  GAME_NOT_ENOUGH_READY: 'Need at least 2 ready players to start',
  
  // Action errors
  INVALID_ACTION: 'This action is not valid at this time',
  INVALID_RAISE_AMOUNT: 'Invalid raise amount',
  RAISE_TOO_SMALL: 'Raise amount is too small',
  RAISE_TOO_LARGE: 'Raise amount exceeds your chips',
  CANNOT_CHECK: 'Cannot check when there is a bet to call',
  CANNOT_CALL: 'Cannot call - no bet to match',
  CANNOT_RAISE: 'Cannot raise - no chips available',
  
  // Permission errors
  NOT_ROOM_CREATOR: 'Only the room creator can perform this action',
  NOT_YOUR_TURN: 'It is not your turn to act',
  
  // Validation errors
  INVALID_ROOM_ID: 'Invalid room ID format',
  INVALID_PLAYER_ID: 'Invalid player ID',
  INVALID_AMOUNT: 'Invalid amount specified',
  MISSING_PARAMETER: 'Missing required parameter',
  
  // System errors
  DATABASE_ERROR: 'Database error occurred',
  NETWORK_ERROR: 'Network error occurred',
  UNKNOWN_ERROR: 'An unexpected error occurred'
} as const;

/**
 * Create a user-friendly error message
 */
export function createUserFriendlyError(
  error: Error | PokerGameError
): string {
  // If it's already a PokerGameError, use its user-friendly message
  if (error instanceof PokerGameError) {
    return error.userFriendlyMessage;
  }
  
  // Map common error messages to user-friendly versions
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('room not found')) {
    return ERROR_MESSAGES.ROOM_NOT_FOUND;
  }
  
  if (errorMessage.includes('not your turn')) {
    return ERROR_MESSAGES.NOT_YOUR_TURN;
  }
  
  if (errorMessage.includes('not enough chips')) {
    return ERROR_MESSAGES.PLAYER_NOT_ENOUGH_CHIPS;
  }
  
  if (errorMessage.includes('already folded')) {
    return ERROR_MESSAGES.PLAYER_ALREADY_FOLDED;
  }
  
  if (errorMessage.includes('cannot check')) {
    return ERROR_MESSAGES.CANNOT_CHECK;
  }
  
  if (errorMessage.includes('invalid raise')) {
    return ERROR_MESSAGES.INVALID_RAISE_AMOUNT;
  }
  
  if (errorMessage.includes('not in room')) {
    return ERROR_MESSAGES.PLAYER_NOT_IN_ROOM;
  }
  
  if (errorMessage.includes('already in room')) {
    return ERROR_MESSAGES.PLAYER_ALREADY_IN_ROOM;
  }
  
  if (errorMessage.includes('room is full')) {
    return ERROR_MESSAGES.ROOM_FULL;
  }
  
  if (errorMessage.includes('not accepting')) {
    return ERROR_MESSAGES.ROOM_NOT_WAITING;
  }
  
  if (errorMessage.includes('not in progress')) {
    return ERROR_MESSAGES.ROOM_NOT_PLAYING;
  }
  
  if (errorMessage.includes('not finished')) {
    return ERROR_MESSAGES.ROOM_NOT_FINISHED;
  }
  
  if (errorMessage.includes('not enough players')) {
    return ERROR_MESSAGES.GAME_NOT_ENOUGH_PLAYERS;
  }
  
  if (errorMessage.includes('not enough ready')) {
    return ERROR_MESSAGES.GAME_NOT_ENOUGH_READY;
  }
  
  if (errorMessage.includes('only room creator')) {
    return ERROR_MESSAGES.NOT_ROOM_CREATOR;
  }
  
  // Default to generic error message
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Create a PokerGameError with user-friendly message
 */
export function createPokerError(
  code: keyof typeof ERROR_MESSAGES,
  technicalMessage?: string
): PokerGameError {
  const userMessage = ERROR_MESSAGES[code];
  const technicalMsg = technicalMessage || userMessage;
  
  return new PokerGameError(technicalMsg, code, userMessage);
}

/**
 * Validate room ID and throw user-friendly error if invalid
 */
export function validateRoomIdWithError(roomId: string): RoomId {
  try {
    if (!roomId) {
      throw createPokerError('MISSING_PARAMETER', 'Room ID is required');
    }
    
    if (!/^room_\d+_[a-zA-Z0-9]{3}$/.test(roomId)) {
      throw createPokerError('INVALID_ROOM_ID', `Invalid room ID format: ${roomId}`);
    }
    
    return roomId as RoomId;
  } catch (error) {
    if (error instanceof PokerGameError) {
      throw error;
    }
    throw createPokerError('INVALID_ROOM_ID', `Invalid room ID: ${roomId}`);
  }
}

/**
 * Validate player ID and throw user-friendly error if invalid
 */
export function validatePlayerIdWithError(playerId: string): PlayerId {
  try {
    if (!playerId) {
      throw createPokerError('MISSING_PARAMETER', 'Player ID is required');
    }
    
    if (!/^\d+$/.test(playerId)) {
      throw createPokerError('INVALID_PLAYER_ID', `Invalid player ID format: ${playerId}`);
    }
    
    return playerId as PlayerId;
  } catch (error) {
    if (error instanceof PokerGameError) {
      throw error;
    }
    throw createPokerError('INVALID_PLAYER_ID', `Invalid player ID: ${playerId}`);
  }
}

/**
 * Validate amount and throw user-friendly error if invalid
 */
export function validateAmountWithError(amount: string | number): number {
  try {
    const numAmount = typeof amount === 'string' ? parseInt(amount) : amount;
    
    if (isNaN(numAmount) || numAmount <= 0) {
      throw createPokerError('INVALID_AMOUNT', `Invalid amount: ${amount}`);
    }
    
    return numAmount;
  } catch (error) {
    if (error instanceof PokerGameError) {
      throw error;
    }
    throw createPokerError('INVALID_AMOUNT', `Invalid amount: ${amount}`);
  }
}

/**
 * Get error context for logging
 */
export function getErrorContext(error: Error, context?: Record<string, unknown>): Record<string, unknown> {
  return {
    errorName: error.name,
    errorMessage: error.message,
    errorStack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  };
} 