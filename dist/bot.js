"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const grammy_1 = require("grammy");
const logger_1 = require("./modules/core/logger");
const telegramHelpers_1 = require("./modules/core/telegramHelpers");
const gameService_1 = require("./modules/core/gameService");
const interfaceHelpers_1 = require("./modules/core/interfaceHelpers");
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
bot.use(async (ctx, next) => {
    if (ctx.callbackQuery) {
        console.log(`🔘 Callback received from ${ctx.from?.id} (${ctx.from?.username}): ${ctx.callbackQuery.data || 'No data'}`);
    }
    await next();
});
bot.command('start', async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        const startPayload = ctx.message?.text?.split(' ')[1];
        (0, logger_1.logFunctionStart)('startCommand', { userId: userInfo.userId, startPayload });
        if (startPayload && startPayload.startsWith('room_')) {
            const roomId = startPayload.substring(5);
            console.log(`Processing room join via start payload: ${roomId}`);
            const { dispatch } = await Promise.resolve().then(() => __importStar(require('./modules/core/smart-router')));
            const context = {
                ctx,
                user: {
                    id: userInfo.userId,
                    username: userInfo.username || 'Unknown'
                }
            };
            await dispatch('games.poker.room.join', context, { roomId, isDirectLink: 'true' });
            (0, logger_1.logFunctionEnd)('startCommand', {}, { userId: userInfo.userId, action: 'roomJoin' });
            return;
        }
        const { dispatch } = await Promise.resolve().then(() => __importStar(require('./modules/core/smart-router')));
        const context = {
            ctx,
            user: {
                id: userInfo.userId,
                username: userInfo.username || 'Unknown'
            }
        };
        await dispatch('start', context);
        (0, logger_1.logFunctionEnd)('startCommand', {}, { userId: userInfo.userId, action: 'regular' });
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
        const { dispatch } = await Promise.resolve().then(() => __importStar(require('./modules/core/smart-router')));
        const context = {
            ctx,
            user: {
                id: userInfo.userId,
                username: userInfo.username || 'Unknown'
            }
        };
        await dispatch('help', context);
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
        const { dispatch } = await Promise.resolve().then(() => __importStar(require('./modules/core/smart-router')));
        const context = {
            ctx,
            user: {
                id: userInfo.userId,
                username: userInfo.username || 'Unknown'
            }
        };
        await dispatch('balance', context);
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
        const { dispatch } = await Promise.resolve().then(() => __importStar(require('./modules/core/smart-router')));
        const context = {
            ctx,
            user: {
                id: userInfo.userId,
                username: userInfo.username || 'Unknown'
            }
        };
        await dispatch('financial.freecoin', context);
        (0, logger_1.logFunctionEnd)('freecoinCommand', {}, { userId: userInfo.userId });
    }
    catch (error) {
        (0, logger_1.logError)('freecoinCommand', error, {});
        await ctx.reply('❌ Failed to claim free coins.');
    }
});
bot.command('poker', async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        (0, logger_1.logFunctionStart)('pokerCommand', { userId: userInfo.userId });
        const { dispatch } = await Promise.resolve().then(() => __importStar(require('./modules/core/smart-router')));
        const context = {
            ctx,
            user: {
                id: userInfo.userId,
                username: userInfo.username || 'Unknown'
            }
        };
        await dispatch('games.poker.start', context);
        (0, logger_1.logFunctionEnd)('pokerCommand', {}, { userId: userInfo.userId });
    }
    catch (error) {
        (0, logger_1.logError)('pokerCommand', error, {});
        await ctx.reply('❌ Failed to start poker game.');
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
        const { key: gamesStartKey } = await Promise.resolve().then(() => __importStar(require('./actions/games/start')));
        const { key: freecoinKey } = await Promise.resolve().then(() => __importStar(require('./actions/financial/freecoin')));
        const { key: balanceKey } = await Promise.resolve().then(() => __importStar(require('./actions/balance')));
        const { key: helpKey } = await Promise.resolve().then(() => __importStar(require('./actions/help')));
        const welcome = `🃏 <b>Welcome to GameHub - Poker Edition!</b>\n\n🎯 Challenge your friends in competitive poker games!\n\n💰 Earn and claim daily Coins with /freecoin!\n\n🎯 Choose an action below:`;
        const buttons = [
            { text: '🃏 Start Poker', callbackData: { action: gamesStartKey } },
            { text: '🪙 Free Coin', callbackData: { action: freecoinKey } },
            { text: '💰 Balance', callbackData: { action: balanceKey } },
            { text: '❓ Help', callbackData: { action: helpKey } },
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
bot.callbackQuery(/.*"action":"games\.start".*/, async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        (0, logger_1.logFunctionStart)('menu_startgame', {
            userId: userInfo.userId,
            action: 'startgame',
            context: 'main_menu'
        });
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
        const { dispatch } = await Promise.resolve().then(() => __importStar(require('./modules/core/smart-router')));
        const context = {
            ctx,
            user: {
                id: userInfo.userId,
                username: userInfo.username || 'Unknown'
            }
        };
        await dispatch('games.start', context);
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
bot.callbackQuery(/.*"action":"games\.poker\.start".*/, async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        (0, logger_1.logFunctionStart)('menu_poker_start', {
            userId: userInfo.userId,
            action: 'poker_start',
            context: 'game_selection'
        });
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
        const { dispatch } = await Promise.resolve().then(() => __importStar(require('./modules/core/smart-router')));
        const context = {
            ctx,
            user: {
                id: userInfo.userId,
                username: userInfo.username || 'Unknown'
            }
        };
        await dispatch('games.poker.start', context);
        (0, logger_1.logFunctionEnd)('menu_poker_start', {}, {
            userId: userInfo.userId,
            action: 'poker_start',
            context: 'game_selection'
        });
    }
    catch (error) {
        (0, logger_1.logError)('menu_poker_start', error, {});
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Processing failed');
    }
});
bot.callbackQuery(/.*"action":"games\.poker\.room\..*/, async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        const data = (0, telegramHelpers_1.parseCallbackData)(ctx.callbackQuery.data || '');
        const action = data.action;
        (0, logger_1.logFunctionStart)('poker_room_action', {
            userId: userInfo.userId,
            action: action,
            context: 'poker_room',
            roomId: data.roomId || 'none'
        });
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
        const { dispatch } = await Promise.resolve().then(() => __importStar(require('./modules/core/smart-router')));
        const context = {
            ctx,
            user: {
                id: userInfo.userId,
                username: userInfo.username || 'Unknown'
            }
        };
        const query = {};
        if (data.roomId)
            query.roomId = data.roomId;
        if (data.amount)
            query.amount = data.amount;
        if (data.userId)
            query.userId = data.userId;
        context.query = query;
        await dispatch(action, context);
        (0, logger_1.logFunctionEnd)('poker_room_action', {}, {
            userId: userInfo.userId,
            action: action,
            context: 'poker_room'
        });
    }
    catch (error) {
        (0, logger_1.logError)('poker_room_action', error, {});
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Processing failed');
    }
});
bot.callbackQuery(/^[a-z0-9]{2,4}(\?.*)?$/, async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        const callbackData = ctx.callbackQuery.data || '';
        (0, logger_1.logFunctionStart)('poker_compact_action', {
            userId: userInfo.userId,
            callbackData,
            context: 'poker_compact'
        });
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
        const { dispatch, parseCallbackData } = await Promise.resolve().then(() => __importStar(require('./modules/core/compact-router')));
        const context = {
            ctx,
            user: {
                id: userInfo.userId,
                username: userInfo.username || 'Unknown'
            }
        };
        const { code, params } = parseCallbackData(callbackData);
        context.query = params;
        await dispatch(code, context, params);
        (0, logger_1.logFunctionEnd)('poker_compact_action', {}, {
            userId: userInfo.userId,
            code,
            context: 'poker_compact'
        });
    }
    catch (error) {
        (0, logger_1.logError)('poker_compact_action', error, {});
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id, '❌ Processing failed');
    }
});
bot.callbackQuery(/.*"action":"financial\.freecoin".*/, async (ctx) => {
    try {
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        (0, logger_1.logFunctionStart)('menu_freecoin', {
            userId: userInfo.userId,
            action: 'freecoin',
            context: 'main_menu'
        });
        await (0, telegramHelpers_1.answerCallbackQuery)(bot, ctx.callbackQuery.id);
        const { dispatch } = await Promise.resolve().then(() => __importStar(require('./modules/core/smart-router')));
        const context = {
            ctx,
            user: {
                id: userInfo.userId,
                username: userInfo.username || 'Unknown'
            }
        };
        await dispatch('financial.freecoin', context);
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
        const { dispatch } = await Promise.resolve().then(() => __importStar(require('./modules/core/smart-router')));
        const context = {
            ctx,
            user: {
                id: userInfo.userId,
                username: userInfo.username || 'Unknown'
            }
        };
        await dispatch('help', context);
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
        const { dispatch } = await Promise.resolve().then(() => __importStar(require('./modules/core/smart-router')));
        const context = {
            ctx,
            user: {
                id: userInfo.userId,
                username: userInfo.username || 'Unknown'
            }
        };
        await dispatch('balance', context);
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
bot.catch((err) => {
    (0, logger_1.logError)('botError', err.error, {});
    console.error('Bot error:', err.error);
});
const startBot = async () => {
    (0, logger_1.logFunctionStart)('startBot', {});
    try {
        console.log('🚀 Starting GameHub bot...');
        await Promise.resolve().then(() => __importStar(require('./actions/games/poker')));
        console.log('✅ Poker handlers self-registered with compact router');
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
        console.log('🎮 GameHub bot is running!');
        (0, logger_1.logFunctionEnd)('startBot', {}, {});
        await bot.start();
    }
    catch (error) {
        (0, logger_1.logError)('startBot', error, {});
        console.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
};
let isShuttingDown = false;
const gracefulShutdown = (signal) => {
    if (isShuttingDown) {
        console.log(`🛑 Force shutting down due to ${signal}...`);
        process.exit(1);
    }
    isShuttingDown = true;
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    process.exit(0);
};
process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
startBot();
bot.on('message', async (ctx) => {
    try {
        if (!ctx.message?.text) {
            return;
        }
        const userInfo = (0, telegramHelpers_1.extractUserInfo)(ctx);
        const text = ctx.message.text;
        const { isUserInRoomCreationForm, handleRoomNameInput } = await Promise.resolve().then(() => __importStar(require('./actions/games/poker/room/create/textHandler')));
        if (isUserInRoomCreationForm(userInfo.userId.toString())) {
            const handled = await handleRoomNameInput({
                ctx,
                user: {
                    id: userInfo.userId,
                    username: userInfo.username || 'Unknown'
                }
            }, text);
            if (handled) {
                return;
            }
        }
    }
    catch (error) {
        (0, logger_1.logError)('messageHandler', error, {});
    }
});
bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query;
    if (query.startsWith('trivia_')) {
        const gameId = query.substring(7);
        if (gameId) {
            const results = [
                {
                    type: 'article',
                    id: `share_${gameId}`,
                    title: '🧠 Share Trivia Game',
                    input_message_content: {
                        message_text: `🧠 <b>Trivia Challenge!</b>\n\nI've started a new trivia game. Click below to join and test your knowledge!`,
                        parse_mode: 'HTML',
                    },
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🎮 Join Game', callback_data: JSON.stringify({ action: 'trivia_join', gameId }) }]
                        ]
                    }
                }
            ];
            await ctx.answerInlineQuery(results, { cache_time: 0 });
        }
    }
});
//# sourceMappingURL=bot.js.map