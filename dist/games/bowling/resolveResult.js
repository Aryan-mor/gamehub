"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBowlingResult = void 0;
const logger_1 = require("../../core/logger");
const gameService_1 = require("../../core/gameService");
const resolveBowlingResult = async (gameId) => {
    (0, logger_1.logFunctionStart)('resolveBowlingResult', { gameId });
    try {
        const game = await (0, gameService_1.getGame)(gameId);
        if (!game) {
            const result = { success: false, error: 'Game not found.' };
            (0, logger_1.logFunctionEnd)('resolveBowlingResult', result, { gameId });
            return result;
        }
        if (game.status !== 'finished') {
            const result = { success: false, error: 'Game is not finished.' };
            (0, logger_1.logFunctionEnd)('resolveBowlingResult', result, { gameId });
            return result;
        }
        const gameData = game.data;
        if (!gameData) {
            const result = { success: false, error: 'Game data not found.' };
            (0, logger_1.logFunctionEnd)('resolveBowlingResult', result, { gameId });
            return result;
        }
        const result = {
            isWon: gameData.isWon,
            diceResult: gameData.diceResult,
            outcome: gameData.diceResult === 6 ? 'Strike! 🎯' :
                gameData.diceResult >= 4 ? 'Great Roll! 🎳' :
                    gameData.diceResult >= 2 ? 'Moderate Hit' : 'Weak Hit',
            reward: gameData.reward,
            fee: gameData.fee,
            coinsWon: game.result?.coinsWon || 0,
            coinsLost: game.result?.coinsLost || 0,
        };
        const response = { success: true, result };
        (0, logger_1.logFunctionEnd)('resolveBowlingResult', response, { gameId });
        return response;
    }
    catch (error) {
        (0, logger_1.logError)('resolveBowlingResult', error, { gameId });
        return { success: false, error: 'Failed to resolve bowling result.' };
    }
};
exports.resolveBowlingResult = resolveBowlingResult;
//# sourceMappingURL=resolveResult.js.map