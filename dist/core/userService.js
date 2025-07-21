"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUserProfile = exports.setLastFreeCoinAt = exports.canClaimDaily = exports.deductCoins = exports.addCoins = exports.getUser = void 0;
const logger_1 = require("./logger");
const database_1 = require("firebase/database");
const firebase_1 = require("./firebase");
const getUser = async (userId) => {
    (0, logger_1.logFunctionStart)('getUser', { userId });
    try {
        if (!firebase_1.database)
            throw new Error('Firebase not initialized');
        const userRef = (0, database_1.ref)(firebase_1.database, `users/${userId}`);
        const snapshot = await (0, database_1.get)(userRef);
        if (!snapshot.exists()) {
            const newUser = {
                id: userId,
                coins: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            await (0, database_1.set)(userRef, newUser);
            (0, logger_1.logFunctionEnd)('getUser', newUser, { userId });
            return newUser;
        }
        const userData = snapshot.val();
        (0, logger_1.logFunctionEnd)('getUser', userData, { userId });
        return userData;
    }
    catch (error) {
        (0, logger_1.logError)('getUser', error, { userId });
        throw error;
    }
};
exports.getUser = getUser;
const addCoins = async (userId, amount, reason) => {
    (0, logger_1.logFunctionStart)('addCoins', { userId, amount, reason });
    try {
        if (!firebase_1.database)
            throw new Error('Firebase not initialized');
        const userRef = (0, database_1.ref)(firebase_1.database, `users/${userId}`);
        const snapshot = await (0, database_1.get)(userRef);
        const currentCoins = snapshot.exists() ? (snapshot.val()?.coins || 0) : 0;
        const newCoins = currentCoins + amount;
        await (0, database_1.update)(userRef, {
            coins: newCoins,
            updatedAt: Date.now(),
        });
        (0, logger_1.logFunctionEnd)('addCoins', { newBalance: newCoins }, { userId, amount, reason });
    }
    catch (error) {
        (0, logger_1.logError)('addCoins', error, { userId, amount, reason });
        throw error;
    }
};
exports.addCoins = addCoins;
const deductCoins = async (userId, amount, reason) => {
    (0, logger_1.logFunctionStart)('deductCoins', { userId, amount, reason });
    try {
        if (!firebase_1.database)
            throw new Error('Firebase not initialized');
        const userRef = (0, database_1.ref)(firebase_1.database, `users/${userId}`);
        const snapshot = await (0, database_1.get)(userRef);
        const currentCoins = snapshot.exists() ? (snapshot.val()?.coins || 0) : 0;
        if (currentCoins >= amount) {
            const newCoins = currentCoins - amount;
            await (0, database_1.update)(userRef, {
                coins: newCoins,
                updatedAt: Date.now(),
            });
            (0, logger_1.logFunctionEnd)('deductCoins', { success: true }, { userId, amount, reason });
            return true;
        }
        (0, logger_1.logFunctionEnd)('deductCoins', { success: false }, { userId, amount, reason });
        return false;
    }
    catch (error) {
        (0, logger_1.logError)('deductCoins', error, { userId, amount, reason });
        throw error;
    }
};
exports.deductCoins = deductCoins;
const canClaimDaily = async (userId) => {
    (0, logger_1.logFunctionStart)('canClaimDaily', { userId });
    try {
        const user = await (0, exports.getUser)(userId);
        const now = Date.now();
        const lastClaim = user.lastFreeCoinAt || 0;
        const dayInMs = 24 * 60 * 60 * 1000;
        const timeSinceLastClaim = now - lastClaim;
        const canClaim = timeSinceLastClaim >= dayInMs;
        const nextClaimIn = canClaim ? 0 : dayInMs - timeSinceLastClaim;
        const result = { canClaim, nextClaimIn };
        (0, logger_1.logFunctionEnd)('canClaimDaily', result, { userId });
        return result;
    }
    catch (error) {
        (0, logger_1.logError)('canClaimDaily', error, { userId });
        throw error;
    }
};
exports.canClaimDaily = canClaimDaily;
const setLastFreeCoinAt = async (userId) => {
    (0, logger_1.logFunctionStart)('setLastFreeCoinAt', { userId });
    try {
        if (!firebase_1.database)
            throw new Error('Firebase not initialized');
        const userRef = (0, database_1.ref)(firebase_1.database, `users/${userId}`);
        await (0, database_1.update)(userRef, {
            lastFreeCoinAt: Date.now(),
            updatedAt: Date.now(),
        });
        (0, logger_1.logFunctionEnd)('setLastFreeCoinAt', {}, { userId });
    }
    catch (error) {
        (0, logger_1.logError)('setLastFreeCoinAt', error, { userId });
        throw error;
    }
};
exports.setLastFreeCoinAt = setLastFreeCoinAt;
const setUserProfile = async (userId, username, name) => {
    (0, logger_1.logFunctionStart)('setUserProfile', { userId, username, name });
    try {
        if (!firebase_1.database)
            throw new Error('Firebase not initialized');
        const updateData = {
            updatedAt: Date.now(),
        };
        if (username !== undefined)
            updateData.username = username;
        if (name !== undefined)
            updateData.name = name;
        const userRef = (0, database_1.ref)(firebase_1.database, `users/${userId}`);
        await (0, database_1.update)(userRef, updateData);
        (0, logger_1.logFunctionEnd)('setUserProfile', {}, { userId, username, name });
    }
    catch (error) {
        (0, logger_1.logError)('setUserProfile', error, { userId, username, name });
        throw error;
    }
};
exports.setUserProfile = setUserProfile;
//# sourceMappingURL=userService.js.map