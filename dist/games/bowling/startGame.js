"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBowlingGame = void 0;
const logger_1 = require("../../core/logger");
const gameService_1 = require("../../core/gameService");
const userService_1 = require("../../core/userService");
const types_1 = require("../../core/types");
const startBowlingGame = async (userId, stake) => {
    (0, logger_1.logFunctionStart)('startBowlingGame', { userId, stake });
    try {
        if (![2, 5, 10, 20].includes(stake)) {
            const result = { success: false, error: 'Invalid stake amount. Must be 2, 5, 10, or 20 coins.' };
            (0, logger_1.logFunctionEnd)('startBowlingGame', result, { userId, stake });
            return result;
        }
        const user = await (0, userService_1.getUser)(userId);
        if (user.coins < stake) {
            const result = { success: false, error: 'Insufficient coins for this stake.' };
            (0, logger_1.logFunctionEnd)('startBowlingGame', result, { userId, stake });
            return result;
        }
        const deductionSuccess = await (0, userService_1.deductCoins)(userId, stake, 'bowling_game_stake');
        if (!deductionSuccess) {
            const result = { success: false, error: 'Failed to deduct coins.' };
            (0, logger_1.logFunctionEnd)('startBowlingGame', result, { userId, stake });
            return result;
        }
        const player = {
            id: userId,
            name: user.name || user.username || 'Unknown',
            username: user.username || undefined,
            coins: user.coins - stake,
        };
        const game = await (0, gameService_1.createGame)(types_1.GameType.BOWLING, player, stake);
        const bowlingData = {
            diceResult: 0,
            isWon: false,
            reward: 0,
            fee: 0,
        };
        await (0, gameService_1.updateGame)(game.id, {
            status: types_1.GameStatus.PLAYING,
            data: bowlingData,
        });
        const result = { success: true, gameId: game.id };
        (0, logger_1.logFunctionEnd)('startBowlingGame', result, { userId, stake });
        return result;
    }
    catch (error) {
        (0, logger_1.logError)('startBowlingGame', error, { userId, stake });
        return { success: false, error: 'Failed to start bowling game.' };
    }
};
exports.startBowlingGame = startBowlingGame;
//# sourceMappingURL=startGame.js.map