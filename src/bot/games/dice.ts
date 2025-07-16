import { ref, set, get, push } from "firebase/database";
import { database } from "../../lib/firebase";
import { adjustCoins, requireBalance } from "../../lib/coinService";
import publicConfig from "../publicConfig";

export interface DiceGameState {
  id: string;
  userId: string;
  stake: number;
  guess: string;
  result?: number;
  reward?: number;
  status: "pending" | "completed";
  createdAt: number;
  completedAt?: number;
}

export interface DiceGameResult {
  won: boolean;
  reward: number;
  fee: number;
  message: string;
}

export const DICE_STAKES = [2, 5, 10, 20] as const;
export type DiceStake = (typeof DICE_STAKES)[number];

export const DICE_GUESSES = {
  exact: ["1", "2", "3", "4", "5", "6"],
  ranges: ["ODD", "EVEN", "1-3", "4-6"],
} as const;

const GAMES_PATH = "diceGames";
const TRANSFERS_PATH = "transfers";

/**
 * Create a new dice game
 */
export async function createDiceGame(
  userId: string,
  stake: DiceStake
): Promise<DiceGameState> {
  console.log(`[DICE] createDiceGame called: userId=${userId}, stake=${stake}`);

  if (!database) throw new Error("Firebase not initialized");

  // Check balance
  console.log(
    `[DICE] Checking balance for userId=${userId}, required=${stake}`
  );
  const hasBalance = await requireBalance(userId, stake);
  console.log(`[DICE] Balance check result: hasBalance=${hasBalance}`);

  if (!hasBalance) {
    throw new Error("Insufficient coins");
  }

  const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
  console.log(`[DICE] Generated gameId: ${gameId}`);

  // Deduct stake
  console.log(`[DICE] Deducting stake: userId=${userId}, amount=${stake}`);
  await adjustCoins(userId, -stake, "dice_stake", gameId);

  const gameState: DiceGameState = {
    id: gameId,
    userId,
    stake,
    guess: "",
    status: "pending",
    createdAt: Date.now(),
  };

  console.log(`[DICE] Game state to save:`, JSON.stringify(gameState, null, 2));
  await set(ref(database, `${GAMES_PATH}/${gameId}`), gameState);
  console.log(
    `[DICE] Created game ${gameId} with stake ${stake} for user ${userId}`
  );

  return gameState;
}

/**
 * Set the user's guess for a dice game
 */
export async function setDiceGuess(
  gameId: string,
  guess: string
): Promise<DiceGameState> {
  console.log(`[DICE] setDiceGuess called: gameId=${gameId}, guess=${guess}`);

  if (!database) throw new Error("Firebase not initialized");

  const gameRef = ref(database, `${GAMES_PATH}/${gameId}`);
  console.log(`[DICE] Fetching game from path: ${GAMES_PATH}/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    console.log(`[DICE] Game not found: ${gameId}`);
    throw new Error("Game not found");
  }

  const gameState: DiceGameState = snapshot.val();
  console.log(
    `[DICE] Retrieved game state:`,
    JSON.stringify(gameState, null, 2)
  );

  if (gameState.status !== "pending") {
    console.log(`[DICE] Game already completed: status=${gameState.status}`);
    throw new Error("Game already completed");
  }

  gameState.guess = guess;
  console.log(
    `[DICE] Updated game state with guess:`,
    JSON.stringify(gameState, null, 2)
  );
  await set(gameRef, gameState);

  console.log(`[DICE] Set guess ${guess} for game ${gameId}`);
  return gameState;
}

/**
 * Process dice roll result and calculate winnings
 */
export async function processDiceResult(
  gameId: string,
  diceResult: number
): Promise<DiceGameResult> {
  console.log(
    `[DICE] processDiceResult called: gameId=${gameId}, diceResult=${diceResult}`
  );

  if (!database) throw new Error("Firebase not initialized");

  const gameRef = ref(database, `${GAMES_PATH}/${gameId}`);
  console.log(`[DICE] Fetching game from path: ${GAMES_PATH}/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    console.log(`[DICE] Game not found: ${gameId}`);
    throw new Error("Game not found");
  }

  const gameState: DiceGameState = snapshot.val();
  console.log(
    `[DICE] Retrieved game state:`,
    JSON.stringify(gameState, null, 2)
  );

  if (gameState.status !== "pending") {
    console.log(`[DICE] Game already completed: status=${gameState.status}`);
    throw new Error("Game already completed");
  }

  console.log(
    `[DICE] Calculating winnings: guess=${gameState.guess}, diceResult=${diceResult}, stake=${gameState.stake}`
  );
  const { won, reward } = calculateDiceWinnings(
    gameState.guess,
    diceResult,
    gameState.stake
  );
  console.log(`[DICE] Winnings calculated: won=${won}, reward=${reward}`);

  // Update game state
  gameState.result = diceResult;
  gameState.reward = reward;
  gameState.status = "completed";
  gameState.completedAt = Date.now();

  console.log(`[DICE] Updated game state:`, JSON.stringify(gameState, null, 2));
  await set(gameRef, gameState);

  // Process payout if won
  if (won && reward > 0) {
    console.log(
      `[DICE] Processing payout: userId=${gameState.userId}, reward=${reward}, gameId=${gameId}`
    );
    await adjustCoins(gameState.userId, reward, "dice_win", gameId);
  } else {
    console.log(`[DICE] No payout - game lost or no reward`);
  }

  const message = getDiceResultText(
    won,
    reward,
    gameState.guess,
    diceResult,
    gameState.stake
  );

  console.log(`[DICE] Game ${gameId} completed: won=${won}, reward=${reward}`);

  return { won, reward, fee: 0, message };
}

/**
 * Calculate winnings based on guess and dice result
 */
function calculateDiceWinnings(
  guess: string,
  diceResult: number,
  stake: number
): { won: boolean; reward: number } {
  console.log(
    `[DICE] calculateDiceWinnings called: guess=${guess}, diceResult=${diceResult}, stake=${stake}`
  );

  let won = false;
  let multiplier = 0;

  // Check exact match (4x reward)
  if (guess === diceResult.toString()) {
    console.log(
      `[DICE] Exact match found: guess=${guess}, diceResult=${diceResult}`
    );
    won = true;
    multiplier = 4;
  }
  // Check ODD/EVEN (2x reward)
  else if (guess === "ODD" && diceResult % 2 === 1) {
    console.log(
      `[DICE] ODD match found: guess=${guess}, diceResult=${diceResult}`
    );
    won = true;
    multiplier = 2;
  } else if (guess === "EVEN" && diceResult % 2 === 0) {
    console.log(
      `[DICE] EVEN match found: guess=${guess}, diceResult=${diceResult}`
    );
    won = true;
    multiplier = 2;
  }
  // Check ranges (2x reward)
  else if (guess === "1-3" && diceResult >= 1 && diceResult <= 3) {
    console.log(
      `[DICE] Range 1-3 match found: guess=${guess}, diceResult=${diceResult}`
    );
    won = true;
    multiplier = 2;
  } else if (guess === "4-6" && diceResult >= 4 && diceResult <= 6) {
    console.log(
      `[DICE] Range 4-6 match found: guess=${guess}, diceResult=${diceResult}`
    );
    won = true;
    multiplier = 2;
  }

  if (!won) {
    console.log(
      `[DICE] No match found: guess=${guess}, diceResult=${diceResult}`
    );
    return { won: false, reward: 0 };
  }

  const totalReward = stake * multiplier;

  console.log(
    `[DICE] Winnings calculated: totalReward=${totalReward}, multiplier=${multiplier}`
  );

  return { won: true, reward: totalReward };
}

export function getDiceResultText(
  won: boolean,
  reward: number,
  guess: string,
  diceResult: number,
  stake: number
): string {
  const resultEmoji = won ? "🎉" : "😔";
  return won
    ? `${resultEmoji} **Congratulations! You won ${reward} coins!**\n\n🎯 Your guess: ${guess}\n🎲 Dice: ${diceResult}\n💰 Reward: ${reward} coins`
    : `${resultEmoji} **Better luck next time!**\n\n🎯 Your guess: ${guess}\n🎲 Dice: ${diceResult}\n💸 You lost ${stake} coins`;
}

/**
 * Get user's dice game statistics
 */
export async function getDiceStats(userId: string): Promise<{
  totalGames: number;
  totalWins: number;
  totalWinnings: number;
}> {
  if (!database) throw new Error("Firebase not initialized");

  const gamesRef = ref(database, GAMES_PATH);
  const snapshot = await get(gamesRef);

  if (!snapshot.exists()) {
    return { totalGames: 0, totalWins: 0, totalWinnings: 0 };
  }

  const games = snapshot.val();
  let totalGames = 0;
  let totalWins = 0;
  let totalWinnings = 0;

  for (const gameId in games) {
    const game: DiceGameState = games[gameId];
    if (game.userId === userId && game.status === "completed") {
      totalGames++;
      if (game.reward && game.reward > 0) {
        totalWins++;
        totalWinnings += game.reward;
      }
    }
  }

  return { totalGames, totalWins, totalWinnings };
}

/**
 * Get recent dice games for a user
 */
export async function getRecentDiceGames(
  userId: string,
  limit: number = 10
): Promise<DiceGameState[]> {
  if (!database) throw new Error("Firebase not initialized");

  const gamesRef = ref(database, GAMES_PATH);
  const snapshot = await get(gamesRef);

  if (!snapshot.exists()) {
    return [];
  }

  const games = snapshot.val();
  const userGames: DiceGameState[] = [];

  for (const gameId in games) {
    const game: DiceGameState = games[gameId];
    if (game.userId === userId) {
      userGames.push(game);
    }
  }

  // Sort by creation date (newest first) and limit
  return userGames.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}
