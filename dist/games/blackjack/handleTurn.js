"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBlackjackTurn = void 0;
const logger_1 = require("../../core/logger");
const gameService_1 = require("../../core/gameService");
const userService_1 = require("../../core/userService");
const types_1 = require("../../core/types");
function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;
    for (const card of hand) {
        if (card.value === 1) {
            aces++;
            value += 11;
        }
        else if (card.value >= 10) {
            value += 10;
        }
        else {
            value += card.value;
        }
    }
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    return value;
}
function dealCard(deck) {
    const card = deck.pop();
    return { card, remainingDeck: deck };
}
function dealerShouldHit(dealerHand) {
    const dealerValue = calculateHandValue(dealerHand);
    return dealerValue <= 16;
}
const handleBlackjackTurn = async (gameId, action) => {
    (0, logger_1.logFunctionStart)('handleBlackjackTurn', { gameId, action });
    try {
        if (action !== 'hit' && action !== 'stand') {
            const result = { success: false, error: 'Invalid action. Must be "hit" or "stand".' };
            (0, logger_1.logFunctionEnd)('handleBlackjackTurn', result, { gameId, action });
            return result;
        }
        const game = await (0, gameService_1.getGame)(gameId);
        if (!game) {
            const result = { success: false, error: 'Game not found.' };
            (0, logger_1.logFunctionEnd)('handleBlackjackTurn', result, { gameId, action });
            return result;
        }
        if (game.status !== types_1.GameStatus.PLAYING) {
            const result = { success: false, error: 'Game is not in playing state.' };
            (0, logger_1.logFunctionEnd)('handleBlackjackTurn', result, { gameId, action });
            return result;
        }
        const gameData = game.data;
        const { playerHand, dealerHand, deck } = gameData;
        const stake = game.stake;
        let updatedPlayerHand = [...playerHand];
        let updatedDealerHand = [...dealerHand];
        let updatedDeck = [...deck];
        let gameResult;
        if (action === 'hit') {
            const { card, remainingDeck } = dealCard(updatedDeck);
            updatedPlayerHand.push(card);
            updatedDeck = remainingDeck;
            const playerValue = calculateHandValue(updatedPlayerHand);
            if (playerValue > 21) {
                gameResult = 'lose';
            }
        }
        else {
            while (dealerShouldHit(updatedDealerHand)) {
                const { card, remainingDeck } = dealCard(updatedDeck);
                updatedDealerHand.push(card);
                updatedDeck = remainingDeck;
            }
            const playerValue = calculateHandValue(updatedPlayerHand);
            const dealerValue = calculateHandValue(updatedDealerHand);
            if (dealerValue > 21) {
                gameResult = 'win';
            }
            else if (playerValue > dealerValue) {
                gameResult = 'win';
            }
            else if (playerValue < dealerValue) {
                gameResult = 'lose';
            }
            else {
                gameResult = 'push';
            }
        }
        const fee = Math.floor(stake * 0.1);
        let reward = 0;
        let isWon = false;
        if (gameResult === 'win') {
            reward = Math.floor(stake * 2);
            isWon = true;
        }
        else if (gameResult === 'push') {
            reward = stake;
            isWon = true;
        }
        const coinsWon = isWon ? reward : 0;
        const coinsLost = isWon ? 0 : stake;
        const updatedBlackjackData = {
            playerHand: updatedPlayerHand,
            dealerHand: updatedDealerHand,
            deck: updatedDeck,
            result: gameResult || undefined,
            reward,
            fee,
        };
        await (0, gameService_1.updateGame)(gameId, {
            data: updatedBlackjackData,
        });
        const playerId = game.players[0].id;
        if (isWon) {
            await (0, userService_1.addCoins)(playerId, coinsWon, 'blackjack_game_win');
        }
        const finalGameResult = {
            winner: isWon ? playerId : undefined,
            loser: isWon ? undefined : playerId,
            isDraw: gameResult === 'push',
            coinsWon,
            coinsLost,
        };
        await (0, gameService_1.finishGame)(gameId, finalGameResult);
        const result = {
            isWon,
            result: gameResult,
            playerHand: updatedPlayerHand,
            dealerHand: updatedDealerHand,
            playerScore: calculateHandValue(updatedPlayerHand),
            dealerScore: calculateHandValue(updatedDealerHand),
            reward,
            fee,
            coinsWon,
            coinsLost,
        };
        const response = { success: true, result };
        (0, logger_1.logFunctionEnd)('handleBlackjackTurn', response, { gameId, action });
        return response;
    }
    catch (error) {
        (0, logger_1.logError)('handleBlackjackTurn', error, { gameId, action });
        return { success: false, error: 'Failed to process blackjack turn.' };
    }
};
exports.handleBlackjackTurn = handleBlackjackTurn;
//# sourceMappingURL=handleTurn.js.map