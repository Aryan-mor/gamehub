import { ID } from '@/utils/types';

// Custom ID types for poker
export type RoomId = ID & { Room: void };
export type PlayerId = ID & { Player: void };
export type GameId = ID & { Game: void };

// Card types
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // 2-14 (Ace = 14)
}

// Poker hand types
export type HandType = 
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-of-a-kind'
  | 'straight-flush'
  | 'royal-flush';

export interface HandEvaluation {
  type: HandType;
  value: number; // Hand strength (higher = better)
  cards: Card[];
  kickers: Card[]; // Cards used for tie-breaking
}

// Player state in a poker room
export interface PokerPlayer {
  id: PlayerId;
  name: string;
  username?: string;
  chips: number;
  balance?: number; // Current balance during game
  betAmount: number; // Current bet in this round
  totalBet: number; // Total bet in this hand
  isReady: boolean;
  isFolded: boolean;
  isAllIn: boolean;
  isDealer: boolean;
  cards: Card[];
  hand?: string[]; // String representation of cards (e.g., ['Ah', '7d'])
  status?: 'active' | 'folded' | 'all-in';
  hasFolded?: boolean; // Alternative to isFolded for compatibility
  lastAction?: 'fold' | 'check' | 'call' | 'raise' | 'all-in';
  joinedAt: number;
  chatId?: number; // Telegram chat ID for sending messages
}

// Betting round types
export type BettingRound = 'preflop' | 'flop' | 'turn' | 'river';

// Room status
export type RoomStatus = 'waiting' | 'active' | 'playing' | 'finished' | 'cancelled';

// Game round types
export type GameRound = 'pre-flop' | 'flop' | 'turn' | 'river';

// Main poker room structure
export interface PokerRoom {
  id: RoomId;
  name: string;
  status: RoomStatus;
  players: PokerPlayer[];
  currentPlayerIndex: number;
  dealerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
  
  // Game state
  pot: number;
  currentBet: number;
  minRaise: number;
  deck: Card[] | string[]; // Can be Card[] or string[] for compatibility
  communityCards: Card[];
  bettingRound: BettingRound;
  round?: GameRound; // Alternative to bettingRound
  lastActionAt?: number; // Timestamp for turn timeout
  
  // Game settings
  smallBlind: number;
  bigBlind: number;
  minPlayers: number;
  maxPlayers: number;
  isPrivate: boolean;
  turnTimeoutSec: number;
  
  // Metadata
  createdBy: PlayerId;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  endedAt?: number;
}

// Game action types
export interface GameAction {
  type: 'fold' | 'check' | 'call' | 'raise' | 'all-in';
  playerId: PlayerId;
  amount?: number;
  timestamp: number;
}

// Game result
export interface PokerGameResult {
  winner: PlayerId;
  winningHand: HandEvaluation;
  pot: number;
  actions: GameAction[];
  duration: number;
}

// Room creation request
export interface CreateRoomRequest {
  name: string;
  isPrivate: boolean;
  maxPlayers: 2 | 4 | 6 | 8;
  smallBlind: number;
  turnTimeoutSec: number;
}

export interface CreateRoomFormData {
  name: string;
  isPrivate: boolean;
  maxPlayers: 2 | 4 | 6 | 8;
  smallBlind: number;
  turnTimeoutSec: number;
}

// Join room request
export interface JoinRoomRequest {
  roomId: RoomId;
  playerId: PlayerId;
  playerName: string;
  username?: string;
  chips: number;
  chatId?: number; // Telegram chat ID for sending messages
}

// Betting action request
export interface BettingAction {
  roomId: RoomId;
  playerId: PlayerId;
  action: 'fold' | 'check' | 'call' | 'raise' | 'all-in';
  amount?: number;
} 