"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBowlingHandlers = void 0;
const logger_1 = require("../../core/logger");
const telegramHelpers_1 = require("../../core/telegramHelpers");
const index_1 = require("./index");
const registerBowlingHandlers = (bot) => {
    (0, logger_1.logFunctionStart)('registerBowlingHandlers', {});
    bot.command('bowling', async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            (0, logger_1.logFunctionStart)('bowlingCommand', { userId: userInfo.userId });
            const stakeKeyboard = {
                inline_keyboard: [
                    [{ text: '2 Coins', callback_data: 'bowling_stake_2' }],
                    [{ text: '5 Coins', callback_data: 'bowling_stake_5' }],
                    [{ text: '10 Coins', callback_data: 'bowling_stake_10' }],
                    [{ text: '20 Coins', callback_data: 'bowling_stake_20' }]
                ]
            };
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '🎳 Bowling Game\n\nKnock down pins with your dice roll!\n\nChoose your stake amount:', { replyMarkup: stakeKeyboard });
            (0, logger_1.logFunctionEnd)('bowlingCommand', {}, { userId: userInfo.userId });
        }
        catch (error) {
            (0, logger_1.logError)('bowlingCommand', error, {});
            await ctx.reply('❌ Failed to start bowling game.');
        }
    });
    bot.callbackQuery(/^bowling_stake_.*/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const callbackData = ctx.callbackQuery.data || '';
            const match = callbackData.match(/^bowling_stake_(\d+)$/);
            if (!match) {
                await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
                return;
            }
            const stake = parseInt(match[1]);
            (0, logger_1.logFunctionStart)('bowlingStakeCallback', { userId: userInfo.userId, stake });
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            const result = await (0, index_1.startBowlingGame)(userInfo.userId, stake);
            if (!result.success) {
                await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${result.error}`);
                (0, logger_1.logFunctionEnd)('bowlingStakeCallback', { success: false }, { userId: userInfo.userId, stake });
                return;
            }
            const rollKeyboard = {
                inline_keyboard: [
                    [{ text: '🎳 Roll Dice', callback_data: `bowling_roll_${result.gameId}` }]
                ]
            };
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `🎳 Bowling Game Started!\n\n💰 Stake: ${stake} Coins\n\nReady to roll!`, { replyMarkup: rollKeyboard });
            (0, logger_1.logFunctionEnd)('bowlingStakeCallback', { success: true }, { userId: userInfo.userId, stake });
        }
        catch (error) {
            (0, logger_1.logError)('bowlingStakeCallback', error, {});
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Failed to start game');
        }
    });
    bot.callbackQuery(/^bowling_roll_.*/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const callbackData = ctx.callbackQuery.data || '';
            const match = callbackData.match(/^bowling_roll_(.+)$/);
            if (!match) {
                await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
                return;
            }
            const gameId = match[1];
            (0, logger_1.logFunctionStart)('bowlingRollCallback', { userId: userInfo.userId, gameId });
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            const result = await (0, index_1.handleBowlingTurn)(gameId);
            if (!result.success) {
                await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${result.error}`);
                (0, logger_1.logFunctionEnd)('bowlingRollCallback', { success: false }, { userId: userInfo.userId, gameId });
                return;
            }
            const bowlingResult = result.result;
            const emoji = bowlingResult.isWon ? '🎳' : '😔';
            const pinsHit = bowlingResult.diceResult;
            const message = `${emoji} <b>${bowlingResult.outcome}</b>\n\n` +
                `🎳 You knocked down ${pinsHit} pins!\n\n` +
                `${bowlingResult.isWon ? `💰 Winnings: +${bowlingResult.coinsWon} Coins` : `💰 Lost: ${bowlingResult.coinsLost} Coins`}`;
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, message, { parseMode: 'HTML' });
            (0, logger_1.logFunctionEnd)('bowlingRollCallback', { success: true }, { userId: userInfo.userId, gameId });
        }
        catch (error) {
            (0, logger_1.logError)('bowlingRollCallback', error, {});
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Failed to process roll');
        }
    });
    (0, logger_1.logFunctionEnd)('registerBowlingHandlers', {}, {});
};
exports.registerBowlingHandlers = registerBowlingHandlers;
//# sourceMappingURL=handlers.js.map