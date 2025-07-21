import { ref, remove } from "firebase/database";
import { database } from "../core/firebase";

/**
 * Script to clear data for a specific user
 * Usage: npm run clear-user -- 123456789
 */
async function clearSpecificUser(userId: string) {
  if (!database) {
    console.error("Firebase not initialized");
    return;
  }

  if (!userId) {
    console.error("Please provide a user ID");
    console.log("Usage: npm run clear-user -- 123456789");
    return;
  }

  try {
    console.log(`🗑️ Clearing data for user ${userId}...`);

    // Clear user data
    const userRef = ref(database, `users/${userId}`);
    await remove(userRef);
    console.log("✅ Cleared user data");

    // Clear user transfers
    // Note: This would need more complex logic to filter by userId
    console.log("⚠️ Note: Transfers need manual cleanup");

    // Clear user stats
    const userStatsRef = ref(database, `userStatsByGame/xo/${userId}`);
    await remove(userStatsRef);
    console.log("✅ Cleared user stats");

    // Clear head-to-head records
    const h2hRef = ref(database, `headToHead/xo/${userId}`);
    await remove(h2hRef);
    console.log("✅ Cleared head-to-head records");

    console.log(`🎉 User ${userId} data cleared successfully!`);
  } catch (error) {
    console.error("❌ Error clearing user data:", error);
  }
}

// Get user ID from command line arguments
const userId = process.argv[2];
clearSpecificUser(userId);
