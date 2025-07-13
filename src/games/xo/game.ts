import { PlayerInfo, GameState, createInitialGameState } from "../../lib/game";
import {
  requireBalance,
  deductStake,
  processGamePayout,
  processGameRefund,
} from "../../lib/coinService";
export { createInitialGameState };

// In-memory game storage for X/O games
const xoGames = new Map<string, GameState>();

// Game constants
export const GAME_TYPE = "xo";
export const GAME_NAME = "X/O Game";
export const GAME_DESCRIPTION = "Classic TicTacToe game for 2 players";

// Valid stake amounts
export const VALID_STAKES = [5, 10, 20];

// Winning combinations for TicTacToe
const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // Rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // Columns
  [0, 4, 8],
  [2, 4, 6], // Diagonals
];

/**
 * Check if there's a winner on the board
 */
export function checkWinner(board: string[]): string | null {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] !== "-" && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

/**
 * Check if the game is a draw
 */
export function isDraw(board: string[]): boolean {
  return board.every((cell) => cell !== "-");
}

/**
 * Get the next player
 */
export function getNextPlayer(currentPlayer: string): string {
  return currentPlayer === "X" ? "O" : "X";
}

/**
 * Create a new X/O game with stake
 */
export async function createXoGame(
  creatorId: string,
  creatorName: string,
  stake: number
): Promise<{ gameId: string; gameState: GameState }> {
  // Validate stake amount
  if (!VALID_STAKES.includes(stake)) {
    throw new Error(
      `Invalid stake amount. Must be one of: ${VALID_STAKES.join(", ")}`
    );
  }

  // Check creator's balance
  const hasBalance = await requireBalance(creatorId, stake);
  if (!hasBalance) {
    throw new Error("Insufficient coins");
  }

  const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();

  const playerInfo: PlayerInfo = {
    id: creatorId,
    name: creatorName,
    email: `${creatorId}@telegram.user`,
    disconnected: false,
    lastSeen: Date.now(),
  };

  const gameState: GameState = {
    ...createInitialGameState(),
    players: { X: playerInfo },
    status: "waiting",
    stake,
    stakePool: stake, // Creator's stake
    creatorId,
  };

  // Deduct stake from creator
  await deductStake(creatorId, stake, gameId);

  xoGames.set(gameId, gameState);

  return { gameId, gameState };
}

/**
 * Join an X/O game with stake
 */
export async function joinXoGame(
  gameId: string,
  joinerId: string,
  joinerName: string
): Promise<GameState | null> {
  const gameState = xoGames.get(gameId);

  if (!gameState || gameState.players.O || gameState.status !== "waiting") {
    return null;
  }

  // Check if the user is already in the game (as X)
  if (gameState.players.X?.id === joinerId) {
    return null;
  }

  // Check joiner's balance
  const hasBalance = await requireBalance(joinerId, gameState.stake!);
  if (!hasBalance) {
    throw new Error("Insufficient coins");
  }

  const playerInfo: PlayerInfo = {
    id: joinerId,
    name: joinerName,
    email: `${joinerId}@telegram.user`,
    disconnected: false,
    lastSeen: Date.now(),
  };

  gameState.players.O = playerInfo;
  gameState.status = "playing";
  gameState.currentPlayer = "X";
  gameState.turnStartedAt = Date.now();
  gameState.stakePool = gameState.stake! * 2; // Both players' stakes
  gameState.joinerId = joinerId;

  // Deduct stake from joiner
  await deductStake(joinerId, gameState.stake!, gameId);

  xoGames.set(gameId, gameState);

  return gameState;
}

/**
 * Get an X/O game by ID
 */
export function getXoGame(gameId: string): GameState | undefined {
  return xoGames.get(gameId);
}

/**
 * Delete an X/O game
 */
export function deleteXoGame(gameId: string): boolean {
  return xoGames.delete(gameId);
}

/**
 * Check if a user is part of an X/O game
 */
export function isPlayerInXoGame(gameId: string, userId: string): boolean {
  const gameState = xoGames.get(gameId);
  if (!gameState) return false;
  return (
    gameState.players.X?.id === userId || gameState.players.O?.id === userId
  );
}

/**
 * Set or update an X/O game by ID
 */
export function setXoGame(gameId: string, gameState: GameState): void {
  xoGames.set(gameId, gameState);
}

/**
 * Format the X/O board for display
 */
export function formatXoBoard(board: string[]): string {
  const symbols = board.map((cell) =>
    cell === "-" ? "⬜" : cell === "X" ? "❌" : "🟢"
  );
  return `
${symbols[0]} | ${symbols[1]} | ${symbols[2]}
---------
${symbols[3]} | ${symbols[4]} | ${symbols[5]}
---------
${symbols[6]} | ${symbols[7]} | ${symbols[8]}
  `.trim();
}

/**
 * Process game completion (win or draw)
 */
export async function processGameCompletion(gameId: string): Promise<void> {
  const gameState = xoGames.get(gameId);
  if (!gameState || !gameState.stakePool) return;

  gameState.finishedAt = Date.now();

  if (gameState.winner) {
    // Game won - process payout
    const winnerId =
      gameState.winner === "X"
        ? gameState.players.X?.id
        : gameState.players.O?.id;

    if (winnerId) {
      gameState.winnerId = winnerId;
      const { payout, fee } = await processGamePayout(
        winnerId,
        gameState.stakePool,
        gameId
      );
      console.log(
        `[XO] Game ${gameId} won by ${winnerId}. Payout: ${payout}, Fee: ${fee}`
      );
    }
  } else if (gameState.status === "draw") {
    // Game drawn - refund both players
    const playerXId = gameState.players.X?.id;
    const playerOId = gameState.players.O?.id;

    if (playerXId && playerOId) {
      await processGameRefund(playerXId, playerOId, gameState.stake!, gameId);
      console.log(
        `[XO] Game ${gameId} drawn. Refunds processed for ${playerXId} and ${playerOId}`
      );
    }
  }
}

/**
 * Get unfinished games for a user (games they are part of that are still waiting or playing)
 */
export function getUnfinishedGamesForUser(
  userId: string
): Array<{ gameId: string; gameState: GameState }> {
  const unfinishedGames: Array<{ gameId: string; gameState: GameState }> = [];

  for (const [gameId, gameState] of xoGames.entries()) {
    // Check if user is part of this game
    const isPlayer =
      gameState.players.X?.id === userId || gameState.players.O?.id === userId;

    // Check if game is unfinished (waiting or playing)
    const isUnfinished =
      gameState.status === "waiting" || gameState.status === "playing";

    if (isPlayer && isUnfinished) {
      unfinishedGames.push({ gameId, gameState });
    }
  }

  return unfinishedGames;
}

/**
 * Get all unfinished games (for admin purposes)
 */
export function getAllUnfinishedGames(): Array<{
  gameId: string;
  gameState: GameState;
}> {
  const unfinishedGames: Array<{ gameId: string; gameState: GameState }> = [];

  for (const [gameId, gameState] of xoGames.entries()) {
    if (gameState.status === "waiting" || gameState.status === "playing") {
      unfinishedGames.push({ gameId, gameState });
    }
  }

  return unfinishedGames;
}
