import { ref, set, get } from "firebase/database";
import { database } from "../../lib/firebase";
import { adjustCoins, requireBalance } from "../../lib/coinService";

export interface BasketballGameState {
  id: string;
  userId: string;
  stake: number;
  guess: "score" | "miss";
  result?: number;
  reward?: number;
  status: "pending" | "completed";
  createdAt: number;
  completedAt?: number;
}

export interface BasketballGameResult {
  won: boolean;
  reward: number;
  fee: number;
  message: string;
}

export const BASKETBALL_STAKES = [2, 5, 10, 20] as const;
export type BasketballStake = (typeof BASKETBALL_STAKES)[number];

const GAMES_PATH = "basketballGames";

/**
 * Create a new basketball game
 */
export async function createBasketballGame(
  userId: string,
  stake: BasketballStake
): Promise<BasketballGameState> {
  console.log(
    `[BASKETBALL] createBasketballGame called: userId=${userId}, stake=${stake}`
  );

  if (!database) throw new Error("Firebase not initialized");

  // Check balance
  console.log(
    `[BASKETBALL] Checking balance for userId=${userId}, required=${stake}`
  );
  const hasBalance = await requireBalance(userId, stake);
  console.log(`[BASKETBALL] Balance check result: hasBalance=${hasBalance}`);

  if (!hasBalance) {
    throw new Error("Insufficient coins");
  }

  const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
  console.log(`[BASKETBALL] Generated gameId: ${gameId}`);

  // Deduct stake
  console.log(
    `[BASKETBALL] Deducting stake: userId=${userId}, amount=${stake}`
  );
  await adjustCoins(userId, -stake, "basketball_stake", gameId);

  const gameState: BasketballGameState = {
    id: gameId,
    userId,
    stake,
    guess: "miss", // Default value, will be set later
    status: "pending",
    createdAt: Date.now(),
  };

  console.log(
    `[BASKETBALL] Game state to save:`,
    JSON.stringify(gameState, null, 2)
  );
  await set(ref(database, `${GAMES_PATH}/${gameId}`), gameState);
  console.log(
    `[BASKETBALL] Created game ${gameId} with stake ${stake} for user ${userId}`
  );

  return gameState;
}

/**
 * Set the user's guess for a basketball game
 */
export async function setBasketballGuess(
  gameId: string,
  guess: "score" | "miss"
): Promise<BasketballGameState> {
  console.log(
    `[BASKETBALL] setBasketballGuess called: gameId=${gameId}, guess=${guess}`
  );

  if (!database) throw new Error("Firebase not initialized");

  const gameRef = ref(database, `${GAMES_PATH}/${gameId}`);
  console.log(`[BASKETBALL] Fetching game from path: ${GAMES_PATH}/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    console.log(`[BASKETBALL] Game not found: ${gameId}`);
    throw new Error("Game not found");
  }

  const gameState: BasketballGameState = snapshot.val();
  console.log(
    `[BASKETBALL] Retrieved game state:`,
    JSON.stringify(gameState, null, 2)
  );

  if (gameState.status !== "pending") {
    console.log(
      `[BASKETBALL] Game already completed: status=${gameState.status}`
    );
    throw new Error("Game already completed");
  }

  gameState.guess = guess;
  console.log(
    `[BASKETBALL] Updated game state with guess:`,
    JSON.stringify(gameState, null, 2)
  );
  await set(gameRef, gameState);

  console.log(`[BASKETBALL] Set guess ${guess} for game ${gameId}`);
  return gameState;
}

/**
 * Process basketball dice result and calculate winnings
 */
export async function processBasketballResult(
  gameId: string,
  diceResult: number
): Promise<BasketballGameResult> {
  console.log(
    `[BASKETBALL] processBasketballResult called: gameId=${gameId}, diceResult=${diceResult}`
  );

  if (!database) throw new Error("Firebase not initialized");

  const gameRef = ref(database, `${GAMES_PATH}/${gameId}`);
  console.log(`[BASKETBALL] Fetching game from path: ${GAMES_PATH}/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    console.log(`[BASKETBALL] Game not found: ${gameId}`);
    throw new Error("Game not found");
  }

  const gameState: BasketballGameState = snapshot.val();
  console.log(
    `[BASKETBALL] Retrieved game state:`,
    JSON.stringify(gameState, null, 2)
  );

  if (gameState.status !== "pending") {
    console.log(
      `[BASKETBALL] Game already completed: status=${gameState.status}`
    );
    throw new Error("Game already completed");
  }

  console.log(
    `[BASKETBALL] Calculating winnings: guess=${gameState.guess}, diceResult=${diceResult}, stake=${gameState.stake}`
  );
  const { won, reward } = calculateBasketballWinnings(
    gameState.guess,
    diceResult,
    gameState.stake
  );
  console.log(`[BASKETBALL] Winnings calculated: won=${won}, reward=${reward}`);

  // Update game state
  gameState.result = diceResult;
  gameState.reward = reward;
  gameState.status = "completed";
  gameState.completedAt = Date.now();

  console.log(
    `[BASKETBALL] Updated game state:`,
    JSON.stringify(gameState, null, 2)
  );
  await set(gameRef, gameState);

  // Handle coin transfers
  if (won && reward > 0) {
    console.log(
      `[BASKETBALL] User won, crediting ${reward} coins to userId=${gameState.userId}`
    );
    await adjustCoins(gameState.userId, reward, "basketball_win", gameId);
  }

  // Create result message
  const resultText = diceResult >= 4 ? "🏀 SCORED" : "❌ MISSED";
  const guessText = gameState.guess === "score" ? "🏀 Score" : "❌ Miss";
  const resultMessage = won
    ? `🏀 Shot result: ${diceResult} → ${resultText}\nYour guess: ${guessText}\nResult: ✅ WIN (+${reward} Coins)`
    : `🏀 Shot result: ${diceResult} → ${resultText}\nYour guess: ${guessText}\nResult: ❌ You lost`;

  console.log(
    `[BASKETBALL] Game ${gameId} completed: won=${won}, reward=${reward}`
  );

  return {
    won,
    reward,
    fee: 0, // No fee in this version
    message: resultMessage,
  };
}

/**
 * Calculate basketball winnings based on guess and dice result
 * Basketball dice: 1-3 = Miss, 4-5 = Score
 */
function calculateBasketballWinnings(
  guess: "score" | "miss",
  diceResult: number,
  stake: number
): { won: boolean; reward: number } {
  console.log(
    `[BASKETBALL] calculateBasketballWinnings: guess=${guess}, diceResult=${diceResult}, stake=${stake}`
  );

  // Basketball dice: 1-3 = Miss, 4-5 = Score
  const actualResult = diceResult >= 4 ? "score" : "miss";
  const won = guess === actualResult;

  if (!won) {
    console.log(
      `[BASKETBALL] User lost: guess=${guess}, actual=${actualResult}`
    );
    return { won: false, reward: 0 };
  }

  // User won - calculate reward (2x stake)
  const reward = stake * 2;

  console.log(`[BASKETBALL] User won: reward=${reward}`);

  return { won: true, reward };
}

/**
 * Get basketball statistics for a user
 */
export async function getBasketballStats(userId: string): Promise<{
  totalGames: number;
  totalWins: number;
  totalWinnings: number;
}> {
  console.log(`[BASKETBALL] getBasketballStats called for userId=${userId}`);

  if (!database) throw new Error("Firebase not initialized");

  const gamesRef = ref(database, GAMES_PATH);
  const snapshot = await get(gamesRef);

  if (!snapshot.exists()) {
    console.log(`[BASKETBALL] No basketball games found`);
    return { totalGames: 0, totalWins: 0, totalWinnings: 0 };
  }

  const games = snapshot.val();
  let totalGames = 0;
  let totalWins = 0;
  let totalWinnings = 0;

  for (const gameId in games) {
    const game = games[gameId] as BasketballGameState;
    if (game.userId === userId && game.status === "completed") {
      totalGames++;
      if (game.reward && game.reward > 0) {
        totalWins++;
        totalWinnings += game.reward;
      }
    }
  }

  console.log(
    `[BASKETBALL] Stats for userId=${userId}: games=${totalGames}, wins=${totalWins}, winnings=${totalWinnings}`
  );

  return { totalGames, totalWins, totalWinnings };
}

/**
 * Get recent basketball games for a user
 */
export async function getRecentBasketballGames(
  userId: string,
  limit: number = 10
): Promise<BasketballGameState[]> {
  console.log(
    `[BASKETBALL] getRecentBasketballGames called for userId=${userId}, limit=${limit}`
  );

  if (!database) throw new Error("Firebase not initialized");

  const gamesRef = ref(database, GAMES_PATH);
  const snapshot = await get(gamesRef);

  if (!snapshot.exists()) {
    console.log(`[BASKETBALL] No basketball games found`);
    return [];
  }

  const games = snapshot.val();
  const userGames: BasketballGameState[] = [];

  for (const gameId in games) {
    const game = games[gameId] as BasketballGameState;
    if (game.userId === userId && game.status === "completed") {
      userGames.push(game);
    }
  }

  // Sort by completion time (newest first) and limit results
  const sortedGames = userGames
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
    .slice(0, limit);

  console.log(
    `[BASKETBALL] Found ${sortedGames.length} recent games for userId=${userId}`
  );

  return sortedGames;
}
