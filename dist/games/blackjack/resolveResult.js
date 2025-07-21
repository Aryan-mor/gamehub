"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBlackjackResult = void 0;
const logger_1 = require("../../core/logger");
const gameService_1 = require("../../core/gameService");
const resolveBlackjackResult = async (gameId) => {
    (0, logger_1.logFunctionStart)('resolveBlackjackResult', { gameId });
    try {
        const game = await (0, gameService_1.getGame)(gameId);
        if (!game) {
            const result = { success: false, error: 'Game not found.' };
            (0, logger_1.logFunctionEnd)('resolveBlackjackResult', result, { gameId });
            return result;
        }
        if (game.status !== 'finished') {
            const result = { success: false, error: 'Game is not finished.' };
            (0, logger_1.logFunctionEnd)('resolveBlackjackResult', result, { gameId });
            return result;
        }
        const gameData = game.data;
        if (!gameData) {
            const result = { success: false, error: 'Game data not found.' };
            (0, logger_1.logFunctionEnd)('resolveBlackjackResult', result, { gameId });
            return result;
        }
        const result = {
            isWon: gameData.result === 'win' || gameData.result === 'push',
            result: gameData.result,
            playerHand: gameData.playerHand,
            dealerHand: gameData.dealerHand,
            playerScore: 0,
            dealerScore: 0,
            reward: gameData.reward,
            fee: gameData.fee,
            coinsWon: game.result?.coinsWon || 0,
            coinsLost: game.result?.coinsLost || 0,
        };
        const response = { success: true, result };
        (0, logger_1.logFunctionEnd)('resolveBlackjackResult', response, { gameId });
        return response;
    }
    catch (error) {
        (0, logger_1.logError)('resolveBlackjackResult', error, { gameId });
        return { success: false, error: 'Failed to resolve blackjack result.' };
    }
};
exports.resolveBlackjackResult = resolveBlackjackResult;
//# sourceMappingURL=resolveResult.js.map