"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFootballGame = void 0;
const logger_1 = require("../../core/logger");
const gameService_1 = require("../../core/gameService");
const userService_1 = require("../../core/userService");
const types_1 = require("../../core/types");
const startFootballGame = async (userId, stake) => {
    (0, logger_1.logFunctionStart)('startFootballGame', { userId, stake });
    try {
        if (![2, 5, 10, 20].includes(stake)) {
            const result = { success: false, error: 'Invalid stake amount. Must be 2, 5, 10, or 20 coins.' };
            (0, logger_1.logFunctionEnd)('startFootballGame', result, { userId, stake });
            return result;
        }
        const user = await (0, userService_1.getUser)(userId);
        if (user.coins < stake) {
            const result = { success: false, error: 'Insufficient coins for this stake.' };
            (0, logger_1.logFunctionEnd)('startFootballGame', result, { userId, stake });
            return result;
        }
        const deductionSuccess = await (0, userService_1.deductCoins)(userId, stake, 'football_game_stake');
        if (!deductionSuccess) {
            const result = { success: false, error: 'Failed to deduct coins.' };
            (0, logger_1.logFunctionEnd)('startFootballGame', result, { userId, stake });
            return result;
        }
        const player = {
            id: userId,
            name: user.name || user.username || 'Unknown',
            username: user.username,
            coins: user.coins - stake,
        };
        const game = await (0, gameService_1.createGame)(types_1.GameType.FOOTBALL, player, stake);
        const footballData = {
            guess: 0,
            diceResult: 0,
            isWon: false,
            reward: 0,
            fee: 0,
        };
        await (0, gameService_1.updateGame)(game.id, {
            status: types_1.GameStatus.PLAYING,
            data: footballData,
        });
        const result = { success: true, gameId: game.id };
        (0, logger_1.logFunctionEnd)('startFootballGame', result, { userId, stake });
        return result;
    }
    catch (error) {
        (0, logger_1.logError)('startFootballGame', error, { userId, stake });
        return { success: false, error: 'Failed to start football game.' };
    }
};
exports.startFootballGame = startFootballGame;
//# sourceMappingURL=startGame.js.map