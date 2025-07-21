"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerXoTelegramHandlers = registerXoTelegramHandlers;
const game_1 = require("./game");
const logic_1 = require("./logic");
const userStats_1 = require("../../bot/games/userStats");
const coinService_1 = require("../../lib/coinService");
const dice_1 = require("../../bot/games/dice");
const blackjack_1 = require("../../bot/games/blackjack");
const football_1 = require("../../bot/games/football");
const basketball_1 = require("../../bot/games/basketball");
const gameService_1 = require("../../lib/gameService");
function registerXoTelegramHandlers(bot) {
    bot.onText(/\/newgame/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id;
        const isBotChat = msg.chat.type === "private";
        if (!userId) {
            await bot.sendMessage(chatId, "❌ Unable to identify user");
            return;
        }
        if (isBotChat) {
            const singlePlayerKeyboard = {
                inline_keyboard: [
                    [{ text: "🎲 Dice Game", callback_data: "newgame:dice" }],
                    [{ text: "🃏 Blackjack Game", callback_data: "newgame:blackjack" }],
                    [{ text: "⚽️ Football Game", callback_data: "newgame:football" }],
                    [{ text: "🏀 Basketball Game", callback_data: "newgame:basketball" }],
                ],
            };
            await bot.sendMessage(chatId, "🎮 Choose a game to play:\n\n*Single-player games available in bot chat*", {
                reply_markup: singlePlayerKeyboard,
                parse_mode: "Markdown",
            });
        }
        else {
            const allGamesKeyboard = {
                inline_keyboard: [
                    [
                        { text: "🎮 X/O Game", callback_data: "newgame:xo" },
                        { text: "🎲 Dice Game", callback_data: "newgame:dice" },
                    ],
                    [{ text: "🃏 Blackjack Game", callback_data: "newgame:blackjack" }],
                    [
                        { text: "⚽️ Football Game", callback_data: "newgame:football" },
                        { text: "🏀 Basketball Game", callback_data: "newgame:basketball" },
                    ],
                ],
            };
            await bot.sendMessage(chatId, "🎮 Choose a game to play:\n\n*All games available in group chat*", {
                reply_markup: allGamesKeyboard,
                parse_mode: "Markdown",
            });
        }
    });
    bot.onText(/\/join (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const userId = msg.from?.id;
        const gameId = match && match[1];
        if (!userId || !gameId) {
            await bot.sendMessage(chatId, "❌ Please provide a valid game ID: /join &lt;gameId&gt;");
            return;
        }
        try {
            const gameState = await (0, game_1.joinXoGame)(gameId, userId.toString(), msg.from?.first_name || "Player");
            if (!gameState) {
                await bot.sendMessage(chatId, "❌ Game not found or already full.");
                return;
            }
            const boardMessage = (0, game_1.formatXoBoard)(gameState.board);
            const stakeInfo = `🎮 X/O Game – Stake: ${gameState.stake} Coins\n\n`;
            const statusMessage = `🎯 It's ${gameState.players[gameState.currentPlayer]?.name ||
                gameState.currentPlayer}'s turn`;
            await bot.sendMessage(chatId, `${stakeInfo}${boardMessage}\n\n${statusMessage}`);
            console.log(`[XO] /join: user ${userId} joined game ${gameId}`);
        }
        catch (error) {
            if (error instanceof Error && error.message === "Insufficient coins") {
                await handleInsufficientCoins(bot, chatId, msg.message_id);
            }
            else if (error instanceof Error) {
                await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            }
            else {
                await bot.sendMessage(chatId, `❌ Error occurred.`);
            }
        }
    });
    bot.on("callback_query", async (callbackQuery) => {
        const userId = callbackQuery.from?.id;
        const data = callbackQuery.data;
        let chatId = callbackQuery.message?.chat.id;
        if (!chatId && callbackQuery.inline_message_id)
            chatId = userId;
        if (!userId || !data || !chatId)
            return;
        const parts = data.split(":");
        const action = parts[0];
        const gameId = parts[1];
        const position = parts[2];
        console.log(`[BOT] Callback query received: data=${data}, userId=${userId}`);
        if (action === "newgame" && parts[1]) {
            const gameType = parts[1];
            console.log(`[BOT] newgame selection: userId=${userId}, gameType=${gameType}`);
            if (gameType === "dice") {
                const stakeKeyboard = {
                    inline_keyboard: [
                        [
                            { text: "2 Coins", callback_data: `dice_stake:2` },
                            { text: "5 Coins", callback_data: `dice_stake:5` },
                        ],
                        [
                            { text: "10 Coins", callback_data: `dice_stake:10` },
                            { text: "20 Coins", callback_data: `dice_stake:20` },
                        ],
                    ],
                };
                const text = "🎲 Dice Guess Game\n\nChoose your stake amount:";
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText(text, {
                        inline_message_id: inlineMessageId,
                        reply_markup: stakeKeyboard,
                    });
                }
                else if (chatId && callbackQuery.message?.message_id) {
                    await bot.editMessageText(text, {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
                        reply_markup: stakeKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                return;
            }
            if (gameType === "football") {
                const stakeKeyboard = {
                    inline_keyboard: [
                        [
                            { text: "2 Coins", callback_data: `football_stake:2` },
                            { text: "5 Coins", callback_data: `football_stake:5` },
                        ],
                        [
                            { text: "10 Coins", callback_data: `football_stake:10` },
                            { text: "20 Coins", callback_data: `football_stake:20` },
                        ],
                    ],
                };
                const text = "⚽️ Direction Guess Game\n\nChoose your stake amount:";
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText(text, {
                        inline_message_id: inlineMessageId,
                        reply_markup: stakeKeyboard,
                    });
                }
                else if (chatId && callbackQuery.message?.message_id) {
                    await bot.editMessageText(text, {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
                        reply_markup: stakeKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                return;
            }
            if (gameType === "basketball") {
                const stakeKeyboard = {
                    inline_keyboard: [
                        [
                            { text: "2 Coins", callback_data: `basketball_stake:2` },
                            { text: "5 Coins", callback_data: `basketball_stake:5` },
                        ],
                        [
                            { text: "10 Coins", callback_data: `basketball_stake:10` },
                            { text: "20 Coins", callback_data: `basketball_stake:20` },
                        ],
                    ],
                };
                const text = "🏀 Hoop Shot Game\n\nChoose your stake amount:";
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText(text, {
                        inline_message_id: inlineMessageId,
                        reply_markup: stakeKeyboard,
                    });
                }
                else if (chatId && callbackQuery.message?.message_id) {
                    await bot.editMessageText(text, {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
                        reply_markup: stakeKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                return;
            }
            if (gameType === "blackjack") {
                const stakeKeyboard = {
                    inline_keyboard: [
                        [
                            { text: "2 Coins", callback_data: `blackjack_stake:2` },
                            { text: "5 Coins", callback_data: `blackjack_stake:5` },
                        ],
                        [
                            { text: "10 Coins", callback_data: `blackjack_stake:10` },
                            { text: "20 Coins", callback_data: `blackjack_stake:20` },
                        ],
                        [
                            { text: "30 Coins", callback_data: `blackjack_stake:30` },
                            { text: "50 Coins", callback_data: `blackjack_stake:50` },
                        ],
                    ],
                };
                const text = "🃏 Blackjack Game\n\nChoose your stake amount:";
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText(text, {
                        inline_message_id: inlineMessageId,
                        reply_markup: stakeKeyboard,
                    });
                }
                else if (chatId && callbackQuery.message?.message_id) {
                    await bot.editMessageText(text, {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
                        reply_markup: stakeKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                return;
            }
            if (gameType === "xo") {
                const stakeKeyboard = {
                    inline_keyboard: [
                        [
                            { text: "5 Coins", callback_data: `create_stake:5` },
                            { text: "10 Coins", callback_data: `create_stake:10` },
                        ],
                        [{ text: "20 Coins", callback_data: `create_stake:20` }],
                    ],
                };
                const text = "🎮 X/O Game\n\nChoose stake amount:";
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText(text, {
                        inline_message_id: inlineMessageId,
                        reply_markup: stakeKeyboard,
                    });
                }
                else if (chatId && callbackQuery.message?.message_id) {
                    await bot.editMessageText(text, {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
                        reply_markup: stakeKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                return;
            }
        }
        if (action === "create_stake" && parts[1]) {
            const stake = parseInt(parts[1]);
            if (!game_1.VALID_STAKES.includes(stake)) {
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Invalid stake amount",
                    show_alert: true,
                });
                return;
            }
            try {
                const hasBalance = await (0, coinService_1.requireBalance)(userId.toString(), stake);
                if (!hasBalance) {
                    await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                    return;
                }
                const { gameId: newGameId } = await (0, game_1.createXoGame)(userId.toString(), callbackQuery.from?.first_name || "Player", stake);
                const gameMessage = `🎮 X/O Game – Stake: ${stake} Coins\n\nCreated by ${callbackQuery.from?.first_name || "Player"}. Waiting for player 2…\n\n(Winner gets ${stake} Coins)`;
                const shareKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "✅ Join Game",
                                callback_data: `join_game:${newGameId}`,
                            },
                        ],
                    ],
                };
                if (callbackQuery.message) {
                    await bot.editMessageText(gameMessage, {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
                        reply_markup: shareKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                console.log(`[XO] create_stake: created game ${newGameId} with stake ${stake} for user ${userId}`);
                return;
            }
            catch (error) {
                if (error instanceof Error && error.message === "Insufficient coins") {
                    await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                }
                else if (error instanceof Error) {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: error.message || "Failed to create game",
                        show_alert: true,
                    });
                }
                else {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Failed to create game",
                        show_alert: true,
                    });
                }
                return;
            }
        }
        if (action === "inline_start_game" && gameId) {
            if (gameId === "xo") {
                const stakeKeyboard = {
                    inline_keyboard: [
                        [
                            { text: "5 Coins", callback_data: `inline_create_stake:5` },
                            { text: "10 Coins", callback_data: `inline_create_stake:10` },
                        ],
                        [{ text: "20 Coins", callback_data: `inline_create_stake:20` }],
                    ],
                };
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText("🎮 X/O Game\n\nChoose stake amount:", {
                        inline_message_id: inlineMessageId,
                        reply_markup: stakeKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                return;
            }
            if (gameId === "dice") {
                const stakeKeyboard = {
                    inline_keyboard: [
                        [
                            { text: "2 Coins", callback_data: `dice_stake:2` },
                            { text: "5 Coins", callback_data: `dice_stake:5` },
                        ],
                        [
                            { text: "10 Coins", callback_data: `dice_stake:10` },
                            { text: "20 Coins", callback_data: `dice_stake:20` },
                        ],
                    ],
                };
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText("🎲 Dice Guess Game\n\nChoose your stake amount:", {
                        inline_message_id: inlineMessageId,
                        reply_markup: stakeKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                return;
            }
            if (gameId === "football") {
                const stakeKeyboard = {
                    inline_keyboard: [
                        [
                            { text: "2 Coins", callback_data: `football_stake:2` },
                            { text: "5 Coins", callback_data: `football_stake:5` },
                        ],
                        [
                            { text: "10 Coins", callback_data: `football_stake:10` },
                            { text: "20 Coins", callback_data: `football_stake:20` },
                        ],
                    ],
                };
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText("⚽️ Direction Guess Game\n\nChoose your stake amount:", {
                        inline_message_id: inlineMessageId,
                        reply_markup: stakeKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                return;
            }
            if (gameId === "basketball") {
                const stakeKeyboard = {
                    inline_keyboard: [
                        [
                            { text: "2 Coins", callback_data: `basketball_stake:2` },
                            { text: "5 Coins", callback_data: `basketball_stake:5` },
                        ],
                        [
                            { text: "10 Coins", callback_data: `basketball_stake:10` },
                            { text: "20 Coins", callback_data: `basketball_stake:20` },
                        ],
                    ],
                };
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText("🏀 Hoop Shot Game\n\nChoose your stake amount:", {
                        inline_message_id: inlineMessageId,
                        reply_markup: stakeKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                return;
            }
        }
        if (action === "inline_create_stake" && parts[1]) {
            const stake = parseInt(parts[1]);
            if (!game_1.VALID_STAKES.includes(stake)) {
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Invalid stake amount",
                    show_alert: true,
                });
                return;
            }
            try {
                const hasBalance = await (0, coinService_1.requireBalance)(userId.toString(), stake);
                if (!hasBalance) {
                    await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                    return;
                }
                const { gameId: newGameId } = await (0, game_1.createXoGame)(userId.toString(), callbackQuery.from?.first_name || "Player", stake);
                const gameMessage = `🎮 X/O Game – Stake: ${stake} Coins\n\nCreated by ${callbackQuery.from?.first_name || "Player"}. Waiting for player 2…\n\n(Winner gets ${stake} Coins)`;
                const shareKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "✅ Join Game",
                                callback_data: `join_game:${newGameId}`,
                            },
                        ],
                    ],
                };
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText(gameMessage, {
                        inline_message_id: inlineMessageId,
                        reply_markup: shareKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                console.log(`[XO] inline_create_stake: created game ${newGameId} with stake ${stake} for user ${userId}`);
                return;
            }
            catch (error) {
                if (error instanceof Error && error.message === "Insufficient coins") {
                    await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                }
                else if (error instanceof Error) {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: error.message || "Failed to create game",
                        show_alert: true,
                    });
                }
                else {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Failed to create game",
                        show_alert: true,
                    });
                }
                return;
            }
        }
        if (action === "move" && gameId && position) {
            const pos = parseInt(position);
            const moveResult = await (0, logic_1.makeXoMove)(gameId, userId.toString(), pos);
            if (!moveResult.success) {
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: moveResult.error || "Invalid move",
                });
                return;
            }
            const gameState = moveResult.gameState;
            if (!gameState) {
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Game state error",
                });
                return;
            }
            const boardMessage = (0, game_1.formatXoBoard)(gameState.board);
            const stakeInfo = `X/O – Stake ${gameState.stake} Coins • Winner takes ${gameState.stakePool}\n\n`;
            let statusMessage = "";
            if (gameState.winner) {
                const winnerName = gameState.winner === "X"
                    ? gameState.players.X?.name
                    : gameState.players.O?.name;
                const payout = gameState.stakePool;
                statusMessage = `🏆 ${winnerName} wins ${payout} Coins!`;
                const winnerId = gameState.winner === "X"
                    ? gameState.players.X?.id
                    : gameState.players.O?.id;
                const loserId = gameState.winner === "X"
                    ? gameState.players.O?.id
                    : gameState.players.X?.id;
                const loserName = gameState.winner === "X"
                    ? gameState.players.O?.name
                    : gameState.players.X?.name;
                if (winnerId && loserId && winnerName && loserName) {
                    const statsMsg = await (0, userStats_1.formatStatsMessage)(winnerId, loserId, winnerName, loserName, "xo");
                    statusMessage += `\n${statsMsg}`;
                }
            }
            else if (gameState.status === "draw") {
                statusMessage = `🤝 Draw – stakes refunded.`;
            }
            else {
                statusMessage = `🎯 It's ${gameState.players[gameState.currentPlayer]?.name ||
                    gameState.currentPlayer}'s turn`;
            }
            const fullMessage = `${stakeInfo}${boardMessage}\n\n${statusMessage}`;
            const inlineMessageId = callbackQuery.inline_message_id;
            let keyboard;
            if (gameState.winner || gameState.status === "draw") {
                keyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "🔄 Play Again",
                                callback_data: `restart_game:${gameId}`,
                            },
                            { text: "🎮 New Game", callback_data: `new_game:${gameId}` },
                        ],
                    ],
                };
            }
            else {
                keyboard = {
                    inline_keyboard: Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => {
                        const idx = row * 3 + col;
                        const cell = gameState.board[idx];
                        const text = cell === "-" ? "⬜" : cell === "X" ? "❌" : "🟢";
                        const callbackData = cell === "-" ? `move:${gameId}:${idx}` : "noop";
                        return { text, callback_data: callbackData };
                    })),
                };
            }
            if (inlineMessageId) {
                await bot.editMessageText(fullMessage, {
                    inline_message_id: inlineMessageId,
                    parse_mode: "Markdown",
                    reply_markup: keyboard,
                });
            }
            await bot.answerCallbackQuery(callbackQuery.id);
            return;
        }
        if (action === "join_game" && gameId) {
            try {
                const gameState = await (0, game_1.joinXoGame)(gameId, userId.toString(), callbackQuery.from?.first_name || "Player");
                if (!gameState) {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Game not found or already full",
                        show_alert: true,
                    });
                    return;
                }
                const boardMessage = (0, game_1.formatXoBoard)(gameState.board);
                const stakeInfo = `X/O – Stake ${gameState.stake} Coins • Winner takes ${gameState.stakePool}\n\n`;
                const statusMessage = `🎯 It's ${gameState.players[gameState.currentPlayer]?.name ||
                    gameState.currentPlayer}'s turn`;
                const fullMessage = `${stakeInfo}${boardMessage}\n\n${statusMessage}`;
                const keyboard = {
                    inline_keyboard: Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => {
                        const idx = row * 3 + col;
                        const cell = gameState.board[idx];
                        const text = cell === "-" ? "⬜" : cell === "X" ? "❌" : "🟢";
                        const callbackData = cell === "-" ? `move:${gameId}:${idx}` : "noop";
                        return { text, callback_data: callbackData };
                    })),
                };
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText(fullMessage, {
                        inline_message_id: inlineMessageId,
                        parse_mode: "Markdown",
                        reply_markup: keyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                return;
            }
            catch (error) {
                if (error instanceof Error && error.message === "Insufficient coins") {
                    await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                }
                else if (error instanceof Error) {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: error.message || "Failed to join game",
                        show_alert: true,
                    });
                }
                else {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Failed to join game",
                        show_alert: true,
                    });
                }
                return;
            }
        }
        if (action === "restart_game" && gameId) {
            try {
                const newGameState = await (0, logic_1.restartXoGame)(gameId);
                if (!newGameState) {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Game not found",
                        show_alert: true,
                    });
                    return;
                }
                const boardMessage = (0, game_1.formatXoBoard)(newGameState.board);
                const stakeInfo = `X/O – Stake ${newGameState.stake} Coins • Winner takes ${newGameState.stakePool}\n\n`;
                const statusMessage = `🎯 It's ${newGameState.players[newGameState.currentPlayer]?.name ||
                    newGameState.currentPlayer}'s turn`;
                const fullMessage = `${stakeInfo}${boardMessage}\n\n${statusMessage}`;
                const keyboard = {
                    inline_keyboard: Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => {
                        const idx = row * 3 + col;
                        const cell = newGameState.board[idx];
                        const text = cell === "-" ? "⬜" : cell === "X" ? "❌" : "🟢";
                        const callbackData = cell === "-" ? `move:${gameId}:${idx}` : "noop";
                        return { text, callback_data: callbackData };
                    })),
                };
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText(fullMessage, {
                        inline_message_id: inlineMessageId,
                        parse_mode: "Markdown",
                        reply_markup: keyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                return;
            }
            catch (error) {
                if (error instanceof Error) {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: error.message || "Failed to restart game",
                        show_alert: true,
                    });
                }
                else {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Failed to restart game",
                        show_alert: true,
                    });
                }
                return;
            }
        }
        if (action === "noop") {
            await bot.answerCallbackQuery(callbackQuery.id);
            return;
        }
        if (action === "copy" && gameId) {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: `Game ID copied: ${gameId}`,
                show_alert: true,
            });
            return;
        }
        if (action === "dice_stake" && parts[1]) {
            console.log(`[DICE] dice_stake callback received: userId=${userId}, parts=`, parts);
            const stake = parseInt(parts[1]);
            console.log(`[DICE] Parsed stake: ${stake}`);
            if (!dice_1.DICE_STAKES.includes(stake)) {
                console.log(`[DICE] Invalid stake amount: ${stake}`);
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Invalid stake amount",
                    show_alert: true,
                });
                return;
            }
            try {
                console.log(`[DICE] Creating dice game for userId=${userId}, stake=${stake}`);
                const gameState = await (0, dice_1.createDiceGame)(userId.toString(), stake);
                const guessKeyboard = {
                    inline_keyboard: [
                        [
                            { text: "1 (4×)", callback_data: `dice_guess:${gameState.id}:1` },
                            { text: "2 (4×)", callback_data: `dice_guess:${gameState.id}:2` },
                            { text: "3 (4×)", callback_data: `dice_guess:${gameState.id}:3` },
                        ],
                        [
                            { text: "4 (4×)", callback_data: `dice_guess:${gameState.id}:4` },
                            { text: "5 (4×)", callback_data: `dice_guess:${gameState.id}:5` },
                            { text: "6 (4×)", callback_data: `dice_guess:${gameState.id}:6` },
                        ],
                        [
                            {
                                text: "ODD (2×)",
                                callback_data: `dice_guess:${gameState.id}:ODD`,
                            },
                            {
                                text: "EVEN (2×)",
                                callback_data: `dice_guess:${gameState.id}:EVEN`,
                            },
                        ],
                        [
                            {
                                text: "1-3 (2×)",
                                callback_data: `dice_guess:${gameState.id}:1-3`,
                            },
                            {
                                text: "4-6 (2×)",
                                callback_data: `dice_guess:${gameState.id}:4-6`,
                            },
                        ],
                    ],
                };
                const chatId = callbackQuery.message?.chat.id;
                const messageId = callbackQuery.message?.message_id;
                const inlineMessageId = callbackQuery.inline_message_id;
                const text = `🎲 Dice Guess Game - Stake: ${stake} Coins\n\nWhat's your guess?\n\n` +
                    `🎯 Exact values (1-6): 4× reward\n` +
                    `📊 Ranges (ODD/EVEN/1-3/4-6): 2× reward`;
                if (inlineMessageId) {
                    await bot.editMessageText(text, {
                        inline_message_id: inlineMessageId,
                        reply_markup: guessKeyboard,
                    });
                }
                else if (chatId && messageId) {
                    await bot.editMessageText(text, {
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: guessKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                console.log(`[DICE] Created game ${gameState.id} with stake ${stake} for user ${userId}`);
                return;
            }
            catch (error) {
                if (error instanceof Error && error.message === "Insufficient coins") {
                    await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                }
                else if (error instanceof Error) {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: error.message || "Failed to create dice game",
                        show_alert: true,
                    });
                }
                else {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Failed to create dice game",
                        show_alert: true,
                    });
                }
                return;
            }
        }
        if (action === "dice_guess" && parts[1] && parts[2]) {
            console.log(`[DICE] dice_guess callback received: userId=${userId}, parts=`, parts);
            const gameId = parts[1];
            const guess = parts[2];
            console.log(`[DICE] Processing guess: gameId=${gameId}, guess=${guess}`);
            const gameState = await (0, dice_1.setDiceGuess)(gameId, guess);
            const stake = gameState.stake;
            const diceLoadingMessages = [
                `⏳ Rolling the dice...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
                `🔄 Shaking the cup...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
                `🎲 Tossing the dice...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
                `⏳ Game is running... Please wait for the result.\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
            ];
            const loadingMsg = diceLoadingMessages[Math.floor(Math.random() * diceLoadingMessages.length)];
            const inlineMessageId = callbackQuery.inline_message_id;
            const messageId = callbackQuery.message?.message_id;
            if (inlineMessageId) {
                await bot.editMessageText(loadingMsg, {
                    inline_message_id: inlineMessageId,
                });
            }
            else if (chatId && messageId) {
                await bot.editMessageText(loadingMsg, {
                    chat_id: chatId,
                    message_id: messageId,
                });
            }
            try {
                console.log(`[DICE] Setting guess for game ${gameId}`);
                const gameState = await (0, dice_1.setDiceGuess)(gameId, guess);
                const stake = gameState.stake;
                console.log(`[DICE] Sending dice emoji to chatId=${chatId}`);
                const diceMessage = await bot.sendDice(chatId, { emoji: "🎲" });
                const diceResult = diceMessage.dice?.value;
                console.log(`[DICE] Dice message received:`, JSON.stringify(diceMessage, null, 2));
                console.log(`[DICE] Dice result: ${diceResult}`);
                if (!diceResult) {
                    console.log(`[DICE] Failed to get dice result from message`);
                    throw new Error("Failed to get dice result");
                }
                console.log(`[DICE] Waiting for dice animation to finish...`);
                await new Promise((resolve) => setTimeout(resolve, 3000));
                console.log(`[DICE] Processing dice result: gameId=${gameId}, diceResult=${diceResult}`);
                const result = await (0, dice_1.processDiceResult)(gameId, diceResult);
                const resultText = (0, dice_1.getDiceResultText)(result.won, result.reward, guess, diceResult, stake);
                const playAgainKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "🎯 Play Again (Same Stake & Guess)",
                                callback_data: `dice_play_again_exact:${stake}:${guess}`,
                            },
                        ],
                        [
                            {
                                text: "🔄 Play Again (Same Stake)",
                                callback_data: `dice_play_again_same:${stake}`,
                            },
                        ],
                        [
                            {
                                text: "🎲 New Dice Game",
                                callback_data: "dice_play_again_new",
                            },
                        ],
                    ],
                };
                if (inlineMessageId) {
                    await bot.editMessageText(resultText, {
                        inline_message_id: inlineMessageId,
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                else if (chatId && messageId) {
                    await bot.editMessageText(resultText, {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                else {
                    await bot.sendMessage(chatId, resultText, {
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                console.log(`[DICE] Game ${gameId} completed: won=${result.won}, reward=${result.reward}`);
                return;
            }
            catch (error) {
                if (error instanceof Error && error.message === "Insufficient coins") {
                    await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                }
                else if (error instanceof Error) {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: error.message || "Failed to process dice game",
                        show_alert: true,
                    });
                }
                else {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Failed to process dice game",
                        show_alert: true,
                    });
                }
                return;
            }
        }
        if (action === "dice_play_again_same" && parts[1]) {
            const stake = parseInt(parts[1]);
            console.log(`[DICE] Play again same stake: userId=${userId}, stake=${stake}`);
            try {
                const hasBalance = await (0, coinService_1.requireBalance)(userId.toString(), stake);
                if (!hasBalance) {
                    await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                    return;
                }
                const gameState = await (0, dice_1.createDiceGame)(userId.toString(), stake);
                const guessKeyboard = {
                    inline_keyboard: [
                        [
                            { text: "1 (4×)", callback_data: `dice_guess:${gameState.id}:1` },
                            { text: "2 (4×)", callback_data: `dice_guess:${gameState.id}:2` },
                            { text: "3 (4×)", callback_data: `dice_guess:${gameState.id}:3` },
                        ],
                        [
                            { text: "4 (4×)", callback_data: `dice_guess:${gameState.id}:4` },
                            { text: "5 (4×)", callback_data: `dice_guess:${gameState.id}:5` },
                            { text: "6 (4×)", callback_data: `dice_guess:${gameState.id}:6` },
                        ],
                        [
                            {
                                text: "ODD (2×)",
                                callback_data: `dice_guess:${gameState.id}:ODD`,
                            },
                            {
                                text: "EVEN (2×)",
                                callback_data: `dice_guess:${gameState.id}:EVEN`,
                            },
                        ],
                        [
                            {
                                text: "1-3 (2×)",
                                callback_data: `dice_guess:${gameState.id}:1-3`,
                            },
                            {
                                text: "4-6 (2×)",
                                callback_data: `dice_guess:${gameState.id}:4-6`,
                            },
                        ],
                    ],
                };
                const text = `🎲 Dice Game - Stake: ${stake} Coins\n\nChoose your guess:`;
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText(text, {
                        inline_message_id: inlineMessageId,
                        reply_markup: guessKeyboard,
                    });
                }
                else if (chatId && callbackQuery.message?.message_id) {
                    await bot.editMessageText(text, {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
                        reply_markup: guessKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                console.log(`[DICE] Play again same stake: created game ${gameState.id}`);
                return;
            }
            catch (error) {
                if (error instanceof Error && error.message === "Insufficient coins") {
                    await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                }
                else if (error instanceof Error) {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: error.message || "Failed to start new game",
                        show_alert: true,
                    });
                }
                else {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Failed to start new game",
                        show_alert: true,
                    });
                }
                return;
            }
        }
        if (action === "dice_play_again_exact" && parts[1] && parts[2]) {
            const stake = parseInt(parts[1]);
            const guess = parts[2];
            const inlineMessageId = callbackQuery.inline_message_id;
            const messageId = callbackQuery.message?.message_id;
            const diceLoadingMessages = [
                `⏳ Rolling the dice...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
                `🔄 Shaking the cup...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
                `🎲 Tossing the dice...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
                `⏳ Game is running... Please wait for the result.\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
            ];
            const loadingMsg = diceLoadingMessages[Math.floor(Math.random() * diceLoadingMessages.length)];
            if (inlineMessageId) {
                await bot.editMessageText(loadingMsg, {
                    inline_message_id: inlineMessageId,
                });
            }
            else if (chatId && messageId) {
                await bot.editMessageText(loadingMsg, {
                    chat_id: chatId,
                    message_id: messageId,
                });
            }
            console.log(`[DICE] Play again exact: userId=${userId}, stake=${stake}, guess=${guess}`);
            try {
                const hasBalance = await (0, coinService_1.requireBalance)(userId.toString(), stake);
                if (!hasBalance) {
                    await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                    return;
                }
                const gameState = await (0, dice_1.createDiceGame)(userId.toString(), stake);
                await (0, dice_1.setDiceGuess)(gameState.id, guess);
                console.log(`[DICE] Sending dice emoji to chatId=${chatId}`);
                const diceMessage = await bot.sendDice(chatId, { emoji: "🎲" });
                const diceResult = diceMessage.dice?.value;
                console.log(`[DICE] Dice result: ${diceResult}`);
                if (!diceResult) {
                    console.log(`[DICE] Failed to get dice result from message`);
                    throw new Error("Failed to get dice result");
                }
                console.log(`[DICE] Waiting for dice animation to finish...`);
                await new Promise((resolve) => setTimeout(resolve, 3000));
                console.log(`[DICE] Processing dice result: gameId=${gameState.id}, diceResult=${diceResult}`);
                const result = await (0, dice_1.processDiceResult)(gameState.id, diceResult);
                const resultText = (0, dice_1.getDiceResultText)(result.won, result.reward, guess, diceResult, stake);
                const playAgainKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "🎯 Play Again (Same Stake & Guess)",
                                callback_data: `dice_play_again_exact:${stake}:${guess}`,
                            },
                        ],
                        [
                            {
                                text: "🔄 Play Again (Same Stake)",
                                callback_data: `dice_play_again_same:${stake}`,
                            },
                        ],
                        [
                            {
                                text: "🎲 New Dice Game",
                                callback_data: "dice_play_again_new",
                            },
                        ],
                    ],
                };
                if (inlineMessageId) {
                    await bot.editMessageText(resultText, {
                        inline_message_id: inlineMessageId,
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                else if (chatId && messageId) {
                    await bot.editMessageText(resultText, {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                else {
                    await bot.sendMessage(chatId, resultText, {
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                console.log(`[DICE] Play again exact: completed game ${gameState.id}`);
                return;
            }
            catch (error) {
                if (error instanceof Error && error.message === "Insufficient coins") {
                    await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                }
                else if (error instanceof Error) {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: error.message || "Failed to start new game",
                        show_alert: true,
                    });
                }
                else {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: "Failed to start new game",
                        show_alert: true,
                    });
                }
                return;
            }
        }
        if (action === "dice_play_again_new") {
            console.log(`[DICE] Play again new game: userId=${userId}`);
            const stakeKeyboard = {
                inline_keyboard: [
                    [
                        { text: "2 Coins", callback_data: `dice_stake:2` },
                        { text: "5 Coins", callback_data: `dice_stake:5` },
                    ],
                    [
                        { text: "10 Coins", callback_data: `dice_stake:10` },
                        { text: "20 Coins", callback_data: `dice_stake:20` },
                    ],
                ],
            };
            const text = "🎲 Dice Guess Game\n\nChoose your stake amount:";
            const inlineMessageId = callbackQuery.inline_message_id;
            if (inlineMessageId) {
                await bot.editMessageText(text, {
                    inline_message_id: inlineMessageId,
                    reply_markup: stakeKeyboard,
                });
            }
            else if (chatId && callbackQuery.message?.message_id) {
                await bot.editMessageText(text, {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    reply_markup: stakeKeyboard,
                });
            }
            await bot.answerCallbackQuery(callbackQuery.id);
            console.log(`[DICE] Play again new game: showing stake selection`);
            return;
        }
        if (action === "blackjack_stake" && parts[1]) {
            console.log(`[BLACKJACK] blackjack_stake callback received: userId=${userId}, parts=`, parts);
            const stake = parseInt(parts[1]);
            console.log(`[BLACKJACK] Parsed stake: ${stake}`);
            if (!blackjack_1.BLACKJACK_STAKES.includes(stake)) {
                console.log(`[BLACKJACK] Invalid stake amount: ${stake}`);
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Invalid stake amount",
                    show_alert: true,
                });
                return;
            }
            try {
                console.log(`[BLACKJACK] Creating blackjack game for userId=${userId}, stake=${stake}`);
                const gameState = await (0, blackjack_1.createBlackjackGame)(userId.toString(), stake);
                const playerValue = (0, blackjack_1.calculateHandValue)(gameState.playerHand);
                const playerHandFormatted = (0, blackjack_1.formatHand)(gameState.playerHand);
                const dealerHandFormatted = (0, blackjack_1.formatHand)(gameState.dealerHand, true);
                const actionKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "🃏 Hit",
                                callback_data: `blackjack_hit:${gameState.id}`,
                            },
                            {
                                text: "✋ Stand",
                                callback_data: `blackjack_stand:${gameState.id}`,
                            },
                        ],
                        [
                            {
                                text: "❓ Rules",
                                callback_data: `blackjack_rules`,
                            },
                        ],
                    ],
                };
                const chatId = callbackQuery.message?.chat.id;
                const messageId = callbackQuery.message?.message_id;
                const inlineMessageId = callbackQuery.inline_message_id;
                const text = `<b>🃏 Blackjack Game - Stake: ${stake} Coins</b>\n\n` +
                    `<b>Your Hand:</b> ${playerHandFormatted} <b>(Total: ${playerValue})</b>\n` +
                    `<b>Dealer Shows:</b> ${dealerHandFormatted}\n\n` +
                    `<em>What do you want to do?</em>`;
                if (inlineMessageId) {
                    await bot.editMessageText(text, {
                        inline_message_id: inlineMessageId,
                        reply_markup: actionKeyboard,
                        parse_mode: "HTML",
                    });
                }
                else if (chatId && messageId) {
                    await bot.editMessageText(text, {
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: actionKeyboard,
                        parse_mode: "HTML",
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                console.log(`[BLACKJACK] Created game ${gameState.id} with stake ${stake} for user ${userId}`);
                return;
            }
            catch {
                await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                return;
            }
        }
        if (action === "blackjack_hit" && parts[1]) {
            console.log(`[BLACKJACK] blackjack_hit callback received: userId=${userId}, gameId=${parts[1]}`);
            const gameId = parts[1];
            try {
                const currentGameState = await (0, blackjack_1.getBlackjackGame)(gameId);
                if (currentGameState.status === "completed") {
                    const playerValue = (0, blackjack_1.calculateHandValue)(currentGameState.playerHand);
                    const resultText = (0, blackjack_1.getBlackjackResultText)(currentGameState.result || "lose", currentGameState.reward || 0, playerValue, (0, blackjack_1.calculateHandValue)(currentGameState.dealerHand), currentGameState.stake, currentGameState.playerHand, currentGameState.dealerHand);
                    const playAgainKeyboard = {
                        inline_keyboard: [
                            [
                                {
                                    text: "🔄 Play Again (Same Stake)",
                                    callback_data: `blackjack_play_again:${currentGameState.stake}`,
                                },
                            ],
                            [
                                {
                                    text: "➕ Play Again (Choose Stake)",
                                    callback_data: `blackjack_play_again_choose`,
                                },
                            ],
                        ],
                    };
                    const chatId = callbackQuery.message?.chat.id;
                    const messageId = callbackQuery.message?.message_id;
                    const inlineMessageId = callbackQuery.inline_message_id;
                    if (inlineMessageId) {
                        await bot.editMessageText(resultText, {
                            inline_message_id: inlineMessageId,
                            reply_markup: playAgainKeyboard,
                            parse_mode: "HTML",
                        });
                    }
                    else if (chatId && messageId) {
                        await bot.editMessageText(resultText, {
                            chat_id: chatId,
                            message_id: messageId,
                            reply_markup: playAgainKeyboard,
                            parse_mode: "HTML",
                        });
                    }
                    await bot.answerCallbackQuery(callbackQuery.id);
                    return;
                }
                const gameState = await (0, blackjack_1.hitCard)(gameId);
                const playerValue = (0, blackjack_1.calculateHandValue)(gameState.playerHand);
                if (gameState.status === "completed" || playerValue === 21) {
                    const resultText = (0, blackjack_1.getBlackjackResultText)(gameState.result || "win", gameState.reward || 0, playerValue, (0, blackjack_1.calculateHandValue)(gameState.dealerHand), gameState.stake, gameState.playerHand, gameState.dealerHand);
                    const playAgainKeyboard = {
                        inline_keyboard: [
                            [
                                {
                                    text: "🔄 Play Again (Same Stake)",
                                    callback_data: `blackjack_play_again:${gameState.stake}`,
                                },
                            ],
                            [
                                {
                                    text: "➕ Play Again (Choose Stake)",
                                    callback_data: `blackjack_play_again_choose`,
                                },
                            ],
                        ],
                    };
                    const chatId = callbackQuery.message?.chat.id;
                    const messageId = callbackQuery.message?.message_id;
                    const inlineMessageId = callbackQuery.inline_message_id;
                    if (inlineMessageId) {
                        await bot.editMessageText(resultText, {
                            inline_message_id: inlineMessageId,
                            reply_markup: playAgainKeyboard,
                            parse_mode: "HTML",
                        });
                    }
                    else if (chatId && messageId) {
                        await bot.editMessageText(resultText, {
                            chat_id: chatId,
                            message_id: messageId,
                            reply_markup: playAgainKeyboard,
                            parse_mode: "HTML",
                        });
                    }
                    await bot.answerCallbackQuery(callbackQuery.id);
                    return;
                }
                else {
                    const playerHandFormatted = (0, blackjack_1.formatHand)(gameState.playerHand);
                    const dealerHandFormatted = (0, blackjack_1.formatHand)(gameState.dealerHand, true);
                    const actionKeyboard = {
                        inline_keyboard: [
                            [
                                { text: "🃏 Hit", callback_data: `blackjack_hit:${gameId}` },
                                {
                                    text: "✋ Stand",
                                    callback_data: `blackjack_stand:${gameId}`,
                                },
                            ],
                            [
                                {
                                    text: "❓ Rules",
                                    callback_data: `blackjack_rules`,
                                },
                            ],
                        ],
                    };
                    const text = `<b>🃏 Blackjack Game - Stake: ${gameState.stake} Coins</b>\n\n` +
                        `<b>Your Hand:</b> ${playerHandFormatted} <b>(Total: ${playerValue})</b>\n` +
                        `<b>Dealer Shows:</b> ${dealerHandFormatted}\n\n` +
                        `<em>What do you want to do?</em>`;
                    const chatId = callbackQuery.message?.chat.id;
                    const messageId = callbackQuery.message?.message_id;
                    const inlineMessageId = callbackQuery.inline_message_id;
                    if (inlineMessageId) {
                        await bot.editMessageText(text, {
                            inline_message_id: inlineMessageId,
                            reply_markup: actionKeyboard,
                            parse_mode: "HTML",
                        });
                    }
                    else if (chatId && messageId) {
                        await bot.editMessageText(text, {
                            chat_id: chatId,
                            message_id: messageId,
                            reply_markup: actionKeyboard,
                            parse_mode: "HTML",
                        });
                    }
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                return;
            }
            catch (error) {
                console.error(`[BLACKJACK] hitCard error:`, error);
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Failed to hit card",
                    show_alert: true,
                });
                return;
            }
        }
        if (action === "blackjack_stand" && parts[1]) {
            console.log(`[BLACKJACK] blackjack_stand callback received: userId=${userId}, gameId=${parts[1]}`);
            const gameId = parts[1];
            try {
                const result = await (0, blackjack_1.standGame)(gameId);
                const originalGameState = await (0, blackjack_1.getBlackjackGame)(gameId);
                const playAgainKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "🔄 Play Again (Same Stake)",
                                callback_data: `blackjack_play_again:${originalGameState.stake}`,
                            },
                        ],
                        [
                            {
                                text: "➕ Play Again (Choose Stake)",
                                callback_data: `blackjack_play_again_choose`,
                            },
                        ],
                    ],
                };
                const chatId = callbackQuery.message?.chat.id;
                const messageId = callbackQuery.message?.message_id;
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText(result.message, {
                        inline_message_id: inlineMessageId,
                        reply_markup: playAgainKeyboard,
                        parse_mode: "HTML",
                    });
                }
                else if (chatId && messageId) {
                    await bot.editMessageText(result.message, {
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: playAgainKeyboard,
                        parse_mode: "HTML",
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                return;
            }
            catch (error) {
                console.error(`[BLACKJACK] standGame error:`, error);
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Failed to stand",
                    show_alert: true,
                });
                return;
            }
        }
        if (action === "blackjack_rules") {
            const rulesText = (0, blackjack_1.getBlackjackRules)();
            const backKeyboard = {
                inline_keyboard: [
                    [
                        {
                            text: "⬅️ Back to Game",
                            callback_data: `blackjack_back_to_game`,
                        },
                    ],
                ],
            };
            const chatId = callbackQuery.message?.chat.id;
            const messageId = callbackQuery.message?.message_id;
            const inlineMessageId = callbackQuery.inline_message_id;
            if (inlineMessageId) {
                await bot.editMessageText(rulesText, {
                    inline_message_id: inlineMessageId,
                    reply_markup: backKeyboard,
                    parse_mode: "HTML",
                });
            }
            else if (chatId && messageId) {
                await bot.editMessageText(rulesText, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: backKeyboard,
                    parse_mode: "HTML",
                });
            }
            await bot.answerCallbackQuery(callbackQuery.id);
            return;
        }
        if (action === "blackjack_back_to_game") {
            await bot.answerCallbackQuery(callbackQuery.id);
            return;
        }
        if (action === "blackjack_play_again_choose") {
            const stakeKeyboard = {
                inline_keyboard: [
                    [
                        { text: "2 Coins", callback_data: `blackjack_stake:2` },
                        { text: "5 Coins", callback_data: `blackjack_stake:5` },
                    ],
                    [
                        { text: "10 Coins", callback_data: `blackjack_stake:10` },
                        { text: "20 Coins", callback_data: `blackjack_stake:20` },
                    ],
                    [
                        { text: "30 Coins", callback_data: `blackjack_stake:30` },
                        { text: "50 Coins", callback_data: `blackjack_stake:50` },
                    ],
                ],
            };
            const text = "🃏 Blackjack Game\n\nChoose your stake amount:";
            const chatId = callbackQuery.message?.chat.id;
            const messageId = callbackQuery.message?.message_id;
            const inlineMessageId = callbackQuery.inline_message_id;
            if (inlineMessageId) {
                await bot.editMessageText(text, {
                    inline_message_id: inlineMessageId,
                    reply_markup: stakeKeyboard,
                });
            }
            else if (chatId && messageId) {
                await bot.editMessageText(text, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: stakeKeyboard,
                });
            }
            await bot.answerCallbackQuery(callbackQuery.id);
            return;
        }
        if (action === "blackjack_play_again" && parts[1]) {
            const stake = parseInt(parts[1]);
            if (!blackjack_1.BLACKJACK_STAKES.includes(stake)) {
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Invalid stake amount",
                    show_alert: true,
                });
                return;
            }
            try {
                const gameState = await (0, blackjack_1.createBlackjackGame)(userId.toString(), stake);
                const playerHandFormatted = (0, blackjack_1.formatHand)(gameState.playerHand);
                const dealerHandFormatted = (0, blackjack_1.formatHand)(gameState.dealerHand, true);
                const playerValue = (0, blackjack_1.calculateHandValue)(gameState.playerHand);
                const actionKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "🃏 Hit",
                                callback_data: `blackjack_hit:${gameState.id}`,
                            },
                            {
                                text: "✋ Stand",
                                callback_data: `blackjack_stand:${gameState.id}`,
                            },
                        ],
                        [{ text: "❓ Rules", callback_data: `blackjack_rules` }],
                    ],
                };
                const text = `<b>🃏 Blackjack Game - Stake: ${stake} Coins</b>\n\n` +
                    `<b>Your Hand:</b> ${playerHandFormatted} <b>(Total: ${playerValue})</b>\n` +
                    `<b>Dealer Shows:</b> ${dealerHandFormatted}\n\n` +
                    `<em>What do you want to do?</em>`;
                const chatId = callbackQuery.message?.chat.id;
                const messageId = callbackQuery.message?.message_id;
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText(text, {
                        inline_message_id: inlineMessageId,
                        reply_markup: actionKeyboard,
                        parse_mode: "HTML",
                    });
                }
                else if (chatId && messageId) {
                    await bot.editMessageText(text, {
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: actionKeyboard,
                        parse_mode: "HTML",
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                return;
            }
            catch {
                await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                return;
            }
        }
        if (action === "football_stake" && parts[1]) {
            console.log(`[FOOTBALL] football_stake callback received: userId=${userId}, parts=`, parts);
            const stake = parseInt(parts[1]);
            console.log(`[FOOTBALL] Parsed stake: ${stake}`);
            if (!football_1.FOOTBALL_STAKES.includes(stake)) {
                console.log(`[FOOTBALL] Invalid stake amount: ${stake}`);
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Invalid stake amount",
                    show_alert: true,
                });
                return;
            }
            try {
                console.log(`[FOOTBALL] Creating football game for userId=${userId}, stake=${stake}`);
                const gameState = await (0, football_1.createFootballGame)(userId.toString(), stake);
                const directionKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "Top-Left",
                                callback_data: `football_guess:${gameState.id}:1`,
                            },
                            {
                                text: "Top-Right",
                                callback_data: `football_guess:${gameState.id}:2`,
                            },
                        ],
                        [
                            {
                                text: "Center",
                                callback_data: `football_guess:${gameState.id}:3`,
                            },
                        ],
                        [
                            {
                                text: "Bottom-Left",
                                callback_data: `football_guess:${gameState.id}:4`,
                            },
                            {
                                text: "Bottom-Right",
                                callback_data: `football_guess:${gameState.id}:5`,
                            },
                        ],
                    ],
                };
                const chatId = callbackQuery.message?.chat.id;
                const messageId = callbackQuery.message?.message_id;
                const inlineMessageId = callbackQuery.inline_message_id;
                const text = `⚽️ Direction Guess Game - Stake: ${stake} Coins\n\nWhere do you want to shoot?\n\n` +
                    `🎯 Win 4× your stake if the ball lands in your chosen direction!`;
                if (inlineMessageId) {
                    await bot.editMessageText(text, {
                        inline_message_id: inlineMessageId,
                        reply_markup: directionKeyboard,
                    });
                }
                else if (chatId && messageId) {
                    await bot.editMessageText(text, {
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: directionKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                console.log(`[FOOTBALL] Created game ${gameState.id} with stake ${stake} for user ${userId}`);
                return;
            }
            catch {
                await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                return;
            }
        }
        if (action === "football_guess" && parts[1] && parts[2]) {
            console.log(`[FOOTBALL] football_guess callback received: userId=${userId}, parts=`, parts);
            const gameId = parts[1];
            const guess = parseInt(parts[2]);
            console.log(`[FOOTBALL] Processing guess: gameId=${gameId}, guess=${guess}`);
            const gameState = await (0, football_1.setFootballGuess)(gameId, guess);
            const stake = gameState.stake;
            const guessDirection = football_1.FOOTBALL_DIRECTIONS[guess];
            const footballLoadingMessages = [
                `⏳ Kicking the ball...\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
                `🔄 Preparing the shot...\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
                `⚽️ Shooting...\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
                `⏳ Game is running... Please wait for the result.\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
            ];
            const loadingMsg = footballLoadingMessages[Math.floor(Math.random() * footballLoadingMessages.length)];
            const inlineMessageId = callbackQuery.inline_message_id;
            const messageId = callbackQuery.message?.message_id;
            if (inlineMessageId) {
                await bot.editMessageText(loadingMsg, {
                    inline_message_id: inlineMessageId,
                });
            }
            else if (chatId && messageId) {
                await bot.editMessageText(loadingMsg, {
                    chat_id: chatId,
                    message_id: messageId,
                });
            }
            try {
                console.log(`[FOOTBALL] Setting guess for game ${gameId}`);
                const gameState = await (0, football_1.setFootballGuess)(gameId, guess);
                const stake = gameState.stake;
                console.log(`[FOOTBALL] Sending football emoji to chatId=${chatId}`);
                const footballMessage = await bot.sendDice(chatId, { emoji: "⚽️" });
                const footballResult = footballMessage.dice?.value;
                console.log(`[FOOTBALL] Football message received:`, JSON.stringify(footballMessage, null, 2));
                console.log(`[FOOTBALL] Football result: ${footballResult}`);
                if (!footballResult) {
                    console.log(`[FOOTBALL] Failed to get football result from message`);
                    throw new Error("Failed to get football result");
                }
                console.log(`[FOOTBALL] Waiting for football animation to finish...`);
                await new Promise((resolve) => setTimeout(resolve, 3000));
                console.log(`[FOOTBALL] Processing football result: gameId=${gameId}, footballResult=${footballResult}`);
                const result = await (0, football_1.processFootballResult)(gameId, footballResult);
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText(result.message, {
                        inline_message_id: inlineMessageId,
                        reply_markup: { inline_keyboard: [] },
                    });
                }
                else if (chatId && messageId) {
                    await bot.editMessageText(result.message, {
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: { inline_keyboard: [] },
                    });
                }
                const resultEmoji = result.won ? "🎉" : "😔";
                const guessDirection = football_1.FOOTBALL_DIRECTIONS[guess];
                const resultDirection = football_1.FOOTBALL_DIRECTIONS[footballResult];
                const resultText = result.won
                    ? `${resultEmoji} **Congratulations! You won ${result.reward} coins!**\n\n⚽️ You aimed for: ${guessDirection}\n📍 Ball landed: ${resultDirection}\n💰 Reward: ${result.reward} coins`
                    : `${resultEmoji} **Better luck next time!**\n\n⚽️ You aimed for: ${guessDirection}\n📍 Ball landed: ${resultDirection}\n💸 You lost ${stake} coins`;
                const playAgainKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "🎯 Play Again (Same Stake & Direction)",
                                callback_data: `football_play_again_exact:${stake}:${guess}`,
                            },
                        ],
                        [
                            {
                                text: "🔄 Play Again (Same Stake)",
                                callback_data: `football_play_again_same:${stake}`,
                            },
                        ],
                        [
                            {
                                text: "⚽️ New Football Game",
                                callback_data: "football_play_again_new",
                            },
                        ],
                    ],
                };
                if (inlineMessageId) {
                    await bot.editMessageText(resultText, {
                        inline_message_id: inlineMessageId,
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                else if (chatId && messageId) {
                    await bot.editMessageText(resultText, {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                else {
                    await bot.sendMessage(chatId, resultText, {
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                console.log(`[FOOTBALL] Game ${gameId} completed: won=${result.won}, reward=${result.reward}`);
                return;
            }
            catch {
                await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                return;
            }
        }
        if (action === "football_play_again_same" && parts[1]) {
            const stake = parseInt(parts[1]);
            console.log(`[FOOTBALL] Play again same stake: userId=${userId}, stake=${stake}`);
            try {
                const hasBalance = await (0, coinService_1.requireBalance)(userId.toString(), stake);
                if (!hasBalance) {
                    await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                    return;
                }
                const gameState = await (0, football_1.createFootballGame)(userId.toString(), stake);
                const directionKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "Top-Left",
                                callback_data: `football_guess:${gameState.id}:1`,
                            },
                            {
                                text: "Top-Right",
                                callback_data: `football_guess:${gameState.id}:2`,
                            },
                        ],
                        [
                            {
                                text: "Center",
                                callback_data: `football_guess:${gameState.id}:3`,
                            },
                        ],
                        [
                            {
                                text: "Bottom-Left",
                                callback_data: `football_guess:${gameState.id}:4`,
                            },
                            {
                                text: "Bottom-Right",
                                callback_data: `football_guess:${gameState.id}:5`,
                            },
                        ],
                    ],
                };
                const text = `⚽️ Football Game - Stake: ${stake} Coins\n\nWhere do you want to shoot?`;
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText(text, {
                        inline_message_id: inlineMessageId,
                        reply_markup: directionKeyboard,
                    });
                }
                else if (chatId && callbackQuery.message?.message_id) {
                    await bot.editMessageText(text, {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
                        reply_markup: directionKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                console.log(`[FOOTBALL] Play again same stake: created game ${gameState.id}`);
                return;
            }
            catch {
                await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                return;
            }
        }
        if (action === "football_play_again_exact" && parts[1] && parts[2]) {
            const stake = parseInt(parts[1]);
            const guess = parseInt(parts[2]);
            const inlineMessageId = callbackQuery.inline_message_id;
            const messageId = callbackQuery.message?.message_id;
            const guessDirection = football_1.FOOTBALL_DIRECTIONS[guess];
            const footballLoadingMessages = [
                `⏳ Kicking the ball...\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
                `🔄 Preparing the shot...\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
                `⚽️ Shooting...\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
                `⏳ Game is running... Please wait for the result.\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
            ];
            const loadingMsg = footballLoadingMessages[Math.floor(Math.random() * footballLoadingMessages.length)];
            if (inlineMessageId) {
                await bot.editMessageText(loadingMsg, {
                    inline_message_id: inlineMessageId,
                });
            }
            else if (chatId && messageId) {
                await bot.editMessageText(loadingMsg, {
                    chat_id: chatId,
                    message_id: messageId,
                });
            }
            console.log(`[FOOTBALL] Play again exact: userId=${userId}, stake=${stake}, guess=${guess}`);
            try {
                const hasBalance = await (0, coinService_1.requireBalance)(userId.toString(), stake);
                if (!hasBalance) {
                    await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                    return;
                }
                const gameState = await (0, football_1.createFootballGame)(userId.toString(), stake);
                await (0, football_1.setFootballGuess)(gameState.id, guess);
                console.log(`[FOOTBALL] Sending football emoji to chatId=${chatId}`);
                const footballMessage = await bot.sendDice(chatId, { emoji: "⚽️" });
                const footballResult = footballMessage.dice?.value;
                console.log(`[FOOTBALL] Football result: ${footballResult}`);
                if (!footballResult) {
                    console.log(`[FOOTBALL] Failed to get football result from message`);
                    throw new Error("Failed to get football result");
                }
                console.log(`[FOOTBALL] Waiting for football animation to finish...`);
                await new Promise((resolve) => setTimeout(resolve, 3000));
                console.log(`[FOOTBALL] Processing football result: gameId=${gameState.id}, footballResult=${footballResult}`);
                const result = await (0, football_1.processFootballResult)(gameState.id, footballResult);
                const resultEmoji = result.won ? "🎉" : "😔";
                const guessDirection = football_1.FOOTBALL_DIRECTIONS[guess];
                const resultDirection = football_1.FOOTBALL_DIRECTIONS[footballResult];
                const resultText = result.won
                    ? `${resultEmoji} **Congratulations! You won ${result.reward} coins!**\n\n⚽️ You aimed for: ${guessDirection}\n📍 Ball landed: ${resultDirection}\n💰 Reward: ${result.reward} coins`
                    : `${resultEmoji} **Better luck next time!**\n\n⚽️ You aimed for: ${guessDirection}\n📍 Ball landed: ${resultDirection}\n💸 You lost ${stake} coins`;
                const playAgainKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "🎯 Play Again (Same Stake & Direction)",
                                callback_data: `football_play_again_exact:${stake}:${guess}`,
                            },
                        ],
                        [
                            {
                                text: "🔄 Play Again (Same Stake)",
                                callback_data: `football_play_again_same:${stake}`,
                            },
                        ],
                        [
                            {
                                text: "⚽️ New Football Game",
                                callback_data: "football_play_again_new",
                            },
                        ],
                    ],
                };
                if (inlineMessageId) {
                    await bot.editMessageText(resultText, {
                        inline_message_id: inlineMessageId,
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                else if (chatId && messageId) {
                    await bot.editMessageText(resultText, {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                else {
                    await bot.sendMessage(chatId, resultText, {
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                console.log(`[FOOTBALL] Play again exact: completed game ${gameState.id}`);
                return;
            }
            catch {
                await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                return;
            }
        }
        if (action === "football_play_again_new") {
            console.log(`[FOOTBALL] Play again new game: userId=${userId}`);
            const stakeKeyboard = {
                inline_keyboard: [
                    [
                        { text: "2 Coins", callback_data: `football_stake:2` },
                        { text: "5 Coins", callback_data: `football_stake:5` },
                    ],
                    [
                        { text: "10 Coins", callback_data: `football_stake:10` },
                        { text: "20 Coins", callback_data: `football_stake:20` },
                    ],
                ],
            };
            const text = "⚽️ Direction Guess Game\n\nChoose your stake amount:";
            const inlineMessageId = callbackQuery.inline_message_id;
            if (inlineMessageId) {
                await bot.editMessageText(text, {
                    inline_message_id: inlineMessageId,
                    reply_markup: stakeKeyboard,
                });
            }
            else if (chatId && callbackQuery.message?.message_id) {
                await bot.editMessageText(text, {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    reply_markup: stakeKeyboard,
                });
            }
            await bot.answerCallbackQuery(callbackQuery.id);
            console.log(`[FOOTBALL] Play again new game: showing stake selection`);
            return;
        }
        if (action === "basketball_stake" && parts[1]) {
            console.log(`[BASKETBALL] basketball_stake callback received: userId=${userId}, parts=`, parts);
            const stake = parseInt(parts[1]);
            console.log(`[BASKETBALL] Parsed stake: ${stake}`);
            if (!basketball_1.BASKETBALL_STAKES.includes(stake)) {
                console.log(`[BASKETBALL] Invalid stake amount: ${stake}`);
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: "Invalid stake amount",
                    show_alert: true,
                });
                return;
            }
            try {
                console.log(`[BASKETBALL] Creating basketball game for userId=${userId}, stake=${stake}`);
                const gameState = await (0, basketball_1.createBasketballGame)(userId.toString(), stake);
                const guessKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "🏀 Score",
                                callback_data: `basketball_guess:${gameState.id}:score`,
                            },
                            {
                                text: "❌ Miss",
                                callback_data: `basketball_guess:${gameState.id}:miss`,
                            },
                        ],
                    ],
                };
                const chatId = callbackQuery.message?.chat.id;
                const messageId = callbackQuery.message?.message_id;
                const inlineMessageId = callbackQuery.inline_message_id;
                const text = `🏀 Hoop Shot Game - Stake: ${stake} Coins\n\nWill your shot score?\n\n` +
                    `🎯 Win 2× your stake if you guess correctly!`;
                if (inlineMessageId) {
                    await bot.editMessageText(text, {
                        inline_message_id: inlineMessageId,
                        reply_markup: guessKeyboard,
                    });
                }
                else if (chatId && messageId) {
                    await bot.editMessageText(text, {
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: guessKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                console.log(`[BASKETBALL] Created game ${gameState.id} with stake ${stake} for user ${userId}`);
                return;
            }
            catch {
                await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                return;
            }
        }
        if (action === "basketball_guess" && parts[1] && parts[2]) {
            console.log(`[BASKETBALL] basketball_guess callback received: userId=${userId}, parts=`, parts);
            const gameId = parts[1];
            const guess = parts[2];
            console.log(`[BASKETBALL] Processing guess: gameId=${gameId}, guess=${guess}`);
            const gameState = await (0, basketball_1.setBasketballGuess)(gameId, guess);
            const stake = gameState.stake;
            const guessText = guess === "score" ? "🏀 Score" : "❌ Miss";
            const basketballLoadingMessages = [
                `⏳ Shooting the hoop...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
                `🔄 Aiming for the basket...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
                `🏀 Throwing the ball...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
                `⏳ Game is running... Please wait for the result.\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
            ];
            const loadingMsg = basketballLoadingMessages[Math.floor(Math.random() * basketballLoadingMessages.length)];
            const inlineMessageId = callbackQuery.inline_message_id;
            const messageId = callbackQuery.message?.message_id;
            if (inlineMessageId) {
                await bot.editMessageText(loadingMsg, {
                    inline_message_id: inlineMessageId,
                });
            }
            else if (chatId && messageId) {
                await bot.editMessageText(loadingMsg, {
                    chat_id: chatId,
                    message_id: messageId,
                });
            }
            try {
                console.log(`[BASKETBALL] Setting guess for game ${gameId}`);
                const gameState = await (0, basketball_1.setBasketballGuess)(gameId, guess);
                const stake = gameState.stake;
                console.log(`[BASKETBALL] Sending basketball emoji to chatId=${chatId}`);
                const basketballMessage = await bot.sendDice(chatId, { emoji: "🏀" });
                const basketballResult = basketballMessage.dice?.value;
                console.log(`[BASKETBALL] Basketball message received:`, JSON.stringify(basketballMessage, null, 2));
                console.log(`[BASKETBALL] Basketball result: ${basketballResult}`);
                if (!basketballResult) {
                    console.log(`[BASKETBALL] Failed to get basketball result from message`);
                    throw new Error("Failed to get basketball result");
                }
                console.log(`[BASKETBALL] Waiting for basketball animation to finish...`);
                await new Promise((resolve) => setTimeout(resolve, 3000));
                console.log(`[BASKETBALL] Processing basketball result: gameId=${gameId}, basketballResult=${basketballResult}`);
                const result = await (0, basketball_1.processBasketballResult)(gameId, basketballResult);
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText(result.message, {
                        inline_message_id: inlineMessageId,
                        reply_markup: { inline_keyboard: [] },
                    });
                }
                else if (chatId && messageId) {
                    await bot.editMessageText(result.message, {
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: { inline_keyboard: [] },
                    });
                }
                const resultEmoji = result.won ? "🎉" : "😔";
                const guessText = guess === "score" ? "🏀 Score" : "❌ Miss";
                const resultText = basketballResult >= 4 ? "🏀 SCORED" : "❌ MISSED";
                const finalResultText = result.won
                    ? `${resultEmoji} **Congratulations! You won ${result.reward} coins!**\n\n🏀 You guessed: ${guessText}\n🏀 Shot result: ${resultText}\n💰 Reward: ${result.reward} coins`
                    : `${resultEmoji} **Better luck next time!**\n\n🏀 You guessed: ${guessText}\n🏀 Shot result: ${resultText}\n💸 You lost ${stake} coins`;
                const playAgainKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "🎯 Play Again (Same Stake & Guess)",
                                callback_data: `basketball_play_again_exact:${stake}:${guess}`,
                            },
                        ],
                        [
                            {
                                text: "🔄 Play Again (Same Stake)",
                                callback_data: `basketball_play_again_same:${stake}`,
                            },
                        ],
                        [
                            {
                                text: "🏀 New Basketball Game",
                                callback_data: "basketball_play_again_new",
                            },
                        ],
                    ],
                };
                if (inlineMessageId) {
                    await bot.editMessageText(finalResultText, {
                        inline_message_id: inlineMessageId,
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                else if (chatId && messageId) {
                    await bot.editMessageText(finalResultText, {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                else {
                    await bot.sendMessage(chatId, finalResultText, {
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                console.log(`[BASKETBALL] Game ${gameId} completed: won=${result.won}, reward=${result.reward}`);
                return;
            }
            catch {
                await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                return;
            }
        }
        if (action === "basketball_play_again_same" && parts[1]) {
            const stake = parseInt(parts[1]);
            console.log(`[BASKETBALL] Play again same stake: userId=${userId}, stake=${stake}`);
            try {
                const hasBalance = await (0, coinService_1.requireBalance)(userId.toString(), stake);
                if (!hasBalance) {
                    await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                    return;
                }
                const gameState = await (0, basketball_1.createBasketballGame)(userId.toString(), stake);
                const guessKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "🏀 Score",
                                callback_data: `basketball_guess:${gameState.id}:score`,
                            },
                            {
                                text: "❌ Miss",
                                callback_data: `basketball_guess:${gameState.id}:miss`,
                            },
                        ],
                    ],
                };
                const text = `🏀 Hoop Shot Game - Stake: ${stake} Coins\n\nWill your shot score?`;
                const inlineMessageId = callbackQuery.inline_message_id;
                if (inlineMessageId) {
                    await bot.editMessageText(text, {
                        inline_message_id: inlineMessageId,
                        reply_markup: guessKeyboard,
                    });
                }
                else if (chatId && callbackQuery.message?.message_id) {
                    await bot.editMessageText(text, {
                        chat_id: chatId,
                        message_id: callbackQuery.message.message_id,
                        reply_markup: guessKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                console.log(`[BASKETBALL] Play again same stake: created game ${gameState.id}`);
                return;
            }
            catch {
                await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                return;
            }
        }
        if (action === "basketball_play_again_exact" && parts[1] && parts[2]) {
            const stake = parseInt(parts[1]);
            const guess = parts[2];
            const inlineMessageId = callbackQuery.inline_message_id;
            const messageId = callbackQuery.message?.message_id;
            const guessText = guess === "score" ? "🏀 Score" : "❌ Miss";
            const basketballLoadingMessages = [
                `⏳ Shooting the hoop...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
                `🔄 Aiming for the basket...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
                `🏀 Throwing the ball...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
                `⏳ Game is running... Please wait for the result.\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
            ];
            const loadingMsg = basketballLoadingMessages[Math.floor(Math.random() * basketballLoadingMessages.length)];
            if (inlineMessageId) {
                await bot.editMessageText(loadingMsg, {
                    inline_message_id: inlineMessageId,
                });
            }
            else if (chatId && messageId) {
                await bot.editMessageText(loadingMsg, {
                    chat_id: chatId,
                    message_id: messageId,
                });
            }
            console.log(`[BASKETBALL] Play again exact: userId=${userId}, stake=${stake}, guess=${guess}`);
            try {
                const hasBalance = await (0, coinService_1.requireBalance)(userId.toString(), stake);
                if (!hasBalance) {
                    await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                    return;
                }
                const gameState = await (0, basketball_1.createBasketballGame)(userId.toString(), stake);
                await (0, basketball_1.setBasketballGuess)(gameState.id, guess);
                console.log(`[BASKETBALL] Sending basketball emoji to chatId=${chatId}`);
                const basketballMessage = await bot.sendDice(chatId, { emoji: "🏀" });
                const basketballResult = basketballMessage.dice?.value;
                console.log(`[BASKETBALL] Basketball result: ${basketballResult}`);
                if (!basketballResult) {
                    console.log(`[BASKETBALL] Failed to get basketball result from message`);
                    throw new Error("Failed to get basketball result");
                }
                console.log(`[BASKETBALL] Waiting for basketball animation to finish...`);
                await new Promise((resolve) => setTimeout(resolve, 3000));
                console.log(`[BASKETBALL] Processing basketball result: gameId=${gameState.id}, basketballResult=${basketballResult}`);
                const result = await (0, basketball_1.processBasketballResult)(gameState.id, basketballResult);
                const resultEmoji = result.won ? "🎉" : "😔";
                const guessText = guess === "score" ? "🏀 Score" : "❌ Miss";
                const resultText = basketballResult >= 4 ? "🏀 SCORED" : "❌ MISSED";
                const finalResultText = result.won
                    ? `${resultEmoji} **Congratulations! You won ${result.reward} coins!**\n\n🏀 You guessed: ${guessText}\n🏀 Shot result: ${resultText}\n💰 Reward: ${result.reward} coins`
                    : `${resultEmoji} **Better luck next time!**\n\n🏀 You guessed: ${guessText}\n🏀 Shot result: ${resultText}\n💸 You lost ${stake} coins`;
                const playAgainKeyboard = {
                    inline_keyboard: [
                        [
                            {
                                text: "🎯 Play Again (Same Stake & Guess)",
                                callback_data: `basketball_play_again_exact:${stake}:${guess}`,
                            },
                        ],
                        [
                            {
                                text: "🔄 Play Again (Same Stake)",
                                callback_data: `basketball_play_again_same:${stake}`,
                            },
                        ],
                        [
                            {
                                text: "🏀 New Basketball Game",
                                callback_data: "basketball_play_again_new",
                            },
                        ],
                    ],
                };
                if (inlineMessageId) {
                    await bot.editMessageText(finalResultText, {
                        inline_message_id: inlineMessageId,
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                else if (chatId && messageId) {
                    await bot.editMessageText(finalResultText, {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                else {
                    await bot.sendMessage(chatId, finalResultText, {
                        parse_mode: "Markdown",
                        reply_markup: playAgainKeyboard,
                    });
                }
                await bot.answerCallbackQuery(callbackQuery.id);
                console.log(`[BASKETBALL] Play again exact: completed game ${gameState.id}`);
                return;
            }
            catch {
                await handleInsufficientCoins(bot, chatId, callbackQuery.message?.message_id);
                return;
            }
        }
        if (action === "poker_create") {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: "Poker is currently unavailable.",
                show_alert: true,
            });
            return;
        }
        if (action === "poker_stats") {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: "Poker is currently unavailable.",
                show_alert: true,
            });
            return;
        }
        if (action === "basketball_play_again_new") {
            console.log(`[BASKETBALL] Play again new game: userId=${userId}`);
            const stakeKeyboard = {
                inline_keyboard: [
                    [
                        { text: "2 Coins", callback_data: `basketball_stake:2` },
                        { text: "5 Coins", callback_data: `basketball_stake:5` },
                    ],
                    [
                        { text: "10 Coins", callback_data: `basketball_stake:10` },
                        { text: "20 Coins", callback_data: `basketball_stake:20` },
                    ],
                ],
            };
            const text = "🏀 Hoop Shot Game\n\nChoose your stake amount:";
            const inlineMessageId = callbackQuery.inline_message_id;
            if (inlineMessageId) {
                await bot.editMessageText(text, {
                    inline_message_id: inlineMessageId,
                    reply_markup: stakeKeyboard,
                });
            }
            else if (chatId && callbackQuery.message?.message_id) {
                await bot.editMessageText(text, {
                    chat_id: chatId,
                    message_id: callbackQuery.message.message_id,
                    reply_markup: stakeKeyboard,
                });
            }
            await bot.answerCallbackQuery(callbackQuery.id);
            console.log(`[BASKETBALL] Play again new game: showing stake selection`);
            return;
        }
    });
    bot.on("inline_query", async (inlineQuery) => {
        const query = inlineQuery.query;
        const userId = inlineQuery.from.id;
        if (query.startsWith("start ") && !query.startsWith("start_game")) {
            const gameId = query.substring(6).trim();
            const gameState = (0, game_1.getXoGame)(gameId);
            if (!gameId) {
                await bot.answerInlineQuery(inlineQuery.id, [], {
                    switch_pm_text: "Enter game ID",
                    switch_pm_parameter: "start",
                });
                return;
            }
            if (!gameState) {
                await bot.answerInlineQuery(inlineQuery.id, [], {
                    switch_pm_text: "Game not found",
                    switch_pm_parameter: "start",
                });
                return;
            }
            const results = [
                {
                    type: "article",
                    id: `start_${gameId}`,
                    title: "Start Game",
                    description: "Click to join the game!",
                    input_message_content: {
                        message_text: `🕹️ Click to join the game!\n👉 https://t.me/playonhub_bot?start=${gameId}`,
                    },
                },
            ];
            await bot.answerInlineQuery(inlineQuery.id, results);
            return;
        }
        if (query.startsWith("start_game")) {
            const results = [
                {
                    type: "article",
                    id: "start_game_selector",
                    title: "Start Game",
                    description: "Choose a game to play",
                    input_message_content: {
                        message_text: "Starting game setup...",
                    },
                },
            ];
            await bot.answerInlineQuery(inlineQuery.id, results);
            const gameOptionsMessage = "🕹️ Choose a game:";
            const gameOptionsKeyboard = {
                inline_keyboard: [
                    [{ text: "X/O Game", callback_data: "start_game:xo" }],
                    [{ text: "Dots & Boxes", callback_data: "start_game:dots" }],
                    [{ text: "Memory Game", callback_data: "start_game:memory" }],
                ],
            };
            await bot.sendMessage(userId, gameOptionsMessage, {
                reply_markup: gameOptionsKeyboard,
            });
            return;
        }
        const results = [
            {
                type: "article",
                id: "start_new_game",
                title: "🎮 Start a new game",
                description: "Create a new game to play with friends",
                input_message_content: {
                    message_text: "🎮 Let's play a game! Choose what you want to play:",
                },
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "X/O Game", callback_data: "inline_start_game:xo" },
                            { text: "🎲 Dice Game", callback_data: "inline_start_game:dice" },
                        ],
                        [
                            {
                                text: "⚽️ Football Game",
                                callback_data: "inline_start_game:football",
                            },
                            {
                                text: "🏀 Basketball Game",
                                callback_data: "inline_start_game:basketball",
                            },
                        ],
                        [{ text: "Dots & Boxes", callback_data: "inline_start_game:dots" }],
                        [
                            {
                                text: "Memory Game",
                                callback_data: "inline_start_game:memory",
                            },
                        ],
                    ],
                },
            },
        ];
        await bot.answerInlineQuery(inlineQuery.id, results);
    });
}
async function handleInsufficientCoins(bot, chatId, replyToMessageId) {
    const userId = chatId.toString();
    const sponsor = await (0, gameService_1.getUnjoinedSponsorChannel)(userId);
    let text = "❌ <b>Insufficient Coins</b>\n\n" +
        "You need more coins to join this game.\n" +
        "<b>How to get more coins?</b>";
    const keyboard = {
        inline_keyboard: [
            [{ text: "Buy Coins (with TON)", callback_data: "buycoin" }],
        ],
    };
    if (sponsor) {
        text += `\n\n<b>Sponsor Offer:</b>\n${sponsor.previewText}`;
        keyboard.inline_keyboard.push([
            {
                text: "Join Sponsor Channel",
                url: sponsor.link,
            },
        ]);
        keyboard.inline_keyboard.push([
            { text: "I Joined", callback_data: `sponsor_joined:${sponsor.id}` },
        ]);
    }
    else {
        text += "\n\nNo sponsor available for now.";
    }
    await bot.sendMessage(chatId, text, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_to_message_id: replyToMessageId,
        reply_markup: keyboard,
    });
}
//# sourceMappingURL=handlers.js.map