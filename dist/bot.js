"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const grammy_1 = require("grammy");
const logger_1 = require("./core/logger");
const telegramHelpers_1 = require("./core/telegramHelpers");
const userService_1 = require("./core/userService");
const gameService_1 = require("./core/gameService");
const dice_1 = require("./games/dice");
const basketball_1 = require("./games/basketball");
const football_1 = require("./games/football");
const blackjack_1 = require("./games/blackjack");
const bowling_1 = require("./games/bowling");
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
}
if (!token.match(/^\d+:[A-Za-z0-9_-]+$/)) {
    throw new Error('Invalid TELEGRAM_BOT_TOKEN format. Expected format: <bot_id>:<bot_token>');
}
const bot = new grammy_1.Bot(token);
bot.use(async (ctx, next) => {
    (0, logger_1.logFunctionStart)('botMiddleware', {
        userId: ctx.from?.id?.toString(),
        chatId: ctx.chat?.id?.toString(),
        messageType: ctx.message ? 'message' : 'callback_query'
    });
    try {
        await next();
        (0, logger_1.logFunctionEnd)('botMiddleware', {}, {
            userId: ctx.from?.id?.toString(),
            chatId: ctx.chat?.id?.toString()
        });
    }
    catch (error) {
        (0, logger_1.logError)('botMiddleware', error, {
            userId: ctx.from?.id?.toString(),
            chatId: ctx.chat?.id?.toString()
        });
        throw error;
    }
});
(0, dice_1.registerDiceHandlers)(bot);
(0, basketball_1.registerBasketballHandlers)(bot);
(0, football_1.registerFootballHandlers)(bot);
(0, blackjack_1.registerBlackjackHandlers)(bot);
(0, bowling_1.registerBowlingHandlers)(bot);
bot.command('start', async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        (0, logger_1.logFunctionStart)('startCommand', { userId: userInfo.userId });
        await (0, userService_1.setUserProfile)(userInfo.userId, userInfo.username, userInfo.name);
        const user = await (0, userService_1.getUser)(userInfo.userId);
        let welcome = `🎮 Welcome to GameHub!\n\n💰 Earn and claim daily Coins with /freecoin!\n\n🎯 Choose an action below:`;
        if (user.coins === 0 && !user.lastFreeCoinAt) {
            await (0, userService_1.addCoins)(userInfo.userId, 100, 'initial grant');
            welcome = `🎉 You received 100\u202FCoins for joining!\n\n` + welcome;
        }
        const keyboard = (0, telegramHelpers_1.createInlineKeyboard)([
            { text: '🎮 Start Game', callbackData: { action: 'startgame' } },
            { text: '🪙 Free Coin', callbackData: { action: 'freecoin' } },
            { text: '❓ Help', callbackData: { action: 'help' } },
            { text: '💰 Balance', callbackData: { action: 'balance' } },
        ]);
        await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, welcome, { replyMarkup: keyboard });
        (0, logger_1.logFunctionEnd)('startCommand', {}, { userId: userInfo.userId });
    }
    catch (error) {
        (0, logger_1.logError)('startCommand', error, {});
        await ctx.reply('🎮 Welcome to GameHub!\n\nUse /help to see available commands.');
    }
});
bot.command('help', async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        (0, logger_1.logFunctionStart)('helpCommand', { userId: userInfo.userId });
        const helpText = `Available commands:\n` +
            `/start - Start the bot\n` +
            `/startgame - Start a new game\n` +
            `/freecoin - Claim your daily free coins\n` +
            `/help - Show this help message\n` +
            `/newgame - Create a new game\n` +
            `/games - Show your unfinished games\n` +
            `/stats - Show your game statistics\n` +
            `/balance - Show your coin balance\n` +
            `/dice - Play dice game\n` +
            `/basketball - Play basketball game\n` +
            `/football - Play football game`;
        await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, helpText);
        (0, logger_1.logFunctionEnd)('helpCommand', {}, { userId: userInfo.userId });
    }
    catch (error) {
        (0, logger_1.logError)('helpCommand', error, {});
        await ctx.reply('❌ Failed to show help.');
    }
});
bot.command('balance', async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        (0, logger_1.logFunctionStart)('balanceCommand', { userId: userInfo.userId });
        const user = await (0, userService_1.getUser)(userInfo.userId);
        await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `💰 Your balance: <b>${user.coins}</b> Coins`, {
            parseMode: 'HTML'
        });
        (0, logger_1.logFunctionEnd)('balanceCommand', {}, { userId: userInfo.userId });
    }
    catch (error) {
        (0, logger_1.logError)('balanceCommand', error, {});
        await ctx.reply('❌ Failed to get balance.');
    }
});
bot.command('freecoin', async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        (0, logger_1.logFunctionStart)('freecoinCommand', { userId: userInfo.userId });
        const { canClaim, nextClaimIn } = await (0, userService_1.canClaimDaily)(userInfo.userId);
        if (canClaim) {
            await (0, userService_1.addCoins)(userInfo.userId, 20, 'daily free coin');
            await (0, userService_1.setLastFreeCoinAt)(userInfo.userId);
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `🪙 You claimed <b>+20</b> daily Coins! Come back tomorrow.`, { parseMode: 'HTML' });
        }
        else {
            const timeRemaining = formatTimeRemaining(nextClaimIn);
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `⏰ You already claimed today. Come back in ${timeRemaining}.`);
        }
        (0, logger_1.logFunctionEnd)('freecoinCommand', {}, { userId: userInfo.userId });
    }
    catch (error) {
        (0, logger_1.logError)('freecoinCommand', error, {});
        await ctx.reply('❌ Failed to claim free coins.');
    }
});
bot.command('games', async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        (0, logger_1.logFunctionStart)('gamesCommand', { userId: userInfo.userId });
        const activeGames = await (0, gameService_1.getActiveGamesForUser)(userInfo.userId);
        if (activeGames.length === 0) {
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '📋 You have no unfinished games.');
            (0, logger_1.logFunctionEnd)('gamesCommand', {}, { userId: userInfo.userId });
            return;
        }
        let message = `📋 Your unfinished games (${activeGames.length}):\n\n`;
        for (const game of activeGames) {
            const status = game.status === 'waiting' ? '⏳ Waiting' : '🎮 Playing';
            const stake = game.stake || 0;
            const creatorName = game.players[0]?.name || 'Unknown';
            const joinerName = game.players[1]?.name || 'None';
            message += `🎮 Game: \`${game.id}\`\n`;
            message += `📊 Status: ${status}\n`;
            message += `💰 Stake: ${stake} Coins\n`;
            message += `👤 Creator: ${creatorName}\n`;
            message += `👥 Joiner: ${joinerName}\n\n`;
        }
        await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, message, { parseMode: 'Markdown' });
        (0, logger_1.logFunctionEnd)('gamesCommand', {}, { userId: userInfo.userId });
    }
    catch (error) {
        (0, logger_1.logError)('gamesCommand', error, {});
        await ctx.reply('❌ Failed to fetch your games.');
    }
});
bot.on('callback_query', async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        const data = (0, telegramHelpers_1.parseCallbackData)(ctx.callbackQuery.data || '');
        (0, logger_1.logFunctionStart)('callbackQuery', {
            userId: userInfo.userId,
            action: data.action
        });
        if (['startgame', 'newgame', 'freecoin', 'help', 'balance'].includes(data.action)) {
            await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
            switch (data.action) {
                case 'startgame':
                    await handleStartGame(bot, userInfo);
                    break;
                case 'newgame':
                    await handleNewGame(bot, userInfo, data);
                    break;
                case 'freecoin':
                    await handleFreeCoin(bot, userInfo);
                    break;
                case 'help':
                    await handleHelp(bot, userInfo);
                    break;
                case 'balance':
                    await handleBalance(bot, userInfo);
                    break;
            }
            (0, logger_1.logFunctionEnd)('callbackQuery', {}, { userId: userInfo.userId, action: data.action });
        }
        else {
            console.log(`🎮 Game callback received: ${data.action} for user ${userInfo.userId}`);
        }
    }
    catch (error) {
        (0, logger_1.logError)('callbackQuery', error, {});
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Processing failed');
    }
});
const triggerDiceGame = async (bot, userInfo) => {
    const stakeKeyboard = (0, telegramHelpers_1.createInlineKeyboard)([
        { text: '2 Coins', callbackData: { action: 'dice_stake', stake: 2 } },
        { text: '5 Coins', callbackData: { action: 'dice_stake', stake: 5 } },
        { text: '10 Coins', callbackData: { action: 'dice_stake', stake: 10 } },
        { text: '20 Coins', callbackData: { action: 'dice_stake', stake: 20 } },
    ]);
    await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '🎲 Dice Guess Game\n\nChoose your stake amount:', { replyMarkup: stakeKeyboard });
};
const triggerBasketballGame = async (bot, userInfo) => {
    const stakeKeyboard = (0, telegramHelpers_1.createInlineKeyboard)([
        { text: '2 Coins', callbackData: { action: 'basketball_stake', stake: 2 } },
        { text: '5 Coins', callbackData: { action: 'basketball_stake', stake: 5 } },
        { text: '10 Coins', callbackData: { action: 'basketball_stake', stake: 10 } },
        { text: '20 Coins', callbackData: { action: 'basketball_stake', stake: 20 } },
    ]);
    await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '🏀 Basketball Game\n\nGuess if you will score or miss!\n\nChoose your stake amount:', { replyMarkup: stakeKeyboard });
};
const triggerFootballGame = async (bot, userInfo) => {
    const stakeKeyboard = (0, telegramHelpers_1.createInlineKeyboard)([
        { text: '2 Coins', callbackData: { action: 'football_stake', stake: 2 } },
        { text: '5 Coins', callbackData: { action: 'football_stake', stake: 5 } },
        { text: '10 Coins', callbackData: { action: 'football_stake', stake: 10 } },
        { text: '20 Coins', callbackData: { action: 'football_stake', stake: 20 } },
    ]);
    await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '⚽️ Football Game\n\nPredict the ball direction!\n\nChoose your stake amount:', { replyMarkup: stakeKeyboard });
};
const triggerBlackjackGame = async (bot, userInfo) => {
    const stakeKeyboard = (0, telegramHelpers_1.createInlineKeyboard)([
        { text: '2 Coins', callbackData: { action: 'blackjack_stake', stake: 2 } },
        { text: '5 Coins', callbackData: { action: 'blackjack_stake', stake: 5 } },
        { text: '10 Coins', callbackData: { action: 'blackjack_stake', stake: 10 } },
        { text: '20 Coins', callbackData: { action: 'blackjack_stake', stake: 20 } },
        { text: '30 Coins', callbackData: { action: 'blackjack_stake', stake: 30 } },
        { text: '50 Coins', callbackData: { action: 'blackjack_stake', stake: 50 } },
    ]);
    await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '🃏 Blackjack Game\n\nBeat the dealer to 21!\n\nChoose your stake amount:', { replyMarkup: stakeKeyboard });
};
const triggerBowlingGame = async (bot, userInfo) => {
    const stakeKeyboard = (0, telegramHelpers_1.createInlineKeyboard)([
        { text: '2 Coins', callbackData: { action: 'bowling_stake', stake: 2 } },
        { text: '5 Coins', callbackData: { action: 'bowling_stake', stake: 5 } },
        { text: '10 Coins', callbackData: { action: 'bowling_stake', stake: 10 } },
        { text: '20 Coins', callbackData: { action: 'bowling_stake', stake: 20 } },
    ]);
    await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '🎳 Bowling Game\n\nRoll the dice to knock down pins!\n\nChoose your stake amount:', { replyMarkup: stakeKeyboard });
};
const handleNewGame = async (bot, userInfo, data) => {
    const gameType = data.gameType;
    if (!gameType) {
        await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '❌ Invalid game selection.');
        return;
    }
    switch (gameType) {
        case 'dice':
            await triggerDiceGame(bot, userInfo);
            break;
        case 'basketball':
            await triggerBasketballGame(bot, userInfo);
            break;
        case 'football':
            await triggerFootballGame(bot, userInfo);
            break;
        case 'blackjack':
            await triggerBlackjackGame(bot, userInfo);
            break;
        case 'bowling':
            await triggerBowlingGame(bot, userInfo);
            break;
        default:
            await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '❌ Unknown game type.');
            return;
    }
};
const handleStartGame = async (bot, userInfo) => {
    const singlePlayerKeyboard = (0, telegramHelpers_1.createInlineKeyboard)([
        { text: '🎲 Dice Game', callbackData: { action: 'newgame', gameType: 'dice' } },
        { text: '🏀 Basketball Game', callbackData: { action: 'newgame', gameType: 'basketball' } },
        { text: '⚽️ Football Game', callbackData: { action: 'newgame', gameType: 'football' } },
        { text: '🃏 Blackjack Game', callbackData: { action: 'newgame', gameType: 'blackjack' } },
        { text: '🎳 Bowling Game', callbackData: { action: 'newgame', gameType: 'bowling' } },
    ]);
    await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, '🎮 Choose a game to play:\n\n*Single-player games available in bot chat*', { replyMarkup: singlePlayerKeyboard, parseMode: 'Markdown' });
};
const handleFreeCoin = async (bot, userInfo) => {
    const { canClaim, nextClaimIn } = await (0, userService_1.canClaimDaily)(userInfo.userId);
    if (canClaim) {
        await (0, userService_1.addCoins)(userInfo.userId, 20, 'daily free coin');
        await (0, userService_1.setLastFreeCoinAt)(userInfo.userId);
        await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `🪙 You claimed <b>+20</b> daily Coins! Come back tomorrow.`, { parseMode: 'HTML' });
    }
    else {
        const timeRemaining = formatTimeRemaining(nextClaimIn);
        await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `⏰ You already claimed today. Come back in ${timeRemaining}.`);
    }
};
const handleHelp = async (bot, userInfo) => {
    const helpText = `Available commands:\n` +
        `/start - Start the bot\n` +
        `/startgame - Start a new game\n` +
        `/freecoin - Claim your daily free coins\n` +
        `/help - Show this help message\n` +
        `/newgame - Create a new game\n` +
        `/games - Show your unfinished games\n` +
        `/stats - Show your game statistics\n` +
        `/balance - Show your coin balance\n` +
        `/dice - Play dice game\n` +
        `/basketball - Play basketball game\n` +
        `/football - Play football game\n` +
        `/blackjack - Play blackjack game\n` +
        `/bowling - Play bowling game`;
    await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, helpText);
};
const handleBalance = async (bot, userInfo) => {
    const user = await (0, userService_1.getUser)(userInfo.userId);
    await (0, telegramHelpers_1.sendMessage)(bot, userInfo.chatId, `💰 Your balance: <b>${user.coins}</b> Coins`, {
        parseMode: 'HTML'
    });
};
const formatTimeRemaining = (milliseconds) => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
bot.catch((err) => {
    (0, logger_1.logError)('botError', err.error, {});
    console.error('Bot error:', err.error);
});
const startBot = async () => {
    (0, logger_1.logFunctionStart)('startBot', {});
    try {
        console.log('🚀 Starting GameHub bot...');
        await bot.api.setMyCommands([
            { command: 'start', description: 'Start the bot' },
            { command: 'startgame', description: 'Start a new game' },
            { command: 'freecoin', description: 'Claim your daily free coins' },
            { command: 'help', description: 'Show help information' },
            { command: 'newgame', description: 'Create a new game' },
            { command: 'games', description: 'Show your unfinished games' },
            { command: 'stats', description: 'Show your game statistics' },
            { command: 'balance', description: 'Show your coin balance' },
            { command: 'dice', description: 'Play dice game' },
            { command: 'basketball', description: 'Play basketball game' },
            { command: 'football', description: 'Play football game' },
            { command: 'blackjack', description: 'Play blackjack game' },
            { command: 'bowling', description: 'Play bowling game' },
        ]);
        console.log('✅ Bot commands set successfully');
        await bot.start();
        console.log('🎮 GameHub bot is running!');
        (0, logger_1.logFunctionEnd)('startBot', {}, {});
    }
    catch (error) {
        (0, logger_1.logError)('startBot', error, {});
        console.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
};
process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());
startBot();
//# sourceMappingURL=bot.js.map