// User statistics for X/O games
interface UserStats {
  totalWins: number;
  totalGames: number;
  headToHead: { [opponentId: string]: number }; // wins against specific opponents
}

// In-memory storage for user statistics
const userStats = new Map<string, UserStats>();

/**
 * Get or create user stats
 */
function getUserStats(userId: string): UserStats {
  if (!userStats.has(userId)) {
    userStats.set(userId, {
      totalWins: 0,
      totalGames: 0,
      headToHead: {},
    });
  }
  return userStats.get(userId)!;
}

/**
 * Record a win for a user
 */
export function recordWin(winnerId: string, loserId: string): void {
  const winnerStats = getUserStats(winnerId);
  const loserStats = getUserStats(loserId);

  // Update winner stats
  winnerStats.totalWins++;
  winnerStats.totalGames++;
  winnerStats.headToHead[loserId] = (winnerStats.headToHead[loserId] || 0) + 1;

  // Update loser stats (only total games, not wins)
  loserStats.totalGames++;

  // Save updated stats
  userStats.set(winnerId, winnerStats);
  userStats.set(loserId, loserStats);
}

/**
 * Record a draw for both users
 */
export function recordDraw(player1Id: string, player2Id: string): void {
  const player1Stats = getUserStats(player1Id);
  const player2Stats = getUserStats(player2Id);

  // Update total games for both players
  player1Stats.totalGames++;
  player2Stats.totalGames++;

  // Save updated stats
  userStats.set(player1Id, player1Stats);
  userStats.set(player2Id, player2Stats);
}

/**
 * Get user statistics
 */
export function getUserStatistics(userId: string): UserStats {
  return getUserStats(userId);
}

/**
 * Get head-to-head record between two users
 */
export function getHeadToHeadRecord(
  user1Id: string,
  user2Id: string
): {
  user1Wins: number;
  user2Wins: number;
} {
  const user1Stats = getUserStats(user1Id);
  const user2Stats = getUserStats(user2Id);

  return {
    user1Wins: user1Stats.headToHead[user2Id] || 0,
    user2Wins: user2Stats.headToHead[user1Id] || 0,
  };
}

/**
 * Format statistics message for display
 */
export function formatStatsMessage(
  winnerId: string,
  loserId: string,
  winnerName: string,
  loserName: string
): string {
  const winnerStats = getUserStats(winnerId);
  const headToHead = getHeadToHeadRecord(winnerId, loserId);

  const totalWinsMessage = `🏆 ${winnerName} has won ${winnerStats.totalWins} X/O games total`;
  const headToHeadMessage = `⚔️ ${winnerName} has beaten ${loserName} ${headToHead.user1Wins} times`;

  return `${totalWinsMessage}\n${headToHeadMessage}`;
}

/**
 * Get all user statistics (for debugging/admin purposes)
 */
export function getAllUserStats(): Map<string, UserStats> {
  return new Map(userStats);
}
