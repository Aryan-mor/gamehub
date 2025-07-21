export interface FootballGameData {
  guess: number;
  diceResult: number;
  isWon: boolean;
  reward: number;
  fee: number;
}

export interface FootballGameState {
  gameId: string;
  playerId: string;
  stake: number;
  status: 'waiting' | 'playing' | 'finished';
  data: FootballGameData;
  createdAt: number;
  updatedAt: number;
}

export interface FootballGameResult {
  isWon: boolean;
  guess: number;
  diceResult: number;
  reward: number;
  fee: number;
  coinsWon: number;
  coinsLost: number;
}

export const FOOTBALL_STAKES = [2, 5, 10, 20] as const;
export type FootballStake = typeof FOOTBALL_STAKES[number];

export const FOOTBALL_DIRECTIONS = {
  1: 'Top-Left',
  2: 'Top-Right',
  3: 'Center',
  4: 'Bottom-Left',
  5: 'Bottom-Right',
} as const;

export const FOOTBALL_DIRECTION_KEYS = {
  'Top-Left': 1,
  'Top-Right': 2,
  'Center': 3,
  'Bottom-Left': 4,
  'Bottom-Right': 5,
} as const; 