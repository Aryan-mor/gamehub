import {
  PlayerInfo,
  GameState,
  createInitialGameState,
  Player,
} from "../../lib/game";
import TelegramBot from "node-telegram-bot-api";

// In-memory game storage for X/O games
const ticTacToeGames = new Map<string, GameState>();

// Game constants
const GAME_TYPE = "xo";
const GAME_NAME = "X/O Game";
const GAME_DESCRIPTION = "Classic TicTacToe game for 2 players";

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
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
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
 * Create a new TicTacToe game
 */
export function createTicTacToeGame(
  creatorId: string,
  creatorName: string
): { gameId: string; gameState: GameState } {
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
  };

  ticTacToeGames.set(gameId, gameState);

  return { gameId, gameState };
}

/**
 * Join a TicTacToe game
 */
export function joinTicTacToeGame(
  gameId: string,
  joinerId: string,
  joinerName: string
): GameState | null {
  const gameState = ticTacToeGames.get(gameId);

  if (!gameState || gameState.players.O || gameState.status !== "waiting") {
    return null;
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

  ticTacToeGames.set(gameId, gameState);

  return gameState;
}

/**
 * Make a move in a TicTacToe game
 */
export function makeMove(
  gameId: string,
  playerId: string,
  position: number
): { success: boolean; gameState?: GameState; error?: string } {
  const gameState = ticTacToeGames.get(gameId);

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
    gameState.winner = winner as Player;
  } else if (isDraw(gameState.board)) {
    gameState.status = "draw";
  } else {
    gameState.currentPlayer = getNextPlayer(gameState.currentPlayer) as Player;
    gameState.turnStartedAt = Date.now();
  }

  ticTacToeGames.set(gameId, gameState);

  return { success: true, gameState };
}

/**
 * Restart a TicTacToe game with swapped players
 */
export function restartTicTacToeGame(gameId: string): GameState | null {
  const gameState = ticTacToeGames.get(gameId);

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
    currentPlayer: "X", // O (now X) starts first
    turnStartedAt: Date.now(),
  };

  ticTacToeGames.set(gameId, newGameState);

  return newGameState;
}

/**
 * Create a new TicTacToe game with same players
 */
export function newTicTacToeGame(gameId: string): GameState | null {
  const gameState = ticTacToeGames.get(gameId);

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
    currentPlayer: "X", // X starts first (same as original)
    turnStartedAt: Date.now(),
  };

  ticTacToeGames.set(gameId, newGameState);

  return newGameState;
}

/**
 * Get a TicTacToe game by ID
 */
export function getTicTacToeGame(gameId: string): GameState | undefined {
  return ticTacToeGames.get(gameId);
}

/**
 * Delete a TicTacToe game
 */
export function deleteTicTacToeGame(gameId: string): boolean {
  return ticTacToeGames.delete(gameId);
}

/**
 * Check if a user is part of a TicTacToe game
 */
export function isPlayerInGame(gameId: string, userId: string): boolean {
  const gameState = ticTacToeGames.get(gameId);
  if (!gameState) return false;

  return (
    gameState.players.X?.id === userId || gameState.players.O?.id === userId
  );
}

/**
 * Format the TicTacToe board for display
 */
export function formatTicTacToeBoard(board: string[]): string {
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
 * Get the status message for a TicTacToe game
 */
export function getTicTacToeStatusMessage(game: GameState): string {
  if (game.winner) {
    const winnerName =
      game.winner === "X" ? game.players.X?.name : game.players.O?.name;
    return `🎉 ${winnerName || "Unknown"} wins!`;
  }

  if (game.status === "draw") {
    return `🤝 It's a draw!`;
  }

  const currentPlayerName =
    game.currentPlayer === "X" ? game.players.X?.name : game.players.O?.name;

  return `🎯 It's ${currentPlayerName || "opponent"}'s turn`;
}

/**
 * Create the TicTacToe board keyboard
 */
export function createTicTacToeKeyboard(
  game: GameState,
  gameId: string,
  isMyTurn: boolean
): TelegramBot.InlineKeyboardMarkup {
  const keyboard: TelegramBot.InlineKeyboardButton[][] = [];
  let row: TelegramBot.InlineKeyboardButton[] = [];

  for (let i = 0; i < 9; i++) {
    const cell = game.board[i];
    let text = "⬜";
    let callbackData = `move:${gameId}:${i}`;

    if (cell === "X") {
      text = "❌";
      callbackData = "noop";
    } else if (cell === "O") {
      text = "🟢";
      callbackData = "noop";
    }

    // Disable buttons if not player's turn or game is over
    if (!isMyTurn || game.winner || game.status === "draw") {
      callbackData = "noop";
    }

    row.push({
      text,
      callback_data: callbackData,
    });

    if (row.length === 3) {
      keyboard.push(row);
      row = [];
    }
  }

  return { inline_keyboard: keyboard };
}

/**
 * Create restart buttons for when game ends
 */
export function createRestartButtons(
  gameId: string
): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: "🔄 Play Again",
          callback_data: `restart_game:${gameId}`,
        },
        {
          text: "🎮 New Game",
          callback_data: `new_game:${gameId}`,
        },
      ],
    ],
  };
}

/**
 * Create game selection keyboard
 */
export function createGameSelectionKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: "X/O Game",
          callback_data: "inline_start_game:xo",
        },
        {
          text: "Dots & Boxes",
          callback_data: "inline_start_game:dots",
        },
      ],
      [
        {
          text: "Memory Game",
          callback_data: "inline_start_game:memory",
        },
      ],
    ],
  };
}

// Export constants
export { GAME_TYPE, GAME_NAME, GAME_DESCRIPTION };
