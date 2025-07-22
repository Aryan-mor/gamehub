"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveGamesForUser = exports.deleteGame = exports.cancelGame = exports.finishGame = exports.updateGame = exports.getGame = exports.joinGame = exports.createGame = void 0;
const types_1 = require("./types");
const logger_1 = require("./logger");
const database_1 = require("firebase/database");
const firebase_1 = require("./firebase");
const createGame = async (gameType, creator, stake) => {
    (0, logger_1.logFunctionStart)('createGame', { gameType, creatorId: creator.id, stake });
    try {
        if (!firebase_1.database)
            throw new Error('Firebase not initialized');
        const gameId = `${gameType}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const game = {
            id: gameId,
            type: gameType,
            status: types_1.GameStatus.WAITING,
            players: [creator],
            currentPlayerIndex: 0,
            stake,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            data: {},
        };
        const gameRef = (0, database_1.ref)(firebase_1.database, `games/${gameId}`);
        await (0, database_1.set)(gameRef, game);
        (0, logger_1.logFunctionEnd)('createGame', game, { gameType, creatorId: creator.id, stake });
        return game;
    }
    catch (error) {
        (0, logger_1.logError)('createGame', error, { gameType, creatorId: creator.id, stake });
        throw error;
    }
};
exports.createGame = createGame;
const joinGame = async (gameId, player) => {
    (0, logger_1.logFunctionStart)('joinGame', { gameId, playerId: player.id });
    try {
        if (!firebase_1.database)
            throw new Error('Firebase not initialized');
        const gameRef = (0, database_1.ref)(firebase_1.database, `games/${gameId}`);
        const snapshot = await (0, database_1.get)(gameRef);
        if (!snapshot.exists()) {
            throw new Error('Game not found');
        }
        const game = snapshot.val();
        if (game.status !== types_1.GameStatus.WAITING) {
            throw new Error('Game is not waiting for players');
        }
        if (game.players.length >= 2) {
            throw new Error('Game is full');
        }
        if (game.players.some(p => p.id === player.id)) {
            throw new Error('Player already in game');
        }
        const updatedGame = {
            ...game,
            players: [...game.players, player],
            status: types_1.GameStatus.PLAYING,
            updatedAt: Date.now(),
        };
        await (0, database_1.set)(gameRef, updatedGame);
        (0, logger_1.logFunctionEnd)('joinGame', updatedGame, { gameId, playerId: player.id });
        return updatedGame;
    }
    catch (error) {
        (0, logger_1.logError)('joinGame', error, { gameId, playerId: player.id });
        throw error;
    }
};
exports.joinGame = joinGame;
const getGame = async (gameId) => {
    (0, logger_1.logFunctionStart)('getGame', { gameId });
    try {
        if (!firebase_1.database)
            throw new Error('Firebase not initialized');
        const gameRef = (0, database_1.ref)(firebase_1.database, `games/${gameId}`);
        const snapshot = await (0, database_1.get)(gameRef);
        if (!snapshot.exists()) {
            (0, logger_1.logFunctionEnd)('getGame', null, { gameId });
            return null;
        }
        const game = snapshot.val();
        (0, logger_1.logFunctionEnd)('getGame', game, { gameId });
        return game;
    }
    catch (error) {
        (0, logger_1.logError)('getGame', error, { gameId });
        throw error;
    }
};
exports.getGame = getGame;
const updateGame = async (gameId, updates) => {
    (0, logger_1.logFunctionStart)('updateGame', { gameId, updates });
    try {
        if (!firebase_1.database)
            throw new Error('Firebase not initialized');
        const gameRef = (0, database_1.ref)(firebase_1.database, `games/${gameId}`);
        const updateData = {
            ...updates,
            updatedAt: Date.now(),
        };
        await (0, database_1.update)(gameRef, updateData);
        const updatedGame = await (0, exports.getGame)(gameId);
        if (!updatedGame) {
            throw new Error('Game not found after update');
        }
        (0, logger_1.logFunctionEnd)('updateGame', updatedGame, { gameId, updates });
        return updatedGame;
    }
    catch (error) {
        (0, logger_1.logError)('updateGame', error, { gameId, updates });
        throw error;
    }
};
exports.updateGame = updateGame;
const finishGame = async (gameId, result) => {
    (0, logger_1.logFunctionStart)('finishGame', { gameId, result });
    try {
        if (!firebase_1.database)
            throw new Error('Firebase not initialized');
        const cleanResult = {
            winner: result.winner || null,
            loser: result.loser || null,
            isDraw: result.isDraw,
            coinsWon: result.coinsWon,
            coinsLost: result.coinsLost,
        };
        const gameRef = (0, database_1.ref)(firebase_1.database, `games/${gameId}`);
        await (0, database_1.update)(gameRef, {
            status: types_1.GameStatus.FINISHED,
            updatedAt: Date.now(),
            result: cleanResult,
        });
        (0, logger_1.logFunctionEnd)('finishGame', {}, { gameId, result });
    }
    catch (error) {
        (0, logger_1.logError)('finishGame', error, { gameId, result });
        throw error;
    }
};
exports.finishGame = finishGame;
const cancelGame = async (gameId) => {
    (0, logger_1.logFunctionStart)('cancelGame', { gameId });
    try {
        if (!firebase_1.database)
            throw new Error('Firebase not initialized');
        const gameRef = (0, database_1.ref)(firebase_1.database, `games/${gameId}`);
        await (0, database_1.update)(gameRef, {
            status: types_1.GameStatus.CANCELLED,
            updatedAt: Date.now(),
        });
        (0, logger_1.logFunctionEnd)('cancelGame', {}, { gameId });
    }
    catch (error) {
        (0, logger_1.logError)('cancelGame', error, { gameId });
        throw error;
    }
};
exports.cancelGame = cancelGame;
const deleteGame = async (gameId) => {
    (0, logger_1.logFunctionStart)('deleteGame', { gameId });
    try {
        if (!firebase_1.database)
            throw new Error('Firebase not initialized');
        const gameRef = (0, database_1.ref)(firebase_1.database, `games/${gameId}`);
        await (0, database_1.remove)(gameRef);
        (0, logger_1.logFunctionEnd)('deleteGame', {}, { gameId });
    }
    catch (error) {
        (0, logger_1.logError)('deleteGame', error, { gameId });
        throw error;
    }
};
exports.deleteGame = deleteGame;
const getActiveGamesForUser = async (userId) => {
    (0, logger_1.logFunctionStart)('getActiveGamesForUser', { userId });
    try {
        if (!firebase_1.database)
            throw new Error('Firebase not initialized');
        const gamesRef = (0, database_1.ref)(firebase_1.database, 'games');
        const snapshot = await (0, database_1.get)(gamesRef);
        if (!snapshot.exists()) {
            (0, logger_1.logFunctionEnd)('getActiveGamesForUser', [], { userId });
            return [];
        }
        const games = snapshot.val();
        const userGames = Object.values(games).filter(game => game.players.some(p => p.id === userId) &&
            game.status !== types_1.GameStatus.FINISHED &&
            game.status !== types_1.GameStatus.CANCELLED);
        (0, logger_1.logFunctionEnd)('getActiveGamesForUser', userGames, { userId });
        return userGames;
    }
    catch (error) {
        (0, logger_1.logError)('getActiveGamesForUser', error, { userId });
        throw error;
    }
};
exports.getActiveGamesForUser = getActiveGamesForUser;
//# sourceMappingURL=gameService.js.map