"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBasketballHandlers = void 0;
const logger_1 = require("../../core/logger");
const telegramHelpers_1 = require("../../core/telegramHelpers");
const index_1 = require("./index");
const registerBasketballHandlers = (bot) => {
    (0, logger_1.logFunctionStart)('registerBasketballHandlers', {});
    bot.command('basketball', async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            (0, logger_1.logFunctionStart)('basketballCommand', { userId: userInfo.userId });
            const stakeKeyboard = (0, telegramHelpers_1.createInlineKeyboard)([
                { text: '2 Coins', callbackData: { action: 'basketball_stake', stake: 2 } },
                { text: '5 Coins', callbackData: { action: 'basketball_stake', stake: 5 } },
                { text: '10 Coins', callbackData: { action: 'basketball_stake', stake: 10 } },
                { text: '20 Coins', callbackData: { action: 'basketball_stake', stake: 20 } },
            ]);
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '🏀 Basketball Game\n\nGuess if you will score or miss!\n\nChoose your stake amount:', { replyMarkup: stakeKeyboard });
            (0, logger_1.logFunctionEnd)('basketballCommand', {}, { userId: userInfo.userId });
        }
        catch (error) {
            (0, logger_1.logError)('basketballCommand', error, {});
            await ctx.reply('❌ Failed to start basketball game.');
        }
    });
    bot.callbackQuery(/^basketball_stake:/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const data = (0, telegramHelpers_1.parseCallbackData)(ctx.callbackQuery.data || '');
            const stake = data.stake;
            (0, logger_1.logFunctionStart)('basketballStakeCallback', { userId: userInfo.userId, stake });
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            const result = await (0, index_1.startBasketballGame)(userInfo.userId, stake);
            if (!result.success) {
                await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${result.error}`);
                (0, logger_1.logFunctionEnd)('basketballStakeCallback', { success: false }, { userId: userInfo.userId, stake });
                return;
            }
            const guessKeyboard = (0, telegramHelpers_1.createInlineKeyboard)([
                { text: '🏀 Score', callbackData: { action: 'basketball_guess', gameId: result.gameId, guess: 'score' } },
                { text: '❌ Miss', callbackData: { action: 'basketball_guess', gameId: result.gameId, guess: 'miss' } },
            ]);
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `🏀 Basketball Game Started!\n\n💰 Stake: ${stake} Coins\n\nGuess your shot:`, { replyMarkup: guessKeyboard });
            (0, logger_1.logFunctionEnd)('basketballStakeCallback', { success: true }, { userId: userInfo.userId, stake });
        }
        catch (error) {
            (0, logger_1.logError)('basketballStakeCallback', error, {});
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Failed to start game');
        }
    });
    bot.callbackQuery(/^basketball_guess:/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const data = (0, telegramHelpers_1.parseCallbackData)(ctx.callbackQuery.data || '');
            const gameId = data.gameId;
            const guess = data.guess;
            (0, logger_1.logFunctionStart)('basketballGuessCallback', { userId: userInfo.userId, gameId, guess });
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            const result = await (0, index_1.handleBasketballTurn)(gameId, guess);
            if (!result.success) {
                await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${result.error}`);
                (0, logger_1.logFunctionEnd)('basketballGuessCallback', { success: false }, { userId: userInfo.userId, gameId, guess });
                return;
            }
            const basketballResult = result.result;
            const emoji = basketballResult.isWon ? '🏀' : '😔';
            const guessText = basketballResult.guess === 'score' ? 'Score' : 'Miss';
            const resultText = basketballResult.diceResult >= 4 ? 'Score!' : 'Miss!';
            const message = basketballResult.isWon
                ? `${emoji} <b>You Won!</b>\n\n🏀 Your guess: ${guessText}\n🎲 Result: ${resultText} (${basketballResult.diceResult})\n💰 Winnings: +${basketballResult.coinsWon} Coins`
                : `${emoji} <b>You Lost!</b>\n\n🏀 Your guess: ${guessText}\n🎲 Result: ${resultText} (${basketballResult.diceResult})\n💰 Lost: ${basketballResult.coinsLost} Coins`;
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, message, { parseMode: 'HTML' });
            (0, logger_1.logFunctionEnd)('basketballGuessCallback', { success: true }, { userId: userInfo.userId, gameId, guess });
        }
        catch (error) {
            (0, logger_1.logError)('basketballGuessCallback', error, {});
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Failed to process guess');
        }
    });
    (0, logger_1.logFunctionEnd)('registerBasketballHandlers', {}, {});
};
exports.registerBasketballHandlers = registerBasketballHandlers;
//# sourceMappingURL=handlers.js.map