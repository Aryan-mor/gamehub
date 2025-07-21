"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBowlingTurn = void 0;
const logger_1 = require("../../core/logger");
const gameService_1 = require("../../core/gameService");
const userService_1 = require("../../core/userService");
const types_1 = require("../../core/types");
function getBowlingOutcome(diceResult) {
    if (diceResult === 6)
        return 'Strike! 🎯';
    if (diceResult === 4 || diceResult === 5)
        return 'Great Roll! 🎳';
    if (diceResult === 2 || diceResult === 3)
        return 'Moderate Hit';
    return 'Weak Hit';
}
function calculateBowlingWinnings(diceResult, stake) {
    let isWon = false;
    let reward = 0;
    if (diceResult === 6) {
        isWon = true;
        reward = stake * 4;
    }
    else if (diceResult === 4 || diceResult === 5) {
        isWon = true;
        reward = stake * 2;
    }
    else if (diceResult === 2 || diceResult === 3) {
        isWon = false;
        reward = stake;
    }
    else {
        isWon = false;
        reward = 0;
    }
    return { isWon, reward };
}
const handleBowlingTurn = async (gameId) => {
    (0, logger_1.logFunctionStart)('handleBowlingTurn', { gameId });
    try {
        const game = await (0, gameService_1.getGame)(gameId);
        if (!game) {
            const result = { success: false, error: 'Game not found.' };
            (0, logger_1.logFunctionEnd)('handleBowlingTurn', result, { gameId });
            return result;
        }
        if (game.status !== types_1.GameStatus.PLAYING) {
            const result = { success: false, error: 'Game is not in playing state.' };
            (0, logger_1.logFunctionEnd)('handleBowlingTurn', result, { gameId });
            return result;
        }
        const diceResult = Math.floor(Math.random() * 6) + 1;
        const stake = game.stake;
        const { isWon, reward } = calculateBowlingWinnings(diceResult, stake);
        const fee = Math.floor(stake * 0.1);
        const coinsWon = isWon ? reward : 0;
        const coinsLost = isWon ? 0 : stake;
        const bowlingData = {
            diceResult,
            isWon,
            reward,
            fee,
        };
        await (0, gameService_1.updateGame)(gameId, {
            data: bowlingData,
        });
        const playerId = game.players[0].id;
        if (isWon && reward > 0) {
            await (0, userService_1.addCoins)(playerId, coinsWon, 'bowling_game_win');
        }
        else if (reward > 0) {
            await (0, userService_1.addCoins)(playerId, reward, 'bowling_game_refund');
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
            diceResult,
            outcome: getBowlingOutcome(diceResult),
            reward,
            fee,
            coinsWon,
            coinsLost,
        };
        const response = { success: true, result };
        (0, logger_1.logFunctionEnd)('handleBowlingTurn', response, { gameId });
        return response;
    }
    catch (error) {
        (0, logger_1.logError)('handleBowlingTurn', error, { gameId });
        return { success: false, error: 'Failed to process bowling turn.' };
    }
};
exports.handleBowlingTurn = handleBowlingTurn;
//# sourceMappingURL=handleTurn.js.map