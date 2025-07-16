import { ref, set, get } from "firebase/database";
import { database } from "../../lib/firebase";
import { adjustCoins } from "../../lib/coinService";
import { requireUserStartedAndBalance } from "../../lib/userMiddleware";
import publicConfig from "../publicConfig";

export interface BowlingGameState {
  id: string;
  userId: string;
  stake: number;
  result?: number;
  reward?: number;
  fee?: number;
  status: "pending" | "completed";
  createdAt: number;
  completedAt?: number;
}

export interface BowlingGameResult {
  won: boolean;
  reward: number;
  fee: number;
  message: string;
}

export const BOWLING_STAKES = [2, 5, 10, 20] as const;
export type BowlingStake = (typeof BOWLING_STAKES)[number];

const GAMES_PATH = "bowlingGames";

/**
 * Create a new bowling game
 */
export async function createBowlingGame(
  userId: string,
  stake: BowlingStake,
  chatId?: string
): Promise<BowlingGameState> {
  console.log(
    `[BOWLING] createBowlingGame called: userId=${userId}, stake=${stake}`
  );

  if (!database) throw new Error("Firebase not initialized");

  // Check if user has started the bot and has sufficient balance
  console.log(
    `[BOWLING] Checking balance for userId=${userId}, required=${stake}`
  );
  await requireUserStartedAndBalance(userId, stake, chatId);

  const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
  console.log(`[BOWLING] Generated gameId: ${gameId}`);

  // Deduct stake
  console.log(`[BOWLING] Deducting stake: userId=${userId}, amount=${stake}`);
  await adjustCoins(userId, -stake, "bowling_stake", gameId);

  const gameState: BowlingGameState = {
    id: gameId,
    userId,
    stake,
    status: "pending",
    createdAt: Date.now(),
  };

  console.log(
    `[BOWLING] Game state to save:`,
    JSON.stringify(gameState, null, 2)
  );
  await set(ref(database, `${GAMES_PATH}/${gameId}`), gameState);
  console.log(
    `[BOWLING] Created game ${gameId} with stake ${stake} for user ${userId}`
  );

  return gameState;
}

/**
 * Process bowling dice result and calculate winnings
 */
export async function processBowlingResult(
  gameId: string,
  diceResult: number
): Promise<BowlingGameResult> {
  console.log(
    `[BOWLING] processBowlingResult called: gameId=${gameId}, diceResult=${diceResult}`
  );

  if (!database) throw new Error("Firebase not initialized");

  const gameRef = ref(database, `${GAMES_PATH}/${gameId}`);
  console.log(`[BOWLING] Fetching game from path: ${GAMES_PATH}/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    console.log(`[BOWLING] Game not found: ${gameId}`);
    throw new Error("Game not found");
  }

  const gameState: BowlingGameState = snapshot.val();
  console.log(
    `[BOWLING] Retrieved game state:`,
    JSON.stringify(gameState, null, 2)
  );

  if (gameState.status !== "pending") {
    console.log(`[BOWLING] Game already completed: status=${gameState.status}`);
    throw new Error("Game already completed");
  }

  console.log(
    `[BOWLING] Calculating winnings: diceResult=${diceResult}, stake=${gameState.stake}`
  );
  const { won, reward } = calculateBowlingWinnings(diceResult, gameState.stake);
  console.log(`[BOWLING] Winnings calculated: won=${won}, reward=${reward}`);

  // Update game state
  gameState.result = diceResult;
  gameState.reward = reward;
  gameState.status = "completed";
  gameState.completedAt = Date.now();

  console.log(
    `[BOWLING] Updated game state:`,
    JSON.stringify(gameState, null, 2)
  );
  await set(gameRef, gameState);

  // Handle coin transfers
  if (won && reward > 0) {
    console.log(
      `[BOWLING] User won, crediting ${reward} coins to userId=${gameState.userId}`
    );
    await adjustCoins(gameState.userId, reward, "bowling_win", gameId);
  } else if (reward > 0) {
    // Refund case (2-3 pins)
    console.log(
      `[BOWLING] User gets refund, crediting ${reward} coins to userId=${gameState.userId}`
    );
    await adjustCoins(gameState.userId, reward, "bowling_refund", gameId);
  }

  // Generate result message
  const outcome = getBowlingOutcome(diceResult);
  const message = generateBowlingMessage(diceResult, outcome, reward);

  console.log(
    `[BOWLING] Game ${gameId} completed: won=${won}, reward=${reward}`
  );
  return { won, reward, message };
}

/**
 * Calculate bowling winnings based on dice result and stake
 */
function calculateBowlingWinnings(
  diceResult: number,
  stake: number
): { won: boolean; reward: number } {
  console.log(
    `[BOWLING] calculateBowlingWinnings: diceResult=${diceResult}, stake=${stake}`
  );

  let won = false;
  let reward = 0;

  if (diceResult === 6) {
    // Strike - Jackpot Win: 4× stake (minus botConfig.public.botFeePercent fee)
    won = true;
    const grossReward = stake * 4;
    reward = grossReward;
    console.log(
      `[BOWLING] Strike! grossReward=${grossReward}, netReward=${reward}`
    );
  } else if (diceResult === 4 || diceResult === 5) {
    // Great Roll - Win: 2× stake (minus botConfig.public.botFeePercent fee)
    won = true;
    const grossReward = stake * 2;
    reward = grossReward;
    console.log(
      `[BOWLING] Great roll! grossReward=${grossReward}, netReward=${reward}`
    );
  } else if (diceResult === 2 || diceResult === 3) {
    // Moderate - Refund: Return stake
    won = false;
    reward = stake;
    console.log(`[BOWLING] Moderate roll, refunding stake: ${stake}`);
  } else {
    // Weak Hit - Lose: No reward
    won = false;
    reward = 0;
    console.log(`[BOWLING] Weak hit, no reward`);
  }

  return { won, reward };
}

/**
 * Get bowling outcome description based on dice result
 */
function getBowlingOutcome(diceResult: number): string {
  switch (diceResult) {
    case 6:
      return "🎯 Strike";
    case 4:
    case 5:
      return "🏆 Great Roll";
    case 2:
    case 3:
      return "🔄 Refund";
    case 1:
      return "💔 Weak Hit";
    default:
      return "❓ Unknown";
  }
}

/**
 * Generate bowling result message
 */
function generateBowlingMessage(
  diceResult: number,
  outcome: string,
  reward: number
): string {
  const pinsHit = diceResult;
  const rewardText = reward > 0 ? `+${reward} Coins` : "No reward";

  return `🎳 You knocked down ${pinsHit} pins!\n🏆 Outcome: ${outcome}\n🎁 Reward: ${rewardText}`;
}

/**
 * Get bowling statistics for a user
 */
export async function getBowlingStats(userId: string): Promise<{
  totalGames: number;
  totalWins: number;
  totalWinnings: number;
}> {
  console.log(`[BOWLING] getBowlingStats called for userId=${userId}`);

  if (!database) throw new Error("Firebase not initialized");

  const gamesRef = ref(database, GAMES_PATH);
  const snapshot = await get(gamesRef);

  if (!snapshot.exists()) {
    console.log(`[BOWLING] No bowling games found for userId=${userId}`);
    return { totalGames: 0, totalWins: 0, totalWinnings: 0 };
  }

  const games = snapshot.val();
  let totalGames = 0;
  let totalWins = 0;
  let totalWinnings = 0;

  for (const gameId in games) {
    const game = games[gameId] as BowlingGameState;
    if (game.userId === userId && game.status === "completed") {
      totalGames++;
      if (game.reward && game.reward > game.stake) {
        totalWins++;
      }
      if (game.reward) {
        totalWinnings += game.reward;
      }
    }
  }

  console.log(
    `[BOWLING] Stats for userId=${userId}: games=${totalGames}, wins=${totalWins}, winnings=${totalWinnings}`
  );

  return { totalGames, totalWins, totalWinnings };
}

/**
 * Get recent bowling games for a user
 */
export async function getRecentBowlingGames(
  userId: string,
  limit: number = 10
): Promise<BowlingGameState[]> {
  console.log(
    `[BOWLING] getRecentBowlingGames called for userId=${userId}, limit=${limit}`
  );

  if (!database) throw new Error("Firebase not initialized");

  const gamesRef = ref(database, GAMES_PATH);
  const snapshot = await get(gamesRef);

  if (!snapshot.exists()) {
    console.log(`[BOWLING] No bowling games found for userId=${userId}`);
    return [];
  }

  const games = snapshot.val();
  const userGames: BowlingGameState[] = [];

  for (const gameId in games) {
    const game = games[gameId] as BowlingGameState;
    if (game.userId === userId && game.status === "completed") {
      userGames.push(game);
    }
  }

  // Sort by completion time (most recent first) and limit results
  userGames.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  const recentGames = userGames.slice(0, limit);

  console.log(
    `[BOWLING] Found ${recentGames.length} recent games for userId=${userId}`
  );

  return recentGames;
}
