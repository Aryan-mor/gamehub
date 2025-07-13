import {
  getNextPlayer,
  checkWinner,
  isDraw,
  getXoGame,
  createInitialGameState,
  setXoGame,
} from "./game";
import { recordWin, recordDraw } from "../../bot/games/userStats";
import type { GameState, Player } from "../../lib/game";

/**
 * Make a move in an X/O game
 */
export async function makeXoMove(
  gameId: string,
  playerId: string,
  position: number
): Promise<{ success: boolean; gameState?: GameState; error?: string }> {
  const gameState = getXoGame(gameId);

  if (!gameState) {
    return { success: false, error: "Game not found" };
  }

  // Check if it's the player's turn
  const currentPlayerInfo = gameState.players[gameState.currentPlayer];
  if (!currentPlayerInfo || currentPlayerInfo.id !== playerId) {
    return { success: false, error: "Not your turn" };
  }

  // Check if cell is empty
  if (gameState.board[position] !== "-") {
    return { success: false, error: "Cell already occupied" };
  }

  // Make the move
  gameState.board[position] = gameState.currentPlayer;
  gameState.lastMoveAt = Date.now();

  // Check for winner
  const winner = checkWinner(gameState.board);
  if (winner) {
    gameState.status = "won";
    gameState.winner = winner as "X" | "O";

    // Record the win
    const winnerId =
      winner === "X" ? gameState.players.X?.id : gameState.players.O?.id;
    const loserId =
      winner === "X" ? gameState.players.O?.id : gameState.players.X?.id;
    if (winnerId && loserId) {
      await recordWin(winnerId, loserId, "xo");
    }
  } else if (isDraw(gameState.board)) {
    gameState.status = "draw";

    // Record the draw
    const playerXId = gameState.players.X?.id;
    const playerOId = gameState.players.O?.id;
    if (playerXId && playerOId) {
      await recordDraw(playerXId, playerOId, "xo");
    }
  } else {
    gameState.currentPlayer = getNextPlayer(gameState.currentPlayer) as
      | "X"
      | "O";
    gameState.turnStartedAt = Date.now();
  }

  return { success: true, gameState };
}

/**
 * Restart an X/O game with swapped players
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function restartXoGame(gameId: string): GameState | null {
  const gameState = getXoGame(gameId);
  if (!gameState) {
    return null;
  }
  // Swap players: O becomes X, X becomes O
  const originalX = gameState.players.X;
  const originalO = gameState.players.O;
  const newGameState: GameState = {
    ...createInitialGameState(),
    players: {
      X: originalO, // O becomes X (starts first)
      O: originalX, // X becomes O
    },
    status: "playing",
    currentPlayer: "X" as Player, // O (now X) starts first
    turnStartedAt: Date.now(),
  };
  // Save new state
  setXoGame(gameId, newGameState);
  return newGameState;
}

/**
 * Create a new X/O game with same players
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function newXoGame(gameId: string): GameState | null {
  const gameState = getXoGame(gameId);
  if (!gameState) {
    return null;
  }
  const newGameState: GameState = {
    ...createInitialGameState(),
    players: {
      X: gameState.players.X,
      O: gameState.players.O,
    },
    status: "playing",
    currentPlayer: "X" as Player,
    turnStartedAt: Date.now(),
  };
  // Save new state
  setXoGame(gameId, newGameState);
  return newGameState;
}
