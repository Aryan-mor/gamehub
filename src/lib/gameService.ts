import { ref, set, get, onValue, off } from "firebase/database";
import { database } from "./firebase";
import {
  GameState,
  PlayerInfo,
  CellValue,
  createInitialGameState,
  checkWinner,
  isDraw,
  getNextPlayer,
} from "./game";
import { recordWin, recordDraw } from "../bot/games/userStats";

// Check if Firebase is properly initialized
const checkFirebaseConnection = () => {
  if (!database) {
    throw new Error(
      "Firebase is not properly configured. Please check your environment variables."
    );
  }
  return database;
};

export class GameService {
  // Create a new game
  static async createGame(player: PlayerInfo): Promise<string> {
    const db = checkFirebaseConnection();

    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gameState = createInitialGameState();

    // Initialize player with connection status
    gameState.players.X = {
      ...player,
      disconnected: false,
      lastSeen: Date.now(),
    };

    // Convert board array to object before saving to Firebase to prevent truncation
    const boardObject: { [key: number]: CellValue } = {};
    for (let i = 0; i < 9; i++) {
      boardObject[i] = gameState.board[i];
    }

    const gameStateToSave = {
      ...gameState,
      board: boardObject,
    };

    await set(ref(db, `games/${gameId}`), gameStateToSave);
    return gameId;
  }

  // Join an existing game or reconnect if already a player
  static async joinGame(gameId: string, player: PlayerInfo): Promise<boolean> {
    const db = checkFirebaseConnection();

    const gameRef = ref(db, `games/${gameId}`);
    const snapshot = await get(gameRef);

    if (!snapshot.exists()) {
      throw new Error("Game not found");
    }

    const gameState: GameState = snapshot.val();

    // Check if player is already in the game (reconnection)
    if (gameState.players.X?.id === player.id) {
      // Player X is reconnecting
      await this.rejoinGame(gameId, player.id);
      return true;
    }

    if (gameState.players.O?.id === player.id) {
      // Player O is reconnecting
      await this.rejoinGame(gameId, player.id);
      return true;
    }

    // New player joining
    if (gameState.players.O) {
      throw new Error("Game is full");
    }

    // Create a copy to avoid mutations
    const processedGameState = { ...gameState };

    // Process board - handle both array and object formats from Firebase
    if (!processedGameState.board) {
      console.warn("Game board is not properly initialized, reinitializing...");
      processedGameState.board = Array(9).fill("-");
    } else if (Array.isArray(processedGameState.board)) {
      // If it's already an array, ensure it has 9 elements
      if (processedGameState.board.length !== 9) {
        console.warn("Game board length is incorrect, reinitializing...");
        processedGameState.board = Array(9).fill("-");
      }
    } else if (typeof processedGameState.board === "object") {
      // If it's an object (Firebase object format), convert to array
      console.warn("Converting Firebase object board to array...");
      const newBoard = Array(9).fill("-");
      for (let i = 0; i < 9; i++) {
        if (processedGameState.board[i] !== undefined) {
          newBoard[i] = processedGameState.board[i];
        }
      }
      processedGameState.board = newBoard;
    } else {
      console.warn("Game board is in unknown format, reinitializing...");
      processedGameState.board = Array(9).fill("-");
    }

    // Add new player with connection status
    const newPlayer = {
      ...player,
      disconnected: false,
      lastSeen: Date.now(),
    };

    processedGameState.players.O = newPlayer;
    processedGameState.status = "playing";
    processedGameState.lastMoveAt = Date.now();
    processedGameState.turnStartedAt = Date.now(); // Start the turn timer

    // Convert board array to object before saving to Firebase to prevent truncation
    const boardObject: { [key: number]: CellValue } = {};
    for (let i = 0; i < 9; i++) {
      boardObject[i] = processedGameState.board[i];
    }

    const gameStateToSave = {
      ...processedGameState,
      board: boardObject,
    };

    await set(gameRef, gameStateToSave);
    return true;
  }

  // Make a move
  static async makeMove(
    gameId: string,
    playerId: string,
    cellIndex: number
  ): Promise<void> {
    const db = checkFirebaseConnection();

    const gameRef = ref(db, `games/${gameId}`);
    const snapshot = await get(gameRef);

    if (!snapshot.exists()) {
      throw new Error("Game not found");
    }

    const gameState: GameState = snapshot.val();

    // Create a copy to avoid mutations
    const processedGameState = { ...gameState };

    // Process board - handle both array and object formats from Firebase
    if (!processedGameState.board) {
      console.warn("Game board is not properly initialized, reinitializing...");
      processedGameState.board = Array(9).fill("-");
    } else if (Array.isArray(processedGameState.board)) {
      // If it's already an array, ensure it has 9 elements
      if (processedGameState.board.length !== 9) {
        console.warn("Game board length is incorrect, reinitializing...");
        processedGameState.board = Array(9).fill("-");
      }
    } else if (typeof processedGameState.board === "object") {
      // If it's an object (Firebase object format), convert to array
      console.warn("Converting Firebase object board to array...");
      const newBoard = Array(9).fill("-");
      for (let i = 0; i < 9; i++) {
        if (processedGameState.board[i] !== undefined) {
          newBoard[i] = processedGameState.board[i];
        }
      }
      processedGameState.board = newBoard;
    } else {
      console.warn("Game board is in unknown format, reinitializing...");
      processedGameState.board = Array(9).fill("-");
    }

    // Ensure board is properly initialized
    if (
      !Array.isArray(processedGameState.board) ||
      processedGameState.board.length !== 9
    ) {
      console.warn("Game board is not properly initialized, reinitializing...");
      processedGameState.board = Array(9).fill("-");
    }

    // Check if it's the player's turn
    const currentPlayerInfo =
      processedGameState.players[processedGameState.currentPlayer];
    if (!currentPlayerInfo || currentPlayerInfo.id !== playerId) {
      throw new Error("Not your turn");
    }

    // Check if the cell is empty
    if (processedGameState.board[cellIndex] !== "-") {
      throw new Error("Cell is already occupied");
    }

    // Check if game is still playing
    if (processedGameState.status !== "playing") {
      throw new Error(
        `Game is in ${processedGameState.status} state. Cannot make moves.`
      );
    }

    // Make the move
    console.log("Making move:", {
      cellIndex,
      currentPlayer: processedGameState.currentPlayer,
      boardBefore: processedGameState.board,
    });

    // Create a new board array to ensure proper reactivity
    // Ensure we have a complete 9-element array
    const newBoard = Array(9).fill("-");
    for (let i = 0; i < Math.min(processedGameState.board.length, 9); i++) {
      newBoard[i] = processedGameState.board[i];
    }
    newBoard[cellIndex] = processedGameState.currentPlayer;
    processedGameState.board = newBoard;

    console.log("Board after move:", {
      newBoard,
      processedGameStateBoard: processedGameState.board,
    });

    processedGameState.lastMoveAt = Date.now();

    // Check for winner
    const winner = checkWinner(processedGameState.board);
    if (winner) {
      processedGameState.status = "won";
      processedGameState.winner = winner;

      // Record the win
      const winnerId =
        winner === "X"
          ? processedGameState.players.X?.id
          : processedGameState.players.O?.id;
      const loserId =
        winner === "X"
          ? processedGameState.players.O?.id
          : processedGameState.players.X?.id;
      if (winnerId && loserId) {
        recordWin(winnerId, loserId, "xo");
      }
    } else if (isDraw(processedGameState.board)) {
      processedGameState.status = "draw";

      // Record the draw
      const playerXId = processedGameState.players.X?.id;
      const playerOId = processedGameState.players.O?.id;
      if (playerXId && playerOId) {
        recordDraw(playerXId, playerOId, "xo");
      }
    } else {
      // Switch turns and reset turn timer
      processedGameState.currentPlayer = getNextPlayer(
        processedGameState.currentPlayer
      );
      processedGameState.turnStartedAt = Date.now();
    }

    // Convert board array to object before saving to Firebase to prevent truncation
    const boardObject: { [key: number]: CellValue } = {};
    for (let i = 0; i < 9; i++) {
      boardObject[i] = processedGameState.board[i];
    }

    const gameStateToSave = {
      ...processedGameState,
      board: boardObject,
    };

    await set(gameRef, gameStateToSave);
    console.log("Move saved to Firebase successfully");
  }

  // Reset game
  static async resetGame(gameId: string): Promise<void> {
    checkFirebaseConnection();

    const gameRef = ref(checkFirebaseConnection(), `games/${gameId}`);
    const snapshot = await get(gameRef);

    if (!snapshot.exists()) {
      throw new Error("Game not found");
    }

    const gameState: GameState = snapshot.val();
    const resetState = createInitialGameState();
    resetState.players = gameState.players;
    resetState.status = "playing";
    resetState.turnStartedAt = Date.now(); // Reset turn timer

    // Convert board array to object before saving to Firebase to prevent truncation
    const boardObject: { [key: number]: CellValue } = {};
    for (let i = 0; i < 9; i++) {
      boardObject[i] = resetState.board[i];
    }

    const gameStateToSave = {
      ...resetState,
      board: boardObject,
    };

    await set(gameRef, gameStateToSave);
  }

  // Graceful disconnect handling - don't remove players, just mark them as disconnected
  static async handlePlayerDisconnect(
    gameId: string,
    playerId: string
  ): Promise<void> {
    checkFirebaseConnection();

    const gameRef = ref(checkFirebaseConnection(), `games/${gameId}`);
    const snapshot = await get(gameRef);

    if (!snapshot.exists()) {
      return;
    }

    const gameState: GameState = snapshot.val();
    const processedGameState = { ...gameState };

    // Mark player as disconnected but keep them in the game
    if (processedGameState.players.X?.id === playerId) {
      processedGameState.players.X = {
        ...processedGameState.players.X,
        disconnected: true,
        lastSeen: Date.now(),
      };
    } else if (processedGameState.players.O?.id === playerId) {
      processedGameState.players.O = {
        ...processedGameState.players.O,
        disconnected: true,
        lastSeen: Date.now(),
      };
    }

    // Keep the game running - don't change status
    await set(gameRef, processedGameState);
  }

  // Rejoin game - called when a player returns
  static async rejoinGame(gameId: string, playerId: string): Promise<boolean> {
    checkFirebaseConnection();

    const gameRef = ref(checkFirebaseConnection(), `games/${gameId}`);
    const snapshot = await get(gameRef);

    if (!snapshot.exists()) {
      return false;
    }

    const gameState: GameState = snapshot.val();
    const processedGameState = { ...gameState };

    // Mark player as reconnected
    if (processedGameState.players.X?.id === playerId) {
      processedGameState.players.X = {
        ...processedGameState.players.X,
        disconnected: false,
        lastSeen: Date.now(),
      };
    } else if (processedGameState.players.O?.id === playerId) {
      processedGameState.players.O = {
        ...processedGameState.players.O,
        disconnected: false,
        lastSeen: Date.now(),
      };
    }

    await set(gameRef, processedGameState);
    return true;
  }

  // Legacy leave game method - now just navigates away without affecting the game
  static async leaveGame(gameId: string, playerId: string): Promise<void> {
    // Don't actually leave the game - just handle disconnect gracefully
    await this.handlePlayerDisconnect(gameId, playerId);
  }

  // Subscribe to game updates
  static subscribeToGame(
    gameId: string,
    callback: (gameState: GameState | null) => void
  ): () => void {
    const db = checkFirebaseConnection();

    const gameRef = ref(db, `games/${gameId}`);

    const unsubscribe = onValue(
      gameRef,
      (snapshot) => {
        console.log("Firebase update received:", {
          exists: snapshot.exists(),
          val: snapshot.val(),
        });

        if (snapshot.exists()) {
          const gameState = snapshot.val();

          // Create a copy of the game state to avoid mutations
          const processedGameState = { ...gameState };

          // Process board - handle both array and object formats from Firebase
          if (!processedGameState.board) {
            processedGameState.board = Array(9).fill("-");
          } else if (Array.isArray(processedGameState.board)) {
            // If it's already an array, ensure it has 9 elements
            if (processedGameState.board.length !== 9) {
              const newBoard = Array(9).fill("-");
              for (
                let i = 0;
                i < Math.min(processedGameState.board.length, 9);
                i++
              ) {
                newBoard[i] = processedGameState.board[i];
              }
              processedGameState.board = newBoard;
            }
          } else if (typeof processedGameState.board === "object") {
            // If it's an object (Firebase object format), convert to array
            const newBoard = Array(9).fill("-");
            for (let i = 0; i < 9; i++) {
              if (processedGameState.board[i] !== undefined) {
                newBoard[i] = processedGameState.board[i];
              }
            }
            processedGameState.board = newBoard;
          } else {
            // Fallback to empty array
            processedGameState.board = Array(9).fill("-");
          }

          console.log("Processed game state:", processedGameState);
          callback(processedGameState);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Firebase subscription error:", error);
        callback(null);
      }
    );

    return () => {
      off(gameRef);
      unsubscribe();
    };
  }

  // Get game by ID
  static async getGame(gameId: string): Promise<GameState | null> {
    checkFirebaseConnection();

    const gameRef = ref(checkFirebaseConnection(), `games/${gameId}`);
    const snapshot = await get(gameRef);

    if (snapshot.exists()) {
      const gameState = snapshot.val();

      // Create a copy to avoid mutations
      const processedGameState = { ...gameState };

      // Process board - handle both array and object formats from Firebase
      if (!processedGameState.board) {
        processedGameState.board = Array(9).fill("-");
      } else if (Array.isArray(processedGameState.board)) {
        // If it's already an array, ensure it has 9 elements
        if (processedGameState.board.length !== 9) {
          const newBoard = Array(9).fill("-");
          for (
            let i = 0;
            i < Math.min(processedGameState.board.length, 9);
            i++
          ) {
            newBoard[i] = processedGameState.board[i];
          }
          processedGameState.board = newBoard;
        }
      } else if (typeof processedGameState.board === "object") {
        // If it's an object (Firebase object format), convert to array
        const newBoard = Array(9).fill("-");
        for (let i = 0; i < 9; i++) {
          if (processedGameState.board[i] !== undefined) {
            newBoard[i] = processedGameState.board[i];
          }
        }
        processedGameState.board = newBoard;
      } else {
        // Fallback to empty array
        processedGameState.board = Array(9).fill("-");
      }

      return processedGameState;
    }

    return null;
  }

  // Handle inactivity timeout
  static async handleInactivityTimeout(gameId: string): Promise<void> {
    const db = checkFirebaseConnection();

    const gameRef = ref(db, `games/${gameId}`);
    const snapshot = await get(gameRef);

    if (!snapshot.exists()) {
      return;
    }

    const gameState: GameState = snapshot.val();

    // Only handle timeout if game is still playing
    if (gameState.status !== "playing") {
      return;
    }

    const processedGameState = { ...gameState };

    // Process board - handle both array and object formats from Firebase
    if (!processedGameState.board) {
      processedGameState.board = Array(9).fill("-");
    } else if (Array.isArray(processedGameState.board)) {
      // If it's already an array, ensure it has 9 elements
      if (processedGameState.board.length !== 9) {
        const newBoard = Array(9).fill("-");
        for (let i = 0; i < Math.min(processedGameState.board.length, 9); i++) {
          newBoard[i] = processedGameState.board[i];
        }
        processedGameState.board = newBoard;
      }
    } else if (typeof processedGameState.board === "object") {
      // If it's an object (Firebase object format), convert to array
      const newBoard = Array(9).fill("-");
      for (let i = 0; i < 9; i++) {
        if (processedGameState.board[i] !== undefined) {
          newBoard[i] = processedGameState.board[i];
        }
      }
      processedGameState.board = newBoard;
    } else {
      // Fallback to empty array
      processedGameState.board = Array(9).fill("-");
    }

    // Check if current player has timed out
    const timeoutDuration = processedGameState.timeoutDuration || 120000; // Default 2 minutes
    const turnStartedAt =
      processedGameState.turnStartedAt || processedGameState.lastMoveAt;
    const now = Date.now();

    console.log("Timeout check:", {
      timeoutDuration,
      turnStartedAt,
      now,
      elapsed: now - turnStartedAt,
      shouldTimeout: now - turnStartedAt >= timeoutDuration,
      currentPlayer: processedGameState.currentPlayer,
      status: processedGameState.status,
    });

    if (now - turnStartedAt >= timeoutDuration) {
      // Current player has timed out - they lose
      const inactivePlayer = processedGameState.currentPlayer;
      const winningPlayer = inactivePlayer === "X" ? "O" : "X";

      processedGameState.status = "timeout";
      processedGameState.winner = winningPlayer;

      // Convert board array to object before saving to Firebase
      const boardObject: { [key: number]: CellValue } = {};
      for (let i = 0; i < 9; i++) {
        boardObject[i] = processedGameState.board[i];
      }

      const gameStateToSave = {
        ...processedGameState,
        board: boardObject,
      };
      await set(gameRef, gameStateToSave);
      console.log(
        `Player ${inactivePlayer} timed out. Player ${winningPlayer} wins.`
      );
    }
  }

  // Check and handle timeout for a game
  static async checkAndHandleTimeout(gameId: string): Promise<boolean> {
    const db = checkFirebaseConnection();

    const gameRef = ref(db, `games/${gameId}`);
    const snapshot = await get(gameRef);

    if (!snapshot.exists()) {
      console.log(`Game ${gameId} does not exist`);
      return false;
    }

    const gameState: GameState = snapshot.val();

    // Only check timeout if game is still playing
    if (gameState.status !== "playing") {
      console.log(`Game ${gameId} is not playing, status: ${gameState.status}`);
      return false;
    }

    const timeoutDuration = gameState.timeoutDuration || 5000; // Default 5 seconds for testing
    const turnStartedAt = gameState.turnStartedAt || gameState.lastMoveAt;
    const now = Date.now();

    console.log(`Timeout check for game ${gameId}:`, {
      timeoutDuration,
      turnStartedAt,
      now,
      elapsed: now - turnStartedAt,
      shouldTimeout: now - turnStartedAt >= timeoutDuration,
      currentPlayer: gameState.currentPlayer,
    });

    if (now - turnStartedAt >= timeoutDuration) {
      console.log(
        `Timeout occurred for game ${gameId}, calling handleInactivityTimeout`
      );
      await this.handleInactivityTimeout(gameId);
      return true;
    }

    return false;
  }
}
