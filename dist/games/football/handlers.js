"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFootballHandlers = void 0;
const logger_1 = require("../../core/logger");
const telegramHelpers_1 = require("../../core/telegramHelpers");
const index_1 = require("./index");
const registerFootballHandlers = (bot) => {
    (0, logger_1.logFunctionStart)('registerFootballHandlers', {});
    bot.command('football', async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            (0, logger_1.logFunctionStart)('footballCommand', { userId: userInfo.userId });
            const stakeKeyboard = (0, telegramHelpers_1.createInlineKeyboard)([
                { text: '2 Coins', callbackData: { action: 'football_stake', stake: 2 } },
                { text: '5 Coins', callbackData: { action: 'football_stake', stake: 5 } },
                { text: '10 Coins', callbackData: { action: 'football_stake', stake: 10 } },
                { text: '20 Coins', callbackData: { action: 'football_stake', stake: 20 } },
            ]);
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '⚽️ Football Game\n\nGuess where the ball will go!\n\nChoose your stake amount:', { replyMarkup: stakeKeyboard });
            (0, logger_1.logFunctionEnd)('footballCommand', {}, { userId: userInfo.userId });
        }
        catch (error) {
            (0, logger_1.logError)('footballCommand', error, {});
            await ctx.reply('❌ Failed to start football game.');
        }
    });
    bot.callbackQuery(/.*"action":"football_stake".*/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const data = (0, telegramHelpers_1.parseCallbackData)(ctx.callbackQuery.data || '');
            const stake = data.stake;
            (0, logger_1.logFunctionStart)('footballStakeCallback', { userId: userInfo.userId, stake });
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            const result = await (0, index_1.startFootballGame)(userInfo.userId, stake);
            if (!result.success) {
                await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${result.error}`);
                (0, logger_1.logFunctionEnd)('footballStakeCallback', { success: false }, { userId: userInfo.userId, stake });
                return;
            }
            const directionKeyboard = {
                inline_keyboard: [
                    [{ text: '↖️ Top-Left', callback_data: `football_guess_${result.gameId}_1` }],
                    [{ text: '↗️ Top-Right', callback_data: `football_guess_${result.gameId}_2` }],
                    [{ text: '🎯 Center', callback_data: `football_guess_${result.gameId}_3` }],
                    [{ text: '↙️ Bottom-Left', callback_data: `football_guess_${result.gameId}_4` }],
                    [{ text: '↘️ Bottom-Right', callback_data: `football_guess_${result.gameId}_5` }]
                ]
            };
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `⚽️ Football Game Started!\n\n💰 Stake: ${stake} Coins\n\nGuess where the ball will go:`, { replyMarkup: directionKeyboard });
            (0, logger_1.logFunctionEnd)('footballStakeCallback', { success: true }, { userId: userInfo.userId, stake });
        }
        catch (error) {
            (0, logger_1.logError)('footballStakeCallback', error, {});
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Failed to start game');
        }
    });
    bot.callbackQuery(/^football_guess_.*/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const callbackData = ctx.callbackQuery.data || '';
            const match = callbackData.match(/^football_guess_(.+)_(\d+)$/);
            if (!match) {
                await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
                return;
            }
            const gameId = match[1];
            const guess = parseInt(match[2]);
            (0, logger_1.logFunctionStart)('footballGuessCallback', { userId: userInfo.userId, gameId, guess });
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            const result = await (0, index_1.handleFootballTurn)(gameId, guess);
            if (!result.success) {
                await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${result.error}`);
                (0, logger_1.logFunctionEnd)('footballGuessCallback', { success: false }, { userId: userInfo.userId, gameId, guess });
                return;
            }
            const footballResult = result.result;
            const emoji = footballResult.isWon ? '⚽️' : '😔';
            const guessDirection = index_1.FOOTBALL_DIRECTIONS[footballResult.guess];
            const resultDirection = index_1.FOOTBALL_DIRECTIONS[footballResult.diceResult];
            const message = footballResult.isWon
                ? `${emoji} <b>You Won!</b>\n\n⚽️ Your guess: ${guessDirection}\n🎲 Result: ${resultDirection}\n💰 Winnings: +${footballResult.coinsWon} Coins`
                : `${emoji} <b>You Lost!</b>\n\n⚽️ Your guess: ${guessDirection}\n🎲 Result: ${resultDirection}\n💰 Lost: ${footballResult.coinsLost} Coins`;
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, message, { parseMode: 'HTML' });
            (0, logger_1.logFunctionEnd)('footballGuessCallback', { success: true }, { userId: userInfo.userId, gameId, guess });
        }
        catch (error) {
            (0, logger_1.logError)('footballGuessCallback', error, {});
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Failed to process guess');
        }
    });
    (0, logger_1.logFunctionEnd)('registerFootballHandlers', {}, {});
};
exports.registerFootballHandlers = registerFootballHandlers;
//# sourceMappingURL=handlers.js.map