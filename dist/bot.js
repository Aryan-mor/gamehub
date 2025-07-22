"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const grammy_1 = require("grammy");
const logger_1 = require("./core/logger");
const telegramHelpers_1 = require("./core/telegramHelpers");
const userService_1 = require("./core/userService");
const gameService_1 = require("./core/gameService");
const interfaceHelpers_1 = require("./core/interfaceHelpers");
const trivia_1 = require("./games/trivia");
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
(0, trivia_1.registerTriviaHandlers)(bot);
bot.command('start', async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        (0, logger_1.logFunctionStart)('startCommand', { userId: userInfo.userId });
        await (0, userService_1.setUserProfile)(userInfo.userId, userInfo.username, userInfo.name);
        const userData = await (0, userService_1.getUser)(userInfo.userId);
        let welcome = `🧠 <b>Welcome to GameHub - Trivia Edition!</b>\n\n` +
            `🎯 Challenge your friends in competitive 2-player trivia games!\n\n` +
            `💰 Earn and claim daily Coins with /freecoin!\n\n` +
            `🎯 Choose an action below:`;
        if (userData.coins === 0 && !userData.lastFreeCoinAt) {
            await (0, userService_1.addCoins)(userInfo.userId, 100, 'initial grant');
            welcome = `🎉 You received <b>100 Coins</b> for joining!\n\n` + welcome;
        }
        const buttons = [
            { text: '🧠 Start Trivia', callbackData: { action: 'startgame' } },
            { text: '🪙 Free Coin', callbackData: { action: 'freecoin' } },
            { text: '💰 Balance', callbackData: { action: 'balance' } },
            { text: '❓ Help', callbackData: { action: 'help' } },
        ];
        const keyboard = (0, interfaceHelpers_1.createOptimizedKeyboard)(buttons);
        await (0, interfaceHelpers_1.updateOrSendMessage)(bot, userInfo.chatId, welcome, keyboard, userInfo.userId, 'main_menu');
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
        await handleHelp(bot, userInfo);
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
        await handleBalance(bot, userInfo);
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
        await handleFreeCoin(bot, userInfo);
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
bot.callbackQuery(/.*"action":"back".*/, async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        (0, logger_1.logFunctionStart)('menu_back', {
            userId: userInfo.userId,
            action: 'back'
        });
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
        let welcome = `🧠 <b>Welcome to GameHub - Trivia Edition!</b>\n\n🎯 Challenge your friends in competitive 2-player trivia games!\n\n💰 Earn and claim daily Coins with /freecoin!\n\n🎯 Choose an action below:`;
        const buttons = [
            { text: '🧠 Start Trivia', callbackData: { action: 'startgame' } },
            { text: '🪙 Free Coin', callbackData: { action: 'freecoin' } },
            { text: '💰 Balance', callbackData: { action: 'balance' } },
            { text: '❓ Help', callbackData: { action: 'help' } },
        ];
        const keyboard = (0, interfaceHelpers_1.createOptimizedKeyboard)(buttons);
        await (0, interfaceHelpers_1.updateOrSendMessage)(bot, userInfo.chatId, welcome, keyboard, userInfo.userId, 'main_menu');
        (0, logger_1.logFunctionEnd)('menu_back', {}, { userId: userInfo.userId });
    }
    catch (error) {
        (0, logger_1.logError)('menu_back', error, {});
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Processing failed');
    }
});
bot.callbackQuery(/.*"action":"startgame".*/, async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        (0, logger_1.logFunctionStart)('menu_startgame', {
            userId: userInfo.userId,
            action: 'startgame',
            context: 'main_menu'
        });
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
        await handleStartGame(bot, userInfo);
        (0, logger_1.logFunctionEnd)('menu_startgame', {}, {
            userId: userInfo.userId,
            action: 'startgame',
            context: 'main_menu'
        });
    }
    catch (error) {
        (0, logger_1.logError)('menu_startgame', error, {});
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Processing failed');
    }
});
bot.callbackQuery(/.*"action":"freecoin".*/, async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        (0, logger_1.logFunctionStart)('menu_freecoin', {
            userId: userInfo.userId,
            action: 'freecoin',
            context: 'main_menu'
        });
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
        await handleFreeCoin(bot, userInfo);
        (0, logger_1.logFunctionEnd)('menu_freecoin', {}, {
            userId: userInfo.userId,
            action: 'freecoin',
            context: 'main_menu'
        });
    }
    catch (error) {
        (0, logger_1.logError)('menu_freecoin', error, {});
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Processing failed');
    }
});
bot.callbackQuery(/.*"action":"help".*/, async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        (0, logger_1.logFunctionStart)('menu_help', {
            userId: userInfo.userId,
            action: 'help',
            context: 'main_menu'
        });
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
        await handleHelp(bot, userInfo);
        (0, logger_1.logFunctionEnd)('menu_help', {}, {
            userId: userInfo.userId,
            action: 'help',
            context: 'main_menu'
        });
    }
    catch (error) {
        (0, logger_1.logError)('menu_help', error, {});
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Processing failed');
    }
});
bot.callbackQuery(/.*"action":"balance".*/, async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        (0, logger_1.logFunctionStart)('menu_balance', {
            userId: userInfo.userId,
            action: 'balance',
            context: 'main_menu'
        });
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
        await handleBalance(bot, userInfo);
        (0, logger_1.logFunctionEnd)('menu_balance', {}, {
            userId: userInfo.userId,
            action: 'balance',
            context: 'main_menu'
        });
    }
    catch (error) {
        (0, logger_1.logError)('menu_balance', error, {});
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Processing failed');
    }
});
const handleStartGame = async (bot, userInfo) => {
    const buttons = [
        { text: '🧠 Trivia Game', callbackData: { action: 'trivia_start' } },
    ];
    const keyboard = (0, interfaceHelpers_1.createOptimizedKeyboard)(buttons, true);
    await (0, interfaceHelpers_1.updateOrSendMessage)(bot, userInfo.chatId, '🎮 <b>GameHub - Trivia Focus</b>\n\n🧠 Challenge your friends in a competitive 2-player trivia game!\n\n6 rounds, 3 questions per round. Test your knowledge across 10 categories.', keyboard, userInfo.userId, 'game_selection');
};
const handleFreeCoin = async (bot, userInfo) => {
    const { canClaim, nextClaimIn } = await (0, userService_1.canClaimDaily)(userInfo.userId);
    let message;
    if (canClaim) {
        await (0, userService_1.addCoins)(userInfo.userId, 20, 'daily free coin');
        await (0, userService_1.setLastFreeCoinAt)(userInfo.userId);
        message = `🪙 You claimed <b>+20</b> daily Coins!\n\nCome back tomorrow for more.`;
    }
    else {
        const timeRemaining = formatTimeRemaining(nextClaimIn);
        message = `⏰ You already claimed today.\n\nCome back in <b>${timeRemaining}</b>.`;
    }
    const buttons = [
        { text: '🪙 Claim Again', callbackData: { action: 'freecoin' } },
    ];
    const keyboard = (0, interfaceHelpers_1.createOptimizedKeyboard)(buttons, true);
    await (0, interfaceHelpers_1.updateOrSendMessage)(bot, userInfo.chatId, message, keyboard, userInfo.userId, 'freecoin');
};
const handleHelp = async (bot, userInfo) => {
    const helpText = `<b>GameHub - Trivia Game</b>\n\n` +
        `<b>Available Commands:</b>\n\n` +
        `/start - Start the bot\n` +
        `/trivia - Start a new trivia game\n` +
        `/startgame - Start a new game\n` +
        `/freecoin - Claim your daily free coins\n` +
        `/help - Show this help message\n` +
        `/balance - Show your coin balance\n\n` +
        `<b>How to Play Trivia:</b>\n` +
        `• 2 players compete in 6 rounds\n` +
        `• Each round has 3 questions from one category\n` +
        `• Players take turns choosing categories\n` +
        `• Fast-paced with 10-second time limits\n` +
        `• Win: +20 coins, Draw: +10 coins each\n\n` +
        `<b>Categories:</b>\n` +
        `🌍 Geography, 📚 Literature, ⚽ Sports,\n` +
        `🎬 Entertainment, 🔬 Science, 🎨 Art & Culture,\n` +
        `🍔 Food & Drink, 🌍 History, 🎵 Music, 💻 Technology`;
    const buttons = [
        { text: '📋 Commands', callbackData: { action: 'help' } },
    ];
    const keyboard = (0, interfaceHelpers_1.createOptimizedKeyboard)(buttons, true);
    await (0, interfaceHelpers_1.updateOrSendMessage)(bot, userInfo.chatId, helpText, keyboard, userInfo.userId, 'help');
};
const handleBalance = async (bot, userInfo) => {
    const user = await (0, userService_1.getUser)(userInfo.userId);
    const message = `💰 <b>Your Balance:</b>\n\n<b>${user.coins} Coins</b>`;
    const buttons = [
        { text: '🪙 Free Coin', callbackData: { action: 'freecoin' } },
        { text: '🎮 Start Game', callbackData: { action: 'startgame' } },
    ];
    const keyboard = (0, interfaceHelpers_1.createOptimizedKeyboard)(buttons, true);
    await (0, interfaceHelpers_1.updateOrSendMessage)(bot, userInfo.chatId, message, keyboard, userInfo.userId, 'balance');
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