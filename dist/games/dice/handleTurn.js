"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDiceTurn = void 0;
const logger_1 = require("../../core/logger");
const gameService_1 = require("../../core/gameService");
const userService_1 = require("../../core/userService");
const types_1 = require("../../core/types");
const handleDiceTurn = async (gameId, playerGuess) => {
    (0, logger_1.logFunctionStart)('handleDiceTurn', { gameId, playerGuess });
    try {
        if (playerGuess < 1 || playerGuess > 6) {
            const result = { success: false, error: 'Invalid guess. Must be between 1 and 6.' };
            (0, logger_1.logFunctionEnd)('handleDiceTurn', result, { gameId, playerGuess });
            return result;
        }
        const game = await (0, gameService_1.getGame)(gameId);
        if (!game) {
            const result = { success: false, error: 'Game not found.' };
            (0, logger_1.logFunctionEnd)('handleDiceTurn', result, { gameId, playerGuess });
            return result;
        }
        if (game.status !== types_1.GameStatus.PLAYING) {
            const result = { success: false, error: 'Game is not in playing state.' };
            (0, logger_1.logFunctionEnd)('handleDiceTurn', result, { gameId, playerGuess });
            return result;
        }
        const diceResult = Math.floor(Math.random() * 6) + 1;
        const isWon = playerGuess === diceResult;
        const stake = game.stake;
        const coinsWon = isWon ? stake * 5 : 0;
        const coinsLost = isWon ? 0 : stake;
        const diceData = {
            playerGuess,
            diceResult,
            isWon,
        };
        await (0, gameService_1.updateGame)(gameId, {
            data: diceData,
        });
        const playerId = game.players[0].id;
        if (isWon) {
            await (0, userService_1.addCoins)(playerId, coinsWon, 'dice_game_win');
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
            playerGuess,
            diceResult,
            coinsWon,
            coinsLost,
        };
        const response = { success: true, result };
        (0, logger_1.logFunctionEnd)('handleDiceTurn', response, { gameId, playerGuess });
        return response;
    }
    catch (error) {
        (0, logger_1.logError)('handleDiceTurn', error, { gameId, playerGuess });
        return { success: false, error: 'Failed to process dice turn.' };
    }
};
exports.handleDiceTurn = handleDiceTurn;
//# sourceMappingURL=handleTurn.js.map