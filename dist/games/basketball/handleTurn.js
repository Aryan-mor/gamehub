"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBasketballTurn = void 0;
const logger_1 = require("../../core/logger");
const gameService_1 = require("../../core/gameService");
const userService_1 = require("../../core/userService");
const types_1 = require("../../core/types");
const handleBasketballTurn = async (gameId, guess) => {
    (0, logger_1.logFunctionStart)('handleBasketballTurn', { gameId, guess });
    try {
        if (guess !== 'score' && guess !== 'miss') {
            const result = { success: false, error: 'Invalid guess. Must be "score" or "miss".' };
            (0, logger_1.logFunctionEnd)('handleBasketballTurn', result, { gameId, guess });
            return result;
        }
        const game = await (0, gameService_1.getGame)(gameId);
        if (!game) {
            const result = { success: false, error: 'Game not found.' };
            (0, logger_1.logFunctionEnd)('handleBasketballTurn', result, { gameId, guess });
            return result;
        }
        if (game.status !== types_1.GameStatus.PLAYING) {
            const result = { success: false, error: 'Game is not in playing state.' };
            (0, logger_1.logFunctionEnd)('handleBasketballTurn', result, { gameId, guess });
            return result;
        }
        const diceResult = Math.floor(Math.random() * 6) + 1;
        const stake = game.stake;
        const { isWon, reward, fee } = calculateBasketballWinnings(guess, diceResult, stake);
        const coinsWon = isWon ? reward : 0;
        const coinsLost = isWon ? 0 : stake;
        const basketballData = {
            guess,
            diceResult,
            isWon,
            reward,
            fee,
        };
        await (0, gameService_1.updateGame)(gameId, {
            data: basketballData,
        });
        const playerId = game.players[0].id;
        if (isWon) {
            await (0, userService_1.addCoins)(playerId, coinsWon, 'basketball_game_win');
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
        (0, logger_1.logFunctionEnd)('handleBasketballTurn', response, { gameId, guess });
        return response;
    }
    catch (error) {
        (0, logger_1.logError)('handleBasketballTurn', error, { gameId, guess });
        return { success: false, error: 'Failed to process basketball turn.' };
    }
};
exports.handleBasketballTurn = handleBasketballTurn;
function calculateBasketballWinnings(guess, diceResult, stake) {
    const fee = Math.floor(stake * 0.1);
    if (guess === 'score') {
        if (diceResult >= 4) {
            const reward = Math.floor(stake * 1.8);
            return { isWon: true, reward, fee };
        }
        else {
            return { isWon: false, reward: 0, fee };
        }
    }
    else {
        if (diceResult <= 3) {
            const reward = Math.floor(stake * 1.8);
            return { isWon: true, reward, fee };
        }
        else {
            return { isWon: false, reward: 0, fee };
        }
    }
}
//# sourceMappingURL=handleTurn.js.map