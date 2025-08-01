import { ref, remove } from "firebase/database";
import { database } from "../modules/core/firebase";

/**
 * Script to clear all user data from Firebase
 * WARNING: This will delete ALL user data including coins, stats, etc.
 * Only use for testing!
 */
async function clearAllUsers() {
  if (!database) {
    console.error("Firebase not initialized");
    return;
  }

  try {
    console.log("🗑️ Clearing all user data...");

    // Clear users collection
    const usersRef = ref(database, "users");
    await remove(usersRef);
    console.log("✅ Cleared all users");

    // Clear transfers collection
    const transfersRef = ref(database, "transfers");
    await remove(transfersRef);
    console.log("✅ Cleared all transfers");

    // Clear game stats
    const userStatsRef = ref(database, "userStatsByGame");
    await remove(userStatsRef);
    console.log("✅ Cleared all user stats");

    // Clear head-to-head records
    const h2hRef = ref(database, "headToHead");
    await remove(h2hRef);
    console.log("✅ Cleared all head-to-head records");

    // Clear game data
    const diceGamesRef = ref(database, "diceGames");
    await remove(diceGamesRef);
    console.log("✅ Cleared all dice games");

    const footballGamesRef = ref(database, "footballGames");
    await remove(footballGamesRef);
    console.log("✅ Cleared all football games");

    const basketballGamesRef = ref(database, "basketballGames");
    await remove(basketballGamesRef);
    console.log("✅ Cleared all basketball games");

    const bowlingGamesRef = ref(database, "bowlingGames");
    await remove(bowlingGamesRef);
    console.log("✅ Cleared all bowling games");

    console.log("🎉 All user data cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing user data:", error);
  }
}

// Run the script
clearAllUsers();
