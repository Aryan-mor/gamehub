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
  const headToHeadMessage = `⚔️ ${winnerName} has beaten ${loserName} ${headToHead.user1Wins} times`;
  return `${totalWinsMessage}\n${headToHeadMessage}`;
}
