"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBlackjackHandlers = void 0;
const logger_1 = require("../../core/logger");
const telegramHelpers_1 = require("../../core/telegramHelpers");
const index_1 = require("./index");
const gameService_1 = require("../../core/gameService");
function formatCards(cards) {
    return cards.map(card => `${card.displayValue}${getSuitEmoji(card.suit)}`).join(' ');
}
function getSuitEmoji(suit) {
    switch (suit) {
        case 'hearts': return '♥️';
        case 'diamonds': return '♦️';
        case 'clubs': return '♣️';
        case 'spades': return '♠️';
        default: return '';
    }
}
const registerBlackjackHandlers = (bot) => {
    (0, logger_1.logFunctionStart)('registerBlackjackHandlers', {});
    bot.command('blackjack', async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            (0, logger_1.logFunctionStart)('blackjackCommand', { userId: userInfo.userId });
            const stakeKeyboard = (0, telegramHelpers_1.createInlineKeyboard)([
                { text: '2 Coins', callbackData: { action: 'blackjack_stake', stake: 2 } },
                { text: '5 Coins', callbackData: { action: 'blackjack_stake', stake: 5 } },
                { text: '10 Coins', callbackData: { action: 'blackjack_stake', stake: 10 } },
                { text: '20 Coins', callbackData: { action: 'blackjack_stake', stake: 20 } },
                { text: '30 Coins', callbackData: { action: 'blackjack_stake', stake: 30 } },
                { text: '50 Coins', callbackData: { action: 'blackjack_stake', stake: 50 } },
            ]);
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '🃏 Blackjack Game\n\nGet as close to 21 as possible without going over!\n\nChoose your stake amount:', { replyMarkup: stakeKeyboard });
            (0, logger_1.logFunctionEnd)('blackjackCommand', {}, { userId: userInfo.userId });
        }
        catch (error) {
            (0, logger_1.logError)('blackjackCommand', error, {});
            await ctx.reply('❌ Failed to start blackjack game.');
        }
    });
    bot.callbackQuery(/.*"action":"blackjack_stake".*/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const data = (0, telegramHelpers_1.parseCallbackData)(ctx.callbackQuery.data || '');
            const stake = data.stake;
            (0, logger_1.logFunctionStart)('blackjackStakeCallback', { userId: userInfo.userId, stake });
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            const result = await (0, index_1.startBlackjackGame)(userInfo.userId, stake);
            if (!result.success) {
                await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${result.error}`);
                (0, logger_1.logFunctionEnd)('blackjackStakeCallback', { success: false }, { userId: userInfo.userId, stake });
                return;
            }
            const game = await (0, gameService_1.getGame)(result.gameId);
            if (game && game.data) {
                const { playerHand, dealerHand } = game.data;
                const actionKeyboard = {
                    inline_keyboard: [
                        [{ text: '🎯 Hit', callback_data: `blackjack_action_${result.gameId}_hit` }],
                        [{ text: '✋ Stand', callback_data: `blackjack_action_${result.gameId}_stand` }]
                    ]
                };
                const message = `🃏 Blackjack Game Started!\n\n💰 Stake: ${stake} Coins\n\nYour hand: ${formatCards(playerHand)}\nDealer's hand: ${formatCards([dealerHand[0]])} [?]\n\nWhat would you like to do?`;
                await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, message, { replyMarkup: actionKeyboard });
            }
            (0, logger_1.logFunctionEnd)('blackjackStakeCallback', { success: true }, { userId: userInfo.userId, stake });
        }
        catch (error) {
            (0, logger_1.logError)('blackjackStakeCallback', error, {});
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Failed to start game');
        }
    });
    bot.callbackQuery(/^blackjack_action_.*/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const callbackData = ctx.callbackQuery.data || '';
            const match = callbackData.match(/^blackjack_action_(.+)_(hit|stand)$/);
            if (!match) {
                await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
                return;
            }
            const gameId = match[1];
            const action = match[2];
            (0, logger_1.logFunctionStart)('blackjackActionCallback', { userId: userInfo.userId, gameId, action });
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            const result = await (0, index_1.handleBlackjackTurn)(gameId, action);
            if (!result.success) {
                await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${result.error}`);
                (0, logger_1.logFunctionEnd)('blackjackActionCallback', { success: false }, { userId: userInfo.userId, gameId, action });
                return;
            }
            const blackjackResult = result.result;
            const emoji = blackjackResult.isWon ? '🃏' : '😔';
            const resultText = blackjackResult.result === 'win' ? 'You Won!' :
                blackjackResult.result === 'push' ? 'Push!' : 'You Lost!';
            const message = `${emoji} <b>${resultText}</b>\n\n` +
                `Your hand: ${formatCards(blackjackResult.playerHand)} (${blackjackResult.playerScore})\n` +
                `Dealer's hand: ${formatCards(blackjackResult.dealerHand)} (${blackjackResult.dealerScore})\n\n` +
                `${blackjackResult.isWon ? `💰 Winnings: +${blackjackResult.coinsWon} Coins` : `💰 Lost: ${blackjackResult.coinsLost} Coins`}`;
            const playAgainKeyboard = {
                inline_keyboard: [
                    [{ text: '🔄 Same Stake', callback_data: `blackjack_play_again_same_${gameId}_${blackjackResult.coinsLost || blackjackResult.coinsWon}` }],
                    [{ text: '🃏 New Game', callback_data: `blackjack_play_again_new_${gameId}_${blackjackResult.coinsLost || blackjackResult.coinsWon}` }],
                    [{ text: '🔄 Start Over', callback_data: 'blackjack_play_again_restart' }]
                ]
            };
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, message, {
                parseMode: 'HTML',
                replyMarkup: playAgainKeyboard
            });
            (0, logger_1.logFunctionEnd)('blackjackActionCallback', { success: true }, { userId: userInfo.userId, gameId, action });
        }
        catch (error) {
            (0, logger_1.logError)('blackjackActionCallback', error, {});
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Failed to process action');
        }
    });
    bot.callbackQuery(/^blackjack_play_again_.*/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const callbackData = ctx.callbackQuery.data || '';
            (0, logger_1.logFunctionStart)('blackjackPlayAgainCallback', { userId: userInfo.userId, callbackData });
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            if (callbackData === 'blackjack_play_again_restart') {
                const stakeKeyboard = (0, telegramHelpers_1.createInlineKeyboard)([
                    { text: '2 Coins', callbackData: { action: 'blackjack_stake', stake: 2 } },
                    { text: '5 Coins', callbackData: { action: 'blackjack_stake', stake: 5 } },
                    { text: '10 Coins', callbackData: { action: 'blackjack_stake', stake: 10 } },
                    { text: '20 Coins', callbackData: { action: 'blackjack_stake', stake: 20 } },
                    { text: '30 Coins', callbackData: { action: 'blackjack_stake', stake: 30 } },
                    { text: '50 Coins', callbackData: { action: 'blackjack_stake', stake: 50 } },
                ]);
                await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '🃏 Blackjack Game\n\nGet as close to 21 as possible without going over!\n\nChoose your stake amount:', { replyMarkup: stakeKeyboard });
            }
            else {
                const match = callbackData.match(/^blackjack_play_again_(same|new)_(.+)_(.+)$/);
                if (!match) {
                    await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
                    return;
                }
                const stake = parseInt(match[3]);
                const result = await (0, index_1.startBlackjackGame)(userInfo.userId, stake);
                if (!result.success) {
                    await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${result.error}`);
                    return;
                }
                const game = await (0, gameService_1.getGame)(result.gameId);
                if (game && game.data) {
                    const { playerHand, dealerHand } = game.data;
                    const actionKeyboard = {
                        inline_keyboard: [
                            [{ text: '🎯 Hit', callback_data: `blackjack_action_${result.gameId}_hit` }],
                            [{ text: '✋ Stand', callback_data: `blackjack_action_${result.gameId}_stand` }]
                        ]
                    };
                    const message = `🃏 Blackjack Game Started!\n\n💰 Stake: ${stake} Coins\n\nYour hand: ${formatCards(playerHand)}\nDealer's hand: ${formatCards([dealerHand[0]])} [?]\n\nWhat would you like to do?`;
                    await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, message, { replyMarkup: actionKeyboard });
                }
            }
            (0, logger_1.logFunctionEnd)('blackjackPlayAgainCallback', { success: true }, { userId: userInfo.userId });
        }
        catch (error) {
            (0, logger_1.logError)('blackjackPlayAgainCallback', error, {});
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Failed to start new game');
        }
    });
    (0, logger_1.logFunctionEnd)('registerBlackjackHandlers', {}, {});
};
exports.registerBlackjackHandlers = registerBlackjackHandlers;
//# sourceMappingURL=handlers.js.map