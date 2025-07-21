export interface User {
  id: string;
  username?: string;
  name?: string;
  coins: number;
  lastFreeCoinAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface GameState {
  id: string;
  type: GameType;
  status: GameStatus;
  players: Player[];
  currentPlayerIndex: number;
  stake: number;
  createdAt: number;
  updatedAt: number;
  data: Record<string, unknown>;
  result?: GameResult;
}

export interface Player {
  id: string;
  name: string;
  username: string | undefined;
  coins: number;
}

export enum GameType {
  XO = 'xo',
  DICE = 'dice',
  BLACKJACK = 'blackjack',
  FOOTBALL = 'football',
  BASKETBALL = 'basketball',
  BOWLING = 'bowling'
}

export enum GameStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
  CANCELLED = 'cancelled'
}

export interface GameResult {
  winner: string | undefined;
  loser: string | undefined;
  isDraw: boolean;
  coinsWon: number;
  coinsLost: number;
}

export interface LogContext {
  userId: string | undefined;
  gameId?: string;
  action?: string;
  [key: string]: unknown;
}

export interface BotContext {
  userId: string;
  chatId: number;
  username?: string;
  name?: string;
}

export interface CallbackData {
  action: string;
  gameId: string | undefined;
  stake?: number;
  choice?: string;
  [key: string]: unknown;
} 