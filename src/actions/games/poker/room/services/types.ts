export interface PokerRoom {
  id: string;
  name?: string;
  isPrivate: boolean;
  maxPlayers: number;
  smallBlind: number;
  createdBy: string;
  players: string[];
  readyPlayers?: string[];
  turnTimeoutSec?: number;
  lastUpdate?: number;
  playerNames?: Record<string, string>;
  status?: 'waiting' | 'playing' | 'finished';
}


