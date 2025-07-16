import { ref, get, set } from "firebase/database";
import { database } from "../../lib/firebase";

// User stats structure for a game
export interface GameStats {
  totalWins: number;
  totalGames: number;
}

// --- USER STATS BY GAME ---
async function getUserStatsByGame(
  gameType: string,
  userId: string
): Promise<GameStats> {
  if (!database) throw new Error("Firebase not initialized");
  const statsRef = ref(database, `userStatsByGame/${gameType}/${userId}`);
  const snap = await get(statsRef);
  if (snap.exists()) return snap.val();
  return { totalWins: 0, totalGames: 0 };
}

async function setUserStatsByGame(
  gameType: string,
  userId: string,
  stats: GameStats
): Promise<void> {
  if (!database) throw new Error("Firebase not initialized");
  await set(ref(database, `userStatsByGame/${gameType}/${userId}`), stats);
}

// --- HEAD TO HEAD ---
async function getHeadToHead(
  gameType: string,
  userId: string,
  opponentId: string
): Promise<number> {
  if (!database) throw new Error("Firebase not initialized");
  const h2hRef = ref(
    database,
    `headToHead/${gameType}/${userId}/${opponentId}`
  );
  const snap = await get(h2hRef);
  if (snap.exists()) return snap.val();
  return 0;
}

async function setHeadToHead(
  gameType: string,
  userId: string,
  opponentId: string,
  wins: number
): Promise<void> {
  if (!database) throw new Error("Firebase not initialized");
  await set(
    ref(database, `headToHead/${gameType}/${userId}/${opponentId}`),
    wins
  );
}

// --- RECORD WIN ---
export async function recordWin(
  winnerId: string,
  loserId: string,
  gameType: string
): Promise<void> {
  // Update winner stats
  const winnerStats = await getUserStatsByGame(gameType, winnerId);
  winnerStats.totalWins++;
  winnerStats.totalGames++;
  await setUserStatsByGame(gameType, winnerId, winnerStats);

  // Update loser stats
  const loserStats = await getUserStatsByGame(gameType, loserId);
  loserStats.totalGames++;
  await setUserStatsByGame(gameType, loserId, loserStats);

  // Update head-to-head
  const prevWins = await getHeadToHead(gameType, winnerId, loserId);
  await setHeadToHead(gameType, winnerId, loserId, prevWins + 1);
}

// --- RECORD DRAW ---
export async function recordDraw(
  player1Id: string,
  player2Id: string,
  gameType: string
): Promise<void> {
  // Update both players' stats
  const stats1 = await getUserStatsByGame(gameType, player1Id);
  stats1.totalGames++;
  await setUserStatsByGame(gameType, player1Id, stats1);

  const stats2 = await getUserStatsByGame(gameType, player2Id);
  stats2.totalGames++;
  await setUserStatsByGame(gameType, player2Id, stats2);
}

// --- GET USER STATISTICS ---
export async function getUserStatistics(
  userId: string,
  gameType: string
): Promise<GameStats> {
  return getUserStatsByGame(gameType, userId);
}

// --- GET HEAD TO HEAD RECORD ---
export async function getHeadToHeadRecord(
  user1Id: string,
  user2Id: string,
  gameType: string
): Promise<{ user1Wins: number; user2Wins: number }> {
  const user1Wins = await getHeadToHead(gameType, user1Id, user2Id);
  const user2Wins = await getHeadToHead(gameType, user2Id, user1Id);
  return { user1Wins, user2Wins };
}

// --- FORMAT STATS MESSAGE ---
export async function formatStatsMessage(
  winnerId: string,
  loserId: string,
  winnerName: string,
  loserName: string,
  gameType: string
): Promise<string> {
  const winnerStats = await getUserStatsByGame(gameType, winnerId);
  const headToHead = await getHeadToHeadRecord(winnerId, loserId, gameType);
  const totalWinsMessage = `🏆 ${winnerName} has won ${
    winnerStats.totalWins
  } ${gameType.toUpperCase()} games total`;
  const headToHeadMessage = `⚔️ ${winnerName} has beaten ${loserName} ${headToHead.user1Wins} times\n⚔️ ${loserName} has beaten ${winnerName} ${headToHead.user2Wins} times`;
  return `${totalWinsMessage}\n${headToHeadMessage}`;
}

// --- COIN SYSTEM ---
export interface UserCoinData {
  coins: number;
  lastFreeCoinAt?: number; // ms timestamp
  username?: string;
  name?: string;
}

const USER_COIN_PATH = "users";

/**
 * Get user coin data, auto-creating with 0 coins if missing.
 */
export async function getUser(id: string): Promise<UserCoinData> {
  if (!database) throw new Error("Firebase not initialized");
  const userRef = ref(database, `${USER_COIN_PATH}/${id}`);
  const snap = await get(userRef);
  if (snap.exists()) {
    return snap.val();
  } else {
    const data: UserCoinData = { coins: 0 };
    await set(userRef, data);
    return data;
  }
}

/**
 * Add coins to user and persist.
 */
export async function addCoins(
  id: string,
  amount: number,
  reason: string
): Promise<void> {
  if (!database) throw new Error("Firebase not initialized");
  const user = await getUser(id);
  user.coins += amount;
  await set(ref(database, `${USER_COIN_PATH}/${id}`), user);
  // Log the grant
  console.log(`[COIN] Grant: userId=${id} amount=${amount} reason=${reason}`);
}

/**
 * Set last free coin claim timestamp.
 */
export async function setLastFreeCoinAt(
  id: string,
  timestamp: number
): Promise<void> {
  if (!database) throw new Error("Firebase not initialized");
  const user = await getUser(id);
  user.lastFreeCoinAt = timestamp;
  await set(ref(database, `${USER_COIN_PATH}/${id}`), user);
}

/**
 * Check if user can claim daily coins (24h cooldown).
 * Returns: { canClaim: boolean, nextClaimIn: number }
 */
export async function canClaimDaily(
  id: string
): Promise<{ canClaim: boolean; nextClaimIn: number }> {
  const user = await getUser(id);
  const now = Date.now();
  if (!user.lastFreeCoinAt) return { canClaim: true, nextClaimIn: 0 };
  const elapsed = now - user.lastFreeCoinAt;
  const DAY = 24 * 60 * 60 * 1000;
  if (elapsed >= DAY) return { canClaim: true, nextClaimIn: 0 };
  return { canClaim: false, nextClaimIn: DAY - elapsed };
}

export async function setUserProfile(
  id: string,
  username?: string,
  name?: string
): Promise<void> {
  if (!database) throw new Error("Firebase not initialized");
  const user = await getUser(id);
  if (username) user.username = username;
  if (name) user.name = name;
  await set(ref(database, `${USER_COIN_PATH}/${id}`), user);
}
