"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDiceHandlers = void 0;
const logger_1 = require("../../core/logger");
const telegramHelpers_1 = require("../../core/telegramHelpers");
const registerDiceHandlers = (bot) => {
    (0, logger_1.logFunctionStart)('registerDiceHandlers', {});
    bot.command('dice', async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            (0, logger_1.logFunctionStart)('diceCommand', { userId: userInfo.userId });
            const stakeKeyboard = (0, telegramHelpers_1.createInlineKeyboard)([
                { text: '2 Coins', callbackData: { action: 'dice_stake', stake: 2 } },
                { text: '5 Coins', callbackData: { action: 'dice_stake', stake: 5 } },
                { text: '10 Coins', callbackData: { action: 'dice_stake', stake: 10 } },
                { text: '20 Coins', callbackData: { action: 'dice_stake', stake: 20 } },
            ]);
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '🎲 Dice Guess Game\n\nChoose your stake amount:', { replyMarkup: stakeKeyboard });
            (0, logger_1.logFunctionEnd)('diceCommand', {}, { userId: userInfo.userId });
        }
        catch (error) {
            (0, logger_1.logError)('diceCommand', error, {});
            await ctx.reply('❌ Failed to start dice game.');
        }
    });
    bot.callbackQuery(/^dice_stake:/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const data = (0, telegramHelpers_1.parseCallbackData)(ctx.callbackQuery.data);
            const stake = data.stake;
            (0, logger_1.logFunctionStart)('diceStakeCallback', { userId: userInfo.userId, stake });
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            const result = await startDiceGame(userInfo.userId, stake);
            if (!result.success) {
                await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${result.error}`);
                (0, logger_1.logFunctionEnd)('diceStakeCallback', { success: false }, { userId: userInfo.userId, stake });
                return;
            }
            const guessKeyboard = (0, telegramHelpers_1.createInlineKeyboard)([
                { text: '1', callbackData: { action: 'dice_guess', gameId: result.gameId, guess: 1 } },
                { text: '2', callbackData: { action: 'dice_guess', gameId: result.gameId, guess: 2 } },
                { text: '3', callbackData: { action: 'dice_guess', gameId: result.gameId, guess: 3 } },
                { text: '4', callbackData: { action: 'dice_guess', gameId: result.gameId, guess: 4 } },
                { text: '5', callbackData: { action: 'dice_guess', gameId: result.gameId, guess: 5 } },
                { text: '6', callbackData: { action: 'dice_guess', gameId: result.gameId, guess: 6 } },
            ]);
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `🎲 Dice Game Started!\n\n💰 Stake: ${stake} Coins\n\nGuess the dice number (1-6):`, { replyMarkup: guessKeyboard });
            (0, logger_1.logFunctionEnd)('diceStakeCallback', { success: true }, { userId: userInfo.userId, stake });
        }
        catch (error) {
            (0, logger_1.logError)('diceStakeCallback', error, {});
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Failed to start game');
        }
    });
    bot.callbackQuery(/^dice_guess:/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const data = (0, telegramHelpers_1.parseCallbackData)(ctx.callbackQuery.data);
            const gameId = data.gameId;
            const guess = data.guess;
            (0, logger_1.logFunctionStart)('diceGuessCallback', { userId: userInfo.userId, gameId, guess });
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            const result = await handleDiceTurn(gameId, guess);
            if (!result.success) {
                await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${result.error}`);
                (0, logger_1.logFunctionEnd)('diceGuessCallback', { success: false }, { userId: userInfo.userId, gameId, guess });
                return;
            }
            const diceResult = result.result;
            const emoji = diceResult.isWon ? '🎉' : '😔';
            const message = diceResult.isWon
                ? `${emoji} <b>You Won!</b>\n\n🎲 Your guess: ${diceResult.playerGuess}\n🎲 Dice result: ${diceResult.diceResult}\n💰 Winnings: +${diceResult.coinsWon} Coins`
                : `${emoji} <b>You Lost!</b>\n\n🎲 Your guess: ${diceResult.playerGuess}\n🎲 Dice result: ${diceResult.diceResult}\n💰 Lost: ${diceResult.coinsLost} Coins`;
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, message, { parseMode: 'HTML' });
            (0, logger_1.logFunctionEnd)('diceGuessCallback', { success: true }, { userId: userInfo.userId, gameId, guess });
        }
        catch (error) {
            (0, logger_1.logError)('diceGuessCallback', error, {});
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Failed to process guess');
        }
    });
    (0, logger_1.logFunctionEnd)('registerDiceHandlers', {}, {});
};
exports.registerDiceHandlers = registerDiceHandlers;
//# sourceMappingURL=handlers.js.map