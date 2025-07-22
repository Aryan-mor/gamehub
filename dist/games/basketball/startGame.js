"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBasketballGame = void 0;
const logger_1 = require("../../core/logger");
const userService_1 = require("../../core/userService");
const gameService_1 = require("../../core/gameService");
const types_1 = require("../../core/types");
const startBasketballGame = async (userId, stake) => {
    (0, logger_1.logFunctionStart)('startBasketballGame', { userId, stake });
    try {
        if (![2, 5, 10, 20].includes(stake)) {
            const result = { success: false, error: 'Invalid stake amount. Must be 2, 5, 10, or 20 coins.' };
            (0, logger_1.logError)('startBasketballGame', new Error(result.error), { userId, stake });
            return result;
        }
        const user = await (0, userService_1.getUser)(userId);
        if (user.coins < stake) {
            const result = { success: false, error: 'Insufficient coins for this stake.' };
            (0, logger_1.logError)('startBasketballGame', new Error(result.error), { userId, stake });
            return result;
        }
        const deductionSuccess = await (0, userService_1.deductCoins)(userId, stake, 'basketball_game_stake');
        if (!deductionSuccess) {
            const result = { success: false, error: 'Failed to deduct coins.' };
            (0, logger_1.logError)('startBasketballGame', new Error(result.error), { userId, stake });
            return result;
        }
        const player = {
            id: userId,
            name: user.name || user.username || 'Unknown',
            username: user.username,
            coins: user.coins - stake,
        };
        const game = await (0, gameService_1.createGame)(types_1.GameType.BASKETBALL, player, stake);
        const basketballData = {
            guess: 'miss',
            diceResult: 0,
            isWon: false,
            reward: 0,
            fee: 0,
        };
        await (0, gameService_1.updateGame)(game.id, {
            status: types_1.GameStatus.PLAYING,
            data: basketballData,
        });
        const result = { success: true, gameId: game.id };
        (0, logger_1.logFunctionEnd)('startBasketballGame', result, { userId, stake });
        return result;
    }
    catch (error) {
        (0, logger_1.logError)('startBasketballGame', error, { userId, stake });
        return { success: false, error: 'Failed to start basketball game.' };
    }
};
exports.startBasketballGame = startBasketballGame;
//# sourceMappingURL=startGame.js.map