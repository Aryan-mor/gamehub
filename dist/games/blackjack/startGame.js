"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBlackjackGame = void 0;
const logger_1 = require("../../core/logger");
const userService_1 = require("../../core/userService");
const gameService_1 = require("../../core/gameService");
const types_1 = require("../../core/types");
function createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const deck = [];
    for (const suit of suits) {
        for (let value = 1; value <= 13; value++) {
            let displayValue;
            if (value === 1)
                displayValue = 'A';
            else if (value === 11)
                displayValue = 'J';
            else if (value === 12)
                displayValue = 'Q';
            else if (value === 13)
                displayValue = 'K';
            else
                displayValue = value.toString();
            deck.push({
                suit,
                value,
                displayValue,
            });
        }
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}
function dealInitialCards(deck) {
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];
    return {
        playerHand,
        dealerHand,
        remainingDeck: deck,
    };
}
const startBlackjackGame = async (userId, stake) => {
    (0, logger_1.logFunctionStart)('startBlackjackGame', { userId, stake });
    try {
        if (![2, 5, 10, 20, 30, 50].includes(stake)) {
            const result = { success: false, error: 'Invalid stake amount. Must be 2, 5, 10, 20, 30, or 50 coins.' };
            (0, logger_1.logFunctionEnd)('startBlackjackGame', result, { userId, stake });
            return result;
        }
        const user = await (0, userService_1.getUser)(userId);
        if (user.coins < stake) {
            const result = { success: false, error: 'Insufficient coins for this stake.' };
            (0, logger_1.logFunctionEnd)('startBlackjackGame', result, { userId, stake });
            return result;
        }
        const deductionSuccess = await (0, userService_1.deductCoins)(userId, stake, 'blackjack_game_stake');
        if (!deductionSuccess) {
            const result = { success: false, error: 'Failed to deduct coins.' };
            (0, logger_1.logFunctionEnd)('startBlackjackGame', result, { userId, stake });
            return result;
        }
        const player = {
            id: userId,
            name: user.name || user.username || 'Unknown',
            username: user.username,
            coins: user.coins - stake,
        };
        const game = await (0, gameService_1.createGame)(types_1.GameType.BLACKJACK, player, stake);
        const deck = createDeck();
        const { playerHand, dealerHand, remainingDeck } = dealInitialCards(deck);
        const blackjackData = {
            playerHand,
            dealerHand,
            deck: remainingDeck,
            result: undefined,
            reward: 0,
            fee: 0,
        };
        await (0, gameService_1.updateGame)(game.id, {
            data: blackjackData,
        });
        const result = { success: true, gameId: game.id };
        (0, logger_1.logFunctionEnd)('startBlackjackGame', result, { userId, stake });
        return result;
    }
    catch (error) {
        (0, logger_1.logError)('startBlackjackGame', error, { userId, stake });
        return { success: false, error: 'Failed to start blackjack game.' };
    }
};
exports.startBlackjackGame = startBlackjackGame;
//# sourceMappingURL=startGame.js.map