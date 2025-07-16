import { ref, set, get } from "firebase/database";
import { database } from "../../lib/firebase";
import { adjustCoins, requireBalance } from "../../lib/coinService";
import publicConfig from "../publicConfig";

export interface FootballGameState {
  id: string;
  userId: string;
  stake: number;
  guess: number;
  result?: number;
  reward?: number;
  status: "pending" | "completed";
  createdAt: number;
  completedAt?: number;
}

export interface FootballGameResult {
  won: boolean;
  reward: number;
  fee: number;
  message: string;
}

export const FOOTBALL_STAKES = [2, 5, 10, 20] as const;
export type FootballStake = (typeof FOOTBALL_STAKES)[number];

export const FOOTBALL_DIRECTIONS = {
  1: "Top-Left",
  2: "Top-Right",
  3: "Center",
  4: "Bottom-Left",
  5: "Bottom-Right",
} as const;

export const FOOTBALL_DIRECTION_KEYS = {
  "Top-Left": 1,
  "Top-Right": 2,
  Center: 3,
  "Bottom-Left": 4,
  "Bottom-Right": 5,
} as const;

const GAMES_PATH = "footballGames";

/**
 * Create a new football game
 */
export async function createFootballGame(
  userId: string,
  stake: FootballStake
): Promise<FootballGameState> {
  console.log(
    `[FOOTBALL] createFootballGame called: userId=${userId}, stake=${stake}`
  );

  if (!database) throw new Error("Firebase not initialized");

  // Check balance
  console.log(
    `[FOOTBALL] Checking balance for userId=${userId}, required=${stake}`
  );
  const hasBalance = await requireBalance(userId, stake);
  console.log(`[FOOTBALL] Balance check result: hasBalance=${hasBalance}`);

  if (!hasBalance) {
    throw new Error("Insufficient coins");
  }

  const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
  console.log(`[FOOTBALL] Generated gameId: ${gameId}`);

  // Deduct stake
  console.log(`[FOOTBALL] Deducting stake: userId=${userId}, amount=${stake}`);
  await adjustCoins(userId, -stake, "football_stake", gameId);

  const gameState: FootballGameState = {
    id: gameId,
    userId,
    stake,
    guess: 0,
    status: "pending",
    createdAt: Date.now(),
  };

  console.log(
    `[FOOTBALL] Game state to save:`,
    JSON.stringify(gameState, null, 2)
  );
  await set(ref(database, `${GAMES_PATH}/${gameId}`), gameState);
  console.log(
    `[FOOTBALL] Created game ${gameId} with stake ${stake} for user ${userId}`
  );

  return gameState;
}

/**
 * Set the user's guess for a football game
 */
export async function setFootballGuess(
  gameId: string,
  guess: number
): Promise<FootballGameState> {
  console.log(
    `[FOOTBALL] setFootballGuess called: gameId=${gameId}, guess=${guess}`
  );

  if (!database) throw new Error("Firebase not initialized");

  const gameRef = ref(database, `${GAMES_PATH}/${gameId}`);
  console.log(`[FOOTBALL] Fetching game from path: ${GAMES_PATH}/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    console.log(`[FOOTBALL] Game not found: ${gameId}`);
    throw new Error("Game not found");
  }

  const gameState: FootballGameState = snapshot.val();
  console.log(
    `[FOOTBALL] Retrieved game state:`,
    JSON.stringify(gameState, null, 2)
  );

  if (gameState.status !== "pending") {
    console.log(
      `[FOOTBALL] Game already completed: status=${gameState.status}`
    );
    throw new Error("Game already completed");
  }

  gameState.guess = guess;
  console.log(
    `[FOOTBALL] Updated game state with guess:`,
    JSON.stringify(gameState, null, 2)
  );
  await set(gameRef, gameState);

  console.log(`[FOOTBALL] Set guess ${guess} for game ${gameId}`);
  return gameState;
}

/**
 * Process football dice result and calculate winnings
 */
export async function processFootballResult(
  gameId: string,
  diceResult: number
): Promise<FootballGameResult> {
  console.log(
    `[FOOTBALL] processFootballResult called: gameId=${gameId}, diceResult=${diceResult}`
  );

  if (!database) throw new Error("Firebase not initialized");

  const gameRef = ref(database, `${GAMES_PATH}/${gameId}`);
  console.log(`[FOOTBALL] Fetching game from path: ${GAMES_PATH}/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    console.log(`[FOOTBALL] Game not found: ${gameId}`);
    throw new Error("Game not found");
  }

  const gameState: FootballGameState = snapshot.val();
  console.log(
    `[FOOTBALL] Retrieved game state:`,
    JSON.stringify(gameState, null, 2)
  );

  if (gameState.status !== "pending") {
    console.log(
      `[FOOTBALL] Game already completed: status=${gameState.status}`
    );
    throw new Error("Game already completed");
  }

  console.log(
    `[FOOTBALL] Calculating winnings: guess=${gameState.guess}, diceResult=${diceResult}, stake=${gameState.stake}`
  );
  const { won, reward } = calculateFootballWinnings(
    gameState.guess,
    diceResult,
    gameState.stake
  );
  console.log(`[FOOTBALL] Winnings calculated: won=${won}, reward=${reward}`);

  // Update game state
  gameState.result = diceResult;
  gameState.reward = reward;
  gameState.status = "completed";
  gameState.completedAt = Date.now();

  console.log(
    `[FOOTBALL] Updated game state:`,
    JSON.stringify(gameState, null, 2)
  );
  await set(gameRef, gameState);

  // Process payout if won
  if (won && reward > 0) {
    console.log(
      `[FOOTBALL] Processing payout: userId=${gameState.userId}, reward=${reward}, gameId=${gameId}`
    );
    await adjustCoins(gameState.userId, reward, "football_win", gameId);
  }

  const guessDirection =
    FOOTBALL_DIRECTIONS[gameState.guess as keyof typeof FOOTBALL_DIRECTIONS];
  const resultDirection =
    FOOTBALL_DIRECTIONS[diceResult as keyof typeof FOOTBALL_DIRECTIONS];

  const message = won
    ? `⚽️ You aimed for: ${guessDirection}\n📍 Ball landed: ${resultDirection}\n🎯 **WIN!**\n🏆 +${reward} Coins`
    : `⚽️ You aimed for: ${guessDirection}\n📍 Ball landed: ${resultDirection}\n🎯 **LOSE**\n💸 You lost ${gameState.stake} coins`;

  console.log(
    `[FOOTBALL] Game ${gameId} completed: won=${won}, reward=${reward}`
  );
  return { won, reward, fee: 0, message };
}

/**
 * Calculate football game winnings
 */
function calculateFootballWinnings(
  guess: number,
  diceResult: number,
  stake: number
): { won: boolean; reward: number } {
  console.log(
    `[FOOTBALL] calculateFootballWinnings: guess=${guess}, diceResult=${diceResult}, stake=${stake}`
  );

  const won = guess === diceResult;
  let reward = 0;

  if (won) {
    // Win = stake × 4
    reward = stake * 4;
  }

  console.log(`[FOOTBALL] Winnings calculated: won=${won}, reward=${reward}`);
  return { won, reward };
}

/**
 * Get football game statistics for a user
 */
export async function getFootballStats(userId: string): Promise<{
  totalGames: number;
  totalWins: number;
  totalWinnings: number;
}> {
  console.log(`[FOOTBALL] getFootballStats called for userId=${userId}`);

  if (!database) throw new Error("Firebase not initialized");

  const gamesRef = ref(database, GAMES_PATH);
  const snapshot = await get(gamesRef);

  if (!snapshot.exists()) {
    console.log(`[FOOTBALL] No games found for userId=${userId}`);
    return { totalGames: 0, totalWins: 0, totalWinnings: 0 };
  }

  const games = snapshot.val();
  let totalGames = 0;
  let totalWins = 0;
  let totalWinnings = 0;

  for (const gameId in games) {
    const game = games[gameId] as FootballGameState;
    if (game.userId === userId && game.status === "completed") {
      totalGames++;
      if (game.reward && game.reward > 0) {
        totalWins++;
        totalWinnings += game.reward;
      }
    }
  }

  console.log(
    `[FOOTBALL] Stats for userId=${userId}: totalGames=${totalGames}, totalWins=${totalWins}, totalWinnings=${totalWinnings}`
  );
  return { totalGames, totalWins, totalWinnings };
}

/**
 * Get recent football games for a user
 */
export async function getRecentFootballGames(
  userId: string,
  limit: number = 10
): Promise<FootballGameState[]> {
  console.log(
    `[FOOTBALL] getRecentFootballGames called for userId=${userId}, limit=${limit}`
  );

  if (!database) throw new Error("Firebase not initialized");

  const gamesRef = ref(database, GAMES_PATH);
  const snapshot = await get(gamesRef);

  if (!snapshot.exists()) {
    console.log(`[FOOTBALL] No games found for userId=${userId}`);
    return [];
  }

  const games = snapshot.val();
  const userGames: FootballGameState[] = [];

  for (const gameId in games) {
    const game = games[gameId] as FootballGameState;
    if (game.userId === userId && game.status === "completed") {
      userGames.push(game);
    }
  }

  // Sort by completion time (newest first) and limit results
  userGames.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  const limitedGames = userGames.slice(0, limit);

  console.log(
    `[FOOTBALL] Found ${limitedGames.length} recent games for userId=${userId}`
  );
  return limitedGames;
}
