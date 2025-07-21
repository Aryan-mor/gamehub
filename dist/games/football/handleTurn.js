"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFootballTurn = void 0;
const logger_1 = require("../../core/logger");
const gameService_1 = require("../../core/gameService");
const userService_1 = require("../../core/userService");
const types_1 = require("../../core/types");
const handleFootballTurn = async (gameId, guess) => {
    (0, logger_1.logFunctionStart)('handleFootballTurn', { gameId, guess });
    try {
        if (guess < 1 || guess > 5) {
            const result = { success: false, error: 'Invalid guess. Must be between 1 and 5.' };
            (0, logger_1.logFunctionEnd)('handleFootballTurn', result, { gameId, guess });
            return result;
        }
        const game = await (0, gameService_1.getGame)(gameId);
        if (!game) {
            const result = { success: false, error: 'Game not found.' };
            (0, logger_1.logFunctionEnd)('handleFootballTurn', result, { gameId, guess });
            return result;
        }
        if (game.status !== types_1.GameStatus.PLAYING) {
            const result = { success: false, error: 'Game is not in playing state.' };
            (0, logger_1.logFunctionEnd)('handleFootballTurn', result, { gameId, guess });
            return result;
        }
        const diceResult = Math.floor(Math.random() * 5) + 1;
        const stake = game.stake;
        const { isWon, reward } = calculateFootballWinnings(guess, diceResult, stake);
        const fee = Math.floor(stake * 0.1);
        const coinsWon = isWon ? reward : 0;
        const coinsLost = isWon ? 0 : stake;
        const footballData = {
            guess,
            diceResult,
            isWon,
            reward,
            fee,
        };
        await (0, gameService_1.updateGame)(gameId, {
            data: footballData,
        });
        const playerId = game.players[0].id;
        if (isWon) {
            await (0, userService_1.addCoins)(playerId, coinsWon, 'football_game_win');
        }
        const gameResult = {
            winner: isWon ? playerId : undefined,
            loser: isWon ? undefined : playerId,
            isDraw: false,
            coinsWon,
            coinsLost,
        };
        await (0, gameService_1.finishGame)(gameId, gameResult);
        const result = {
            isWon,
            guess,
            diceResult,
            reward,
            fee,
            coinsWon,
            coinsLost,
        };
        const response = { success: true, result };
        (0, logger_1.logFunctionEnd)('handleFootballTurn', response, { gameId, guess });
        return response;
    }
    catch (error) {
        (0, logger_1.logError)('handleFootballTurn', error, { gameId, guess });
        return { success: false, error: 'Failed to process football turn.' };
    }
};
exports.handleFootballTurn = handleFootballTurn;
function calculateFootballWinnings(guess, diceResult, stake) {
    if (guess === diceResult) {
        const reward = Math.floor(stake * 3);
        return { isWon: true, reward };
    }
    else if (Math.abs(guess - diceResult) === 1) {
        const reward = Math.floor(stake * 1.5);
        return { isWon: true, reward };
    }
    else {
        return { isWon: false, reward: 0 };
    }
}
//# sourceMappingURL=handleTurn.js.map