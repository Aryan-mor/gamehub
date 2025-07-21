"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDiceGame = void 0;
const logger_1 = require("../../core/logger");
const gameService_1 = require("../../core/gameService");
const types_1 = require("../../core/types");
const startDiceGame = async (userId, stake) => {
    (0, logger_1.logFunctionStart)('startDiceGame', { userId, stake });
    try {
        if (stake < 1 || stake > 1000) {
            const result = { success: false, error: 'Invalid stake amount. Must be between 1 and 1000 coins.' };
            (0, logger_1.logFunctionEnd)('startDiceGame', result, { userId, stake });
            return result;
        }
        const user = await getUser(userId);
        if (user.coins < stake) {
            const result = { success: false, error: 'Insufficient coins for this stake.' };
            (0, logger_1.logFunctionEnd)('startDiceGame', result, { userId, stake });
            return result;
        }
        const deductionSuccess = await deductCoins(userId, stake, 'dice_game_stake');
        if (!deductionSuccess) {
            const result = { success: false, error: 'Failed to deduct coins.' };
            (0, logger_1.logFunctionEnd)('startDiceGame', result, { userId, stake });
            return result;
        }
        const player = {
            id: userId,
            name: user.name || user.username || 'Unknown',
            username: user.username,
            coins: user.coins - stake,
        };
        const game = await (0, gameService_1.createGame)(types_1.GameType.DICE, player, stake);
        const diceData = {
            playerGuess: 0,
            diceResult: 0,
            isWon: false,
        };
        await (0, gameService_1.updateGame)(game.id, {
            data: diceData,
        });
        const result = { success: true, gameId: game.id };
        (0, logger_1.logFunctionEnd)('startDiceGame', result, { userId, stake });
        return result;
    }
    catch (error) {
        (0, logger_1.logError)('startDiceGame', error, { userId, stake });
        return { success: false, error: 'Failed to start dice game.' };
    }
};
exports.startDiceGame = startDiceGame;
//# sourceMappingURL=startGame.js.map