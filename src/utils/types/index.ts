/**
 * Core type definitions for GameHub
 * All ID types are custom branded types for type safety
 */

// Base ID type - never use string directly for IDs
export type ID = string & {
  uuid: void;
};

// Specific ID types for different entities
export type UserId = ID & {
  User: void;
};

export type RoomId = ID & {
  Room: void;
};

export type GameId = ID & {
  Game: void;
};

export type TransactionId = ID & {
  Transaction: void;
};

export type MessageId = ID & {
  Message: void;
};

// Common entity interfaces
export interface User {
  id: UserId;
  username: string;
  created_at: string;
  updated_at: string;
  balance: number;
  is_active: boolean;
}

export interface Room {
  id: RoomId;
  name: string;
  game_type: string;
  created_by: UserId;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  max_players: number;
  current_players: number;
  status: 'waiting' | 'playing' | 'finished';
}

export interface Game {
  id: GameId;
  name: string;
  type: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: TransactionId;
  user_id: UserId;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'loss';
  game_id?: GameId;
  room_id?: RoomId;
  created_at: string;
  status: 'pending' | 'completed' | 'failed';
}

// Query parameter types
export interface BaseQuery {
  [key: string]: string;
}

export interface RoomQuery extends BaseQuery {
  roomId: string; // Will be validated as RoomId
  name: string;
}

export interface GameQuery extends BaseQuery {
  gameId: string; // Will be validated as GameId
}

export interface UserQuery extends BaseQuery {
  userId: string; // Will be validated as UserId
}

// Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
