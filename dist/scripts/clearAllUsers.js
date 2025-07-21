"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("firebase/database");
const firebase_1 = require("../core/firebase");
async function clearAllUsers() {
    if (!firebase_1.database) {
        console.error("Firebase not initialized");
        return;
    }
    try {
        console.log("🗑️ Clearing all user data...");
        const usersRef = (0, database_1.ref)(firebase_1.database, "users");
        await (0, database_1.remove)(usersRef);
        console.log("✅ Cleared all users");
        const transfersRef = (0, database_1.ref)(firebase_1.database, "transfers");
        await (0, database_1.remove)(transfersRef);
        console.log("✅ Cleared all transfers");
        const userStatsRef = (0, database_1.ref)(firebase_1.database, "userStatsByGame");
        await (0, database_1.remove)(userStatsRef);
        console.log("✅ Cleared all user stats");
        const h2hRef = (0, database_1.ref)(firebase_1.database, "headToHead");
        await (0, database_1.remove)(h2hRef);
        console.log("✅ Cleared all head-to-head records");
        const diceGamesRef = (0, database_1.ref)(firebase_1.database, "diceGames");
        await (0, database_1.remove)(diceGamesRef);
        console.log("✅ Cleared all dice games");
        const footballGamesRef = (0, database_1.ref)(firebase_1.database, "footballGames");
        await (0, database_1.remove)(footballGamesRef);
        console.log("✅ Cleared all football games");
        const basketballGamesRef = (0, database_1.ref)(firebase_1.database, "basketballGames");
        await (0, database_1.remove)(basketballGamesRef);
        console.log("✅ Cleared all basketball games");
        const bowlingGamesRef = (0, database_1.ref)(firebase_1.database, "bowlingGames");
        await (0, database_1.remove)(bowlingGamesRef);
        console.log("✅ Cleared all bowling games");
        console.log("🎉 All user data cleared successfully!");
    }
    catch (error) {
        console.error("❌ Error clearing user data:", error);
    }
}
clearAllUsers();
//# sourceMappingURL=clearAllUsers.js.map