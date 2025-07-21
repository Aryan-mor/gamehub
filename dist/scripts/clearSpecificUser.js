"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("firebase/database");
const firebase_1 = require("../core/firebase");
async function clearSpecificUser(userId) {
    if (!firebase_1.database) {
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
        const userRef = (0, database_1.ref)(firebase_1.database, `users/${userId}`);
        await (0, database_1.remove)(userRef);
        console.log("✅ Cleared user data");
        console.log("⚠️ Note: Transfers need manual cleanup");
        const userStatsRef = (0, database_1.ref)(firebase_1.database, `userStatsByGame/xo/${userId}`);
        await (0, database_1.remove)(userStatsRef);
        console.log("✅ Cleared user stats");
        const h2hRef = (0, database_1.ref)(firebase_1.database, `headToHead/xo/${userId}`);
        await (0, database_1.remove)(h2hRef);
        console.log("✅ Cleared head-to-head records");
        console.log(`🎉 User ${userId} data cleared successfully!`);
    }
    catch (error) {
        console.error("❌ Error clearing user data:", error);
    }
}
const userId = process.argv[2];
clearSpecificUser(userId);
//# sourceMappingURL=clearSpecificUser.js.map