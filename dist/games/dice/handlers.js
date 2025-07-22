"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDiceHandlers = void 0;
const logger_1 = require("../../core/logger");
const telegramHelpers_1 = require("../../core/telegramHelpers");
const index_1 = require("./index");
const gameService_1 = require("../../core/gameService");
const interfaceHelpers_1 = require("../../core/interfaceHelpers");
const registerDiceHandlers = (bot) => {
    (0, logger_1.logFunctionStart)('registerDiceHandlers', {});
    bot.command('dice', async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            (0, logger_1.logFunctionStart)('diceCommand', { userId: userInfo.userId });
            const buttons = [
                { text: '2 Coins', callbackData: { action: 'dice_stake', stake: 2 } },
                { text: '5 Coins', callbackData: { action: 'dice_stake', stake: 5 } },
                { text: '10 Coins', callbackData: { action: 'dice_stake', stake: 10 } },
                { text: '20 Coins', callbackData: { action: 'dice_stake', stake: 20 } },
            ];
            const stakeKeyboard = (0, interfaceHelpers_1.createOptimizedKeyboard)(buttons, true);
            await (0, interfaceHelpers_1.updateGameMessage)(bot, userInfo.chatId, '🎲 <b>Dice Game</b>\n\nGuess the dice number!\n\nChoose your stake amount:', stakeKeyboard, userInfo.userId, 'dice', 'stake_selection');
            (0, logger_1.logFunctionEnd)('diceCommand', {}, { userId: userInfo.userId });
        }
        catch (error) {
            (0, logger_1.logError)('diceCommand', error, {});
            await ctx.reply('❌ Failed to start dice game.');
        }
    });
    bot.callbackQuery(/.*"action":"dice_stake".*/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const data = (0, telegramHelpers_1.parseCallbackData)(ctx.callbackQuery.data);
            const stake = data.stake;
            (0, logger_1.logFunctionStart)('diceStakeCallback', { userId: userInfo.userId, stake });
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            const result = await (0, index_1.startDiceGame)(userInfo.userId, stake);
            if (!result.success) {
                await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${result.error}`);
                (0, logger_1.logFunctionEnd)('diceStakeCallback', { success: false }, { userId: userInfo.userId, stake });
                return;
            }
            const buttons = [
                { text: '1', callbackData: { action: 'dice_guess', g: result.gameId, n: 1 } },
                { text: '2', callbackData: { action: 'dice_guess', g: result.gameId, n: 2 } },
                { text: '3', callbackData: { action: 'dice_guess', g: result.gameId, n: 3 } },
                { text: '4', callbackData: { action: 'dice_guess', g: result.gameId, n: 4 } },
                { text: '5', callbackData: { action: 'dice_guess', g: result.gameId, n: 5 } },
                { text: '6', callbackData: { action: 'dice_guess', g: result.gameId, n: 6 } },
            ];
            const guessKeyboard = (0, interfaceHelpers_1.createOptimizedKeyboard)(buttons);
            await (0, interfaceHelpers_1.updateGameMessage)(bot, userInfo.chatId, `🎲 <b>Dice Game Started!</b>\n\n💰 Stake: <b>${stake} Coins</b>\n\nGuess the dice number (1-6):`, guessKeyboard, userInfo.userId, 'dice', 'option_selection', result.gameId, stake);
            (0, logger_1.logFunctionEnd)('diceStakeCallback', { success: true }, { userId: userInfo.userId, stake });
        }
        catch (error) {
            (0, logger_1.logError)('diceStakeCallback', error, {});
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Failed to start game');
        }
    });
    bot.callbackQuery(/.*"action":"dice_guess".*/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const data = (0, telegramHelpers_1.parseCallbackData)(ctx.callbackQuery.data);
            const gameId = data.g;
            const guess = data.n;
            (0, logger_1.logFunctionStart)('diceGuessCallback', { userId: userInfo.userId, gameId, guess });
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            const result = await (0, index_1.handleDiceTurn)(gameId, guess);
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
            const playAgainKeyboard = {
                inline_keyboard: [
                    [{ text: '🔄 Same Stake & Guess', callback_data: `dice_play_again_same_${gameId}_${diceResult.coinsLost || diceResult.coinsWon}_${guess}` }],
                    [{ text: '🎲 New Guess', callback_data: `dice_play_again_new_guess_${gameId}_${diceResult.coinsLost || diceResult.coinsWon}` }],
                    [{ text: '🔄 Start Over', callback_data: 'dice_play_again_restart' }]
                ]
            };
            const game = await (0, gameService_1.getGame)(gameId);
            const gameStake = game?.stake || 0;
            await (0, interfaceHelpers_1.updateGameMessage)(bot, userInfo.chatId, message, playAgainKeyboard, userInfo.userId, 'dice', 'result', gameId, gameStake);
            (0, logger_1.logFunctionEnd)('diceGuessCallback', { success: true }, { userId: userInfo.userId, gameId, guess });
        }
        catch (error) {
            (0, logger_1.logError)('diceGuessCallback', error, {});
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Failed to process guess');
        }
    });
    bot.callbackQuery(/^dice_play_again_.*/, async (ctx) => {
        try {
            const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
            const callbackData = ctx.callbackQuery.data || '';
            console.log('🔍 DEBUG - ENTRY: dicePlayAgainCallback called');
            console.log('🔍 DEBUG - Raw callback data:', callbackData);
            console.log('🔍 DEBUG - Callback data type:', typeof callbackData);
            console.log('🔍 DEBUG - Callback data length:', callbackData.length);
            (0, logger_1.logFunctionStart)('dicePlayAgainCallback', { userId: userInfo.userId, callbackData });
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            if (callbackData === 'dice_play_again_restart') {
                const buttons = [
                    { text: '2 Coins', callbackData: { action: 'dice_stake', stake: 2 } },
                    { text: '5 Coins', callbackData: { action: 'dice_stake', stake: 5 } },
                    { text: '10 Coins', callbackData: { action: 'dice_stake', stake: 10 } },
                    { text: '20 Coins', callbackData: { action: 'dice_stake', stake: 20 } },
                ];
                const stakeKeyboard = (0, interfaceHelpers_1.createOptimizedKeyboard)(buttons, true);
                await (0, interfaceHelpers_1.updateGameMessage)(bot, userInfo.chatId, '🎲 <b>Dice Game</b>\n\nGuess the dice number!\n\nChoose your stake amount:', stakeKeyboard, userInfo.userId, 'dice', 'stake_selection');
            }
            else {
                console.log('🔍 DEBUG - About to parse callback data:', callbackData);
                console.log('🔍 DEBUG - Callback data length:', callbackData.length);
                console.log('🔍 DEBUG - Callback data type:', typeof callbackData);
                const parts = callbackData.split('_');
                console.log('🔍 DEBUG - Split parts:', parts);
                if (parts.length < 6) {
                    console.log('🔍 DEBUG - Not enough parts, showing error');
                    await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
                    return;
                }
                const type = parts[3];
                if (type === 'new') {
                    const gameId = `${parts[5]}_${parts[6]}_${parts[7]}`;
                    const stake = parseInt(parts[parts.length - 1]);
                    const guess = null;
                    console.log('🔍 DEBUG - Manual parsed values:', { type, gameId, stake, guess });
                    const originalGame = await (0, gameService_1.getGame)(gameId);
                    if (!originalGame) {
                        await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '❌ Original game not found');
                        return;
                    }
                    const actualStake = originalGame.stake;
                    console.log('🔍 DEBUG - Using original stake:', actualStake);
                    const result = await (0, index_1.startDiceGame)(userInfo.userId, actualStake);
                    if (!result.success) {
                        await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${result.error}`);
                        return;
                    }
                    if (!result.gameId) {
                        await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ Failed to create game`);
                        return;
                    }
                    console.log('🔍 DEBUG - Taking NEW GUESS path');
                    const buttons = [
                        { text: '1', callbackData: { action: 'dice_guess', g: result.gameId, n: 1 } },
                        { text: '2', callbackData: { action: 'dice_guess', g: result.gameId, n: 2 } },
                        { text: '3', callbackData: { action: 'dice_guess', g: result.gameId, n: 3 } },
                        { text: '4', callbackData: { action: 'dice_guess', g: result.gameId, n: 4 } },
                        { text: '5', callbackData: { action: 'dice_guess', g: result.gameId, n: 5 } },
                        { text: '6', callbackData: { action: 'dice_guess', g: result.gameId, n: 6 } },
                    ];
                    const guessKeyboard = (0, interfaceHelpers_1.createOptimizedKeyboard)(buttons);
                    await (0, interfaceHelpers_1.updateGameMessage)(bot, userInfo.chatId, `🎲 <b>Dice Game Started!</b>\n\n💰 Stake: <b>${actualStake} Coins</b>\n\nGuess the dice number (1-6):`, guessKeyboard, userInfo.userId, 'dice', 'option_selection', result.gameId, actualStake);
                }
                else if (type === 'same') {
                    const gameId = `${parts[4]}_${parts[5]}_${parts[6]}`;
                    const stake = parseInt(parts[parts.length - 2]);
                    const guess = parseInt(parts[parts.length - 1]);
                    console.log('🔍 DEBUG - Manual parsed values:', { type, gameId, stake, guess });
                    const originalGame = await (0, gameService_1.getGame)(gameId);
                    if (!originalGame) {
                        await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '❌ Original game not found');
                        return;
                    }
                    const actualStake = originalGame.stake;
                    console.log('🔍 DEBUG - Using original stake:', actualStake);
                    const result = await (0, index_1.startDiceGame)(userInfo.userId, actualStake);
                    if (!result.success) {
                        await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${result.error}`);
                        return;
                    }
                    if (!result.gameId) {
                        await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ Failed to create game`);
                        return;
                    }
                    console.log('🔍 DEBUG - Taking SAME path with guess:', guess);
                    const turnResult = await (0, index_1.handleDiceTurn)(result.gameId, guess);
                    if (!turnResult.success) {
                        await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `❌ ${turnResult.error}`);
                        return;
                    }
                    const diceResult = turnResult.result;
                    const emoji = diceResult.isWon ? '🎉' : '😔';
                    const message = diceResult.isWon
                        ? `${emoji} <b>You Won!</b>\n\n🎲 Your guess: ${diceResult.playerGuess}\n🎲 Dice result: ${diceResult.diceResult}\n💰 Winnings: +${diceResult.coinsWon} Coins`
                        : `${emoji} <b>You Lost!</b>\n\n🎲 Your guess: ${diceResult.playerGuess}\n🎲 Dice result: ${diceResult.diceResult}\n💰 Lost: ${diceResult.coinsLost} Coins`;
                    const playAgainKeyboard = {
                        inline_keyboard: [
                            [{ text: '🔄 Same Stake & Guess', callback_data: `dice_play_again_same_${result.gameId}_${diceResult.coinsLost || diceResult.coinsWon}_${guess}` }],
                            [{ text: '🎲 New Guess', callback_data: `dice_play_again_new_guess_${result.gameId}_${diceResult.coinsLost || diceResult.coinsWon}` }],
                            [{ text: '🔄 Start Over', callback_data: 'dice_play_again_restart' }]
                        ]
                    };
                    await (0, interfaceHelpers_1.updateGameMessage)(bot, userInfo.chatId, message, playAgainKeyboard, userInfo.userId, 'dice', 'result', result.gameId, actualStake);
                }
                return;
            }
            (0, logger_1.logFunctionEnd)('dicePlayAgainCallback', { success: true }, { userId: userInfo.userId });
        }
        catch (error) {
            (0, logger_1.logError)('dicePlayAgainCallback', error, {});
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Failed to start new game');
        }
    });
    (0, logger_1.logFunctionEnd)('registerDiceHandlers', {}, {});
};
exports.registerDiceHandlers = registerDiceHandlers;
//# sourceMappingURL=handlers.js.map