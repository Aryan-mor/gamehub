export type Player = "X" | "O";
export type CellValue = Player | "-";
export type GameStatus = "waiting" | "playing" | "won" | "draw" | "timeout";

export interface GameState {
  board: CellValue[];
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  players: {
    X?: PlayerInfo;
    O?: PlayerInfo;
  };
  createdAt: number;
  lastMoveAt: number;
  turnStartedAt?: number; // When the current player's turn started
  timeoutDuration?: number; // Timeout duration in milliseconds (default: 2 minutes)
  // Coin stake fields
  stake?: number; // Stake amount per player (5, 10, or 20)
  stakePool?: number; // Total coins in the pot (stake * 2)
  creatorId?: string; // ID of the game creator
  joinerId?: string; // ID of the player who joined
  winnerId?: string; // ID of the winner (for payouts)
  finishedAt?: number; // When the game finished
}

export interface PlayerInfo {
  id: string;
  name: string;
  email: string;
  image?: string;
  disconnected?: boolean;
  lastSeen?: number;
}

export interface Game {
  id: string;
  state: GameState;
}

// Generate a random game ID
export const generateGameId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Check if the game is won
export const checkWinner = (board: CellValue[]): Player | null => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // columns
    [0, 4, 8],
    [2, 4, 6], // diagonals
  ];

  for (const [a, b, c] of lines) {
    if (board[a] !== "-" && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

// Check if the game is a draw
export const isDraw = (board: CellValue[] | undefined): boolean => {
  if (!Array.isArray(board) || board.length !== 9) return false;
  return board.every((cell) => cell !== "-");
};

// Get the next player
export const getNextPlayer = (currentPlayer: Player): Player => {
  return currentPlayer === "X" ? "O" : "X";
};

// Create initial game state
export const createInitialGameState = (): GameState => ({
  board: Array(9).fill("-"),
  currentPlayer: "X",
  status: "waiting",
  winner: null,
  players: {},
  createdAt: Date.now(),
  lastMoveAt: Date.now(),
  timeoutDuration: 120000, // 2 minutes in milliseconds
});
