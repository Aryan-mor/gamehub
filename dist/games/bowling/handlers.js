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
            const stakeKeyboard = (0, telegramHelpers_1.createInlineKeyboard)([
                { text: '2 Coins', callbackData: { action: 'bowling_stake', stake: 2 } },
                { text: '5 Coins', callbackData: { action: 'bowling_stake', stake: 5 } },
                { text: '10 Coins', callbackData: { action: 'bowling_stake', stake: 10 } },
                { text: '20 Coins', callbackData: { action: 'bowling_stake', stake: 20 } },
            ]);
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '🎳 Bowling Game\n\nKnock down pins with your dice roll!\n\nChoose your stake amount:', { replyMarkup: stakeKeyboard });
            (0, logger_1.logFunctionEnd)('bowlingCommand', {}, { userId: userInfo.userId });
        }
        catch (error) {
            (0, logger_1.logError)('bowlingCommand', error, {});
            await ctx.reply('❌ Failed to start bowling game.');
        }
    });
    bot.callbackQuery(/^bowling_stake:/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const data = (0, telegramHelpers_1.parseCallbackData)(ctx.callbackQuery.data || '');
            const stake = data.stake;
            (0, logger_1.logFunctionStart)('bowlingStakeCallback', { userId: userInfo.userId, stake });
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            const result = await (0, index_1.startBowlingGame)(userInfo.userId, stake);
            if (!result.success) {
                await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${result.error}`);
                (0, logger_1.logFunctionEnd)('bowlingStakeCallback', { success: false }, { userId: userInfo.userId, stake });
                return;
            }
            const rollKeyboard = (0, telegramHelpers_1.createInlineKeyboard)([
                { text: '🎳 Roll Dice', callbackData: { action: 'bowling_roll', gameId: result.gameId } },
            ]);
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `🎳 Bowling Game Started!\n\n💰 Stake: ${stake} Coins\n\nReady to roll!`, { replyMarkup: rollKeyboard });
            (0, logger_1.logFunctionEnd)('bowlingStakeCallback', { success: true }, { userId: userInfo.userId, stake });
        }
        catch (error) {
            (0, logger_1.logError)('bowlingStakeCallback', error, {});
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Failed to start game');
        }
    });
    bot.callbackQuery(/^bowling_roll:/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const data = (0, telegramHelpers_1.parseCallbackData)(ctx.callbackQuery.data || '');
            const gameId = data.gameId;
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