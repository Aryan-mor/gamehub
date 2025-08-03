import { RoomId, PlayerId, GameId, Card, Suit, Rank } from '../types';

/**
 * Type guard to check if a string is a valid RoomId
 */
export function isValidRoomId(id: string): id is RoomId {
  return /^room_[a-zA-Z0-9_-]{12,}$/.test(id);
}

/**
 * Type guard to check if a string is a valid PlayerId
 */
export function isValidPlayerId(id: string): id is PlayerId {
  return /^\d+$/.test(id); // Player IDs are Telegram user IDs
}

/**
 * Type guard to check if a string is a valid GameId
 */
export function isValidGameId(id: string): id is GameId {
  return /^game_\d+_[a-zA-Z0-9]{6}$/.test(id);
}

/**
 * Type guard to check if a string is a valid Suit
 */
export function isValidSuit(suit: string): suit is Suit {
  return ['hearts', 'diamonds', 'clubs', 'spades'].includes(suit);
}

/**
 * Type guard to check if a string is a valid Rank
 */
export function isValidRank(rank: string): rank is Rank {
  return ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'].includes(rank);
}

/**
 * Type guard to check if an object is a valid Card
 */
export function isValidCard(card: any): card is Card {
  return (
    card &&
    typeof card === 'object' &&
    isValidSuit(card.suit) &&
    isValidRank(card.rank) &&
    typeof card.value === 'number' &&
    card.value >= 2 &&
    card.value <= 14
  );
}

/**
 * Type guard to check if an array contains valid Cards
 */
export function isValidCardArray(cards: any[]): cards is Card[] {
  return Array.isArray(cards) && cards.every(isValidCard);
}

/**
 * Validate room ID and throw error if invalid
 */
export function validateRoomId(roomId: string): RoomId {
  if (!isValidRoomId(roomId)) {
    throw new Error(`Invalid room ID format: ${roomId}`);
  }
  return roomId;
}

/**
 * Validate player ID and throw error if invalid
 */
export function validatePlayerId(playerId: string): PlayerId {
  if (!isValidPlayerId(playerId)) {
    throw new Error(`Invalid player ID format: ${playerId}`);
  }
  return playerId;
}

/**
 * Validate game ID and throw error if invalid
 */
export function validateGameId(gameId: string): GameId {
  if (!isValidGameId(gameId)) {
    throw new Error(`Invalid game ID format: ${gameId}`);
  }
  return gameId;
} 