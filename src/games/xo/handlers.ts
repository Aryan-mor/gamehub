import TelegramBot from "node-telegram-bot-api";
import {
  joinXoGame,
  createXoGame,
  getXoGame,
  formatXoBoard,
  VALID_STAKES,
} from "./game";
import { makeXoMove, restartXoGame } from "./logic";
import {
  formatStatsMessage,
  getUser,
  addCoins,
  canClaimDaily,
  setLastFreeCoinAt,
} from "../../bot/games/userStats";
import { requireBalance } from "../../lib/coinService";
import {
  createDiceGame,
  setDiceGuess,
  processDiceResult,
  DICE_STAKES,
  type DiceStake,
  getDiceResultText,
} from "../../bot/games/dice";
import {
  createBlackjackGame,
  hitCard,
  standGame,
  getBlackjackResultText,
  calculateHandValue,
  BLACKJACK_STAKES,
  type BlackjackStake,
} from "../../bot/games/blackjack";
import {
  createFootballGame,
  setFootballGuess,
  processFootballResult,
  FOOTBALL_STAKES,
  FOOTBALL_DIRECTIONS,
  type FootballStake,
} from "../../bot/games/football";
import {
  createBasketballGame,
  setBasketballGuess,
  processBasketballResult,
  BASKETBALL_STAKES,
  type BasketballStake,
} from "../../bot/games/basketball";

/**
 * Registers all XO-specific Telegram bot handlers (move, join, restart, etc.).
 * @param bot - The TelegramBot instance
 * @param deps - Shared dependencies (game store, logger, etc.)
 */
export function registerXoTelegramHandlers(bot: TelegramBot) {
  // /newgame command - now shows game selection
  bot.onText(/\/newgame/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const isBotChat = msg.chat.type === "private";

    if (!userId) {
      await bot.sendMessage(chatId, "❌ Unable to identify user");
      return;
    }

    // If it's a bot chat (private), show only single-player games
    if (isBotChat) {
      const singlePlayerKeyboard = {
        inline_keyboard: [
          [{ text: "🎲 Dice Game", callback_data: "newgame:dice" }],
          [{ text: "🃏 Blackjack Game", callback_data: "newgame:blackjack" }],
          [{ text: "⚽️ Football Game", callback_data: "newgame:football" }],
          [{ text: "🏀 Basketball Game", callback_data: "newgame:basketball" }],
        ],
      };

      await bot.sendMessage(
        chatId,
        "🎮 Choose a game to play:\n\n*Single-player games available in bot chat*",
        {
          reply_markup: singlePlayerKeyboard,
          parse_mode: "Markdown",
        }
      );
    } else {
      // If it's a group chat, show all games
      const allGamesKeyboard = {
        inline_keyboard: [
          [
            { text: "🎮 X/O Game", callback_data: "newgame:xo" },
            { text: "🎲 Dice Game", callback_data: "newgame:dice" },
          ],
          [
            { text: "🃏 Blackjack Game", callback_data: "newgame:blackjack" },
            { text: "⚽️ Football Game", callback_data: "newgame:football" },
          ],
          [{ text: "🏀 Basketball Game", callback_data: "newgame:basketball" }],
        ],
      };

      await bot.sendMessage(
        chatId,
        "🎮 Choose a game to play:\n\n*All games available in group chat*",
        {
          reply_markup: allGamesKeyboard,
          parse_mode: "Markdown",
        }
      );
    }
  });

  // /join command
  bot.onText(
    /\/join (.+)/,
    async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      const gameId = match && match[1];
      if (!userId || !gameId) {
        await bot.sendMessage(
          chatId,
          "❌ Please provide a valid game ID: /join <gameId>"
        );
        return;
      }

      try {
        const gameState = await joinXoGame(
          gameId,
          userId.toString(),
          msg.from?.first_name || "Player"
        );
        if (!gameState) {
          await bot.sendMessage(chatId, "❌ Game not found or already full.");
          return;
        }
        const boardMessage = formatXoBoard(gameState.board);
        const stakeInfo = `🎮 X/O Game – Stake: ${gameState.stake} Coins\n\n`;
        const statusMessage = `🎯 It's ${
          gameState.players[gameState.currentPlayer]?.name ||
          gameState.currentPlayer
        }'s turn`;
        await bot.sendMessage(
          chatId,
          `${stakeInfo}${boardMessage}\n\n${statusMessage}`
        );
        console.log(`[XO] /join: user ${userId} joined game ${gameId}`);
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.sendMessage(chatId, "❌ Insufficient Coins.");
        } else if (error instanceof Error) {
          await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        } else {
          await bot.sendMessage(chatId, `❌ Error occurred.`);
        }
      }
    }
  );

  // Callback queries (move, join_game, restart_game, etc.)
  bot.on("callback_query", async (callbackQuery: TelegramBot.CallbackQuery) => {
    const userId = callbackQuery.from?.id;
    const data = callbackQuery.data;
    let chatId = callbackQuery.message?.chat.id;
    if (!chatId && callbackQuery.inline_message_id) chatId = userId;
    if (!userId || !data || !chatId) return;
    const parts = data.split(":");
    const action = parts[0];
    const gameId = parts[1];
    const position = parts[2];

    // --- Glass Button Handlers ---
    console.log(
      `[BOT] Callback query received: data=${data}, userId=${userId}`
    );

    if (data === "startgame") {
      const isBotChat = callbackQuery.message?.chat.type === "private";

      // If it's a bot chat (private), show only single-player games
      if (isBotChat) {
        const singlePlayerKeyboard = {
          inline_keyboard: [
            [{ text: "🎲 Dice Game", callback_data: "newgame:dice" }],
            [{ text: "🃏 Blackjack Game", callback_data: "newgame:blackjack" }],
            [{ text: "⚽️ Football Game", callback_data: "newgame:football" }],
            [
              {
                text: "🏀 Basketball Game",
                callback_data: "newgame:basketball",
              },
            ],
          ],
        };

        await bot.editMessageText(
          "🎮 Choose a game to play:\n\n*Single-player games available in bot chat*",
          {
            chat_id: chatId,
            message_id: callbackQuery.message?.message_id,
            reply_markup: singlePlayerKeyboard,
            parse_mode: "Markdown",
          }
        );
      } else {
        // If it's a group chat, show all games
        const allGamesKeyboard = {
          inline_keyboard: [
            [
              { text: "🎮 X/O Game", callback_data: "newgame:xo" },
              { text: "🎲 Dice Game", callback_data: "newgame:dice" },
            ],
            [
              { text: "🃏 Blackjack Game", callback_data: "newgame:blackjack" },
              { text: "⚽️ Football Game", callback_data: "newgame:football" },
            ],
            [
              {
                text: "🏀 Basketball Game",
                callback_data: "newgame:basketball",
              },
            ],
          ],
        };

        await bot.editMessageText(
          "🎮 Choose a game to play:\n\n*All games available in group chat*",
          {
            chat_id: chatId,
            message_id: callbackQuery.message?.message_id,
            reply_markup: allGamesKeyboard,
            parse_mode: "Markdown",
          }
        );
      }

      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === "freecoin") {
      const userId = String(callbackQuery.from?.id);
      const { canClaim, nextClaimIn } = await canClaimDaily(userId);

      if (canClaim) {
        await addCoins(userId, 20, "daily free coin");
        await setLastFreeCoinAt(userId, Date.now());
        await bot.editMessageText(
          `🪙 You claimed <b>+20</b> daily Coins! Come back tomorrow.`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message?.message_id,
            parse_mode: "HTML",
          }
        );
      } else {
        // Format nextClaimIn as HH:MM:SS
        const h = Math.floor(nextClaimIn / 3600000);
        const m = Math.floor((nextClaimIn % 3600000) / 60000);
        const s = Math.floor((nextClaimIn % 60000) / 1000);
        const pad = (n: number) => n.toString().padStart(2, "0");
        await bot.editMessageText(
          `⏰ You already claimed today. Come back in ${pad(h)}:${pad(m)}:${pad(
            s
          )}.`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message?.message_id,
          }
        );
      }

      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === "help") {
      await bot.editMessageText(
        `Available commands:\n` +
          `/start - Start the bot\n` +
          `/startgame - Start a new game\n` +
          `/freecoin - Claim your daily free coins\n` +
          `/help - Show this help message\n` +
          `/newgame - Create a new game\n` +
          `/games - Show your unfinished games\n` +
          `/stats - Show your game statistics\n` +
          `/balance - Show your coin balance`,
        {
          chat_id: chatId,
          message_id: callbackQuery.message?.message_id,
        }
      );

      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === "balance") {
      const userId = String(callbackQuery.from?.id);
      const user = await getUser(userId);
      await bot.editMessageText(`💰 Your balance: <b>${user.coins}</b> Coins`, {
        chat_id: chatId,
        message_id: callbackQuery.message?.message_id,
        parse_mode: "HTML",
      });

      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // --- New Game Selection Handler ---
    if (action === "newgame" && parts[1]) {
      const gameType = parts[1];
      console.log(
        `[BOT] newgame selection: userId=${userId}, gameType=${gameType}`
      );

      if (gameType === "dice") {
        // Show dice stake selection
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

        // Update the message
        const inlineMessageId = callbackQuery.inline_message_id;
        if (inlineMessageId) {
          await bot.editMessageText(text, {
            inline_message_id: inlineMessageId,
            reply_markup: stakeKeyboard,
          });
        } else if (chatId && callbackQuery.message?.message_id) {
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
        // Show football stake selection
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

        // Update the message
        const inlineMessageId = callbackQuery.inline_message_id;
        if (inlineMessageId) {
          await bot.editMessageText(text, {
            inline_message_id: inlineMessageId,
            reply_markup: stakeKeyboard,
          });
        } else if (chatId && callbackQuery.message?.message_id) {
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
        // Show basketball stake selection
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

        // Update the message
        const inlineMessageId = callbackQuery.inline_message_id;
        if (inlineMessageId) {
          await bot.editMessageText(text, {
            inline_message_id: inlineMessageId,
            reply_markup: stakeKeyboard,
          });
        } else if (chatId && callbackQuery.message?.message_id) {
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
        // Show blackjack stake selection
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

        // Update the message
        const inlineMessageId = callbackQuery.inline_message_id;
        if (inlineMessageId) {
          await bot.editMessageText(text, {
            inline_message_id: inlineMessageId,
            reply_markup: stakeKeyboard,
          });
        } else if (chatId && callbackQuery.message?.message_id) {
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
        // Show X/O stake selection
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

        // Update the message
        const inlineMessageId = callbackQuery.inline_message_id;
        if (inlineMessageId) {
          await bot.editMessageText(text, {
            inline_message_id: inlineMessageId,
            reply_markup: stakeKeyboard,
          });
        } else if (chatId && callbackQuery.message?.message_id) {
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

    // --- Create Stake Handler ---
    if (action === "create_stake" && parts[1]) {
      const stake = parseInt(parts[1]);
      if (!VALID_STAKES.includes(stake)) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Invalid stake amount",
          show_alert: true,
        });
        return;
      }

      try {
        // Check balance
        const hasBalance = await requireBalance(userId.toString(), stake);
        if (!hasBalance) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
          return;
        }

        const { gameId: newGameId } = await createXoGame(
          userId.toString(),
          callbackQuery.from?.first_name || "Player",
          stake
        );

        const payout = Math.floor(stake * 0.9 * 2);
        const gameMessage = `🎮 X/O Game – Stake: ${stake} Coins\n\nCreated by ${
          callbackQuery.from?.first_name || "Player"
        }. Waiting for player 2…\n\n(Winner gets ${payout} Coins – 10% fee)`;

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
        console.log(
          `[XO] create_stake: created game ${newGameId} with stake ${stake} for user ${userId}`
        );
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to create game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to create game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // --- Inline Start Game Handler ---
    if (action === "inline_start_game" && gameId) {
      if (gameId === "xo") {
        // Show stake selection for inline games
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
        // Show stake selection for dice games
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
          await bot.editMessageText(
            "🎲 Dice Guess Game\n\nChoose your stake amount:",
            {
              inline_message_id: inlineMessageId,
              reply_markup: stakeKeyboard,
            }
          );
        }
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      if (gameId === "football") {
        // Show stake selection for football games
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
          await bot.editMessageText(
            "⚽️ Direction Guess Game\n\nChoose your stake amount:",
            {
              inline_message_id: inlineMessageId,
              reply_markup: stakeKeyboard,
            }
          );
        }
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      if (gameId === "basketball") {
        // Show stake selection for basketball games
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
          await bot.editMessageText(
            "🏀 Hoop Shot Game\n\nChoose your stake amount:",
            {
              inline_message_id: inlineMessageId,
              reply_markup: stakeKeyboard,
            }
          );
        }
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }
    }

    // --- Inline Create Stake Handler ---
    if (action === "inline_create_stake" && parts[1]) {
      const stake = parseInt(parts[1]);
      if (!VALID_STAKES.includes(stake)) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Invalid stake amount",
          show_alert: true,
        });
        return;
      }

      try {
        // Check balance
        const hasBalance = await requireBalance(userId.toString(), stake);
        if (!hasBalance) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
          return;
        }

        const { gameId: newGameId } = await createXoGame(
          userId.toString(),
          callbackQuery.from?.first_name || "Player",
          stake
        );

        const payout = Math.floor(stake * 0.9 * 2);
        const gameMessage = `🎮 X/O Game – Stake: ${stake} Coins\n\nCreated by ${
          callbackQuery.from?.first_name || "Player"
        }. Waiting for player 2…\n\n(Winner gets ${payout} Coins – 10% fee)`;

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
        console.log(
          `[XO] inline_create_stake: created game ${newGameId} with stake ${stake} for user ${userId}`
        );
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to create game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to create game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // --- Move Handler ---
    if (action === "move" && gameId && position) {
      const pos = parseInt(position);
      const moveResult = await makeXoMove(gameId, userId.toString(), pos);
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

      const boardMessage = formatXoBoard(gameState.board);
      const stakeInfo = `X/O – Stake ${
        gameState.stake
      } Coins • Winner takes ${Math.floor(gameState.stakePool! * 0.9)}\n\n`;

      let statusMessage = "";
      if (gameState.winner) {
        const winnerName =
          gameState.winner === "X"
            ? gameState.players.X?.name
            : gameState.players.O?.name;
        const payout = Math.floor(gameState.stakePool! * 0.9);
        statusMessage = `🏆 ${winnerName} wins ${payout} Coins! (10% fee kept by bot)`;

        // Add winner stats and head-to-head record
        const winnerId =
          gameState.winner === "X"
            ? gameState.players.X?.id
            : gameState.players.O?.id;
        const loserId =
          gameState.winner === "X"
            ? gameState.players.O?.id
            : gameState.players.X?.id;
        const loserName =
          gameState.winner === "X"
            ? gameState.players.O?.name
            : gameState.players.X?.name;
        if (winnerId && loserId && winnerName && loserName) {
          const statsMsg = await formatStatsMessage(
            winnerId,
            loserId,
            winnerName,
            loserName,
            "xo"
          );
          statusMessage += `\n${statsMsg}`;
        }
      } else if (gameState.status === "draw") {
        statusMessage = `🤝 Draw – stakes refunded.`;
      } else {
        statusMessage = `🎯 It's ${
          gameState.players[gameState.currentPlayer]?.name ||
          gameState.currentPlayer
        }'s turn`;
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
      } else {
        keyboard = {
          inline_keyboard: Array.from({ length: 3 }, (_, row) =>
            Array.from({ length: 3 }, (_, col) => {
              const idx = row * 3 + col;
              const cell = gameState.board[idx];
              const text = cell === "-" ? "⬜" : cell === "X" ? "❌" : "🟢";
              const callbackData =
                cell === "-" ? `move:${gameId}:${idx}` : "noop";
              return { text, callback_data: callbackData };
            })
          ),
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

    // --- Join Game Handler ---
    if (action === "join_game" && gameId) {
      try {
        const gameState = await joinXoGame(
          gameId,
          userId.toString(),
          callbackQuery.from?.first_name || "Player"
        );
        if (!gameState) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Game not found or already full",
            show_alert: true,
          });
          return;
        }

        const boardMessage = formatXoBoard(gameState.board);
        const stakeInfo = `X/O – Stake ${
          gameState.stake
        } Coins • Winner takes ${Math.floor(gameState.stakePool! * 0.9)}\n\n`;
        const statusMessage = `🎯 It's ${
          gameState.players[gameState.currentPlayer]?.name ||
          gameState.currentPlayer
        }'s turn`;
        const fullMessage = `${stakeInfo}${boardMessage}\n\n${statusMessage}`;

        const keyboard = {
          inline_keyboard: Array.from({ length: 3 }, (_, row) =>
            Array.from({ length: 3 }, (_, col) => {
              const idx = row * 3 + col;
              const cell = gameState.board[idx];
              const text = cell === "-" ? "⬜" : cell === "X" ? "❌" : "🟢";
              const callbackData =
                cell === "-" ? `move:${gameId}:${idx}` : "noop";
              return { text, callback_data: callbackData };
            })
          ),
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
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to join game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to join game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // --- Restart Game Handler ---
    if (action === "restart_game" && gameId) {
      try {
        const newGameState = await restartXoGame(gameId);
        if (!newGameState) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Game not found",
            show_alert: true,
          });
          return;
        }

        const boardMessage = formatXoBoard(newGameState.board);
        const stakeInfo = `X/O – Stake ${
          newGameState.stake
        } Coins • Winner takes ${Math.floor(
          newGameState.stakePool! * 0.9
        )}\n\n`;
        const statusMessage = `🎯 It's ${
          newGameState.players[newGameState.currentPlayer]?.name ||
          newGameState.currentPlayer
        }'s turn`;
        const fullMessage = `${stakeInfo}${boardMessage}\n\n${statusMessage}`;

        const keyboard = {
          inline_keyboard: Array.from({ length: 3 }, (_, row) =>
            Array.from({ length: 3 }, (_, col) => {
              const idx = row * 3 + col;
              const cell = newGameState.board[idx];
              const text = cell === "-" ? "⬜" : cell === "X" ? "❌" : "🟢";
              const callbackData =
                cell === "-" ? `move:${gameId}:${idx}` : "noop";
              return { text, callback_data: callbackData };
            })
          ),
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
      } catch (error: unknown) {
        if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to restart game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to restart game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // --- Noop Handler ---
    if (action === "noop") {
      await bot.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // --- Copy Handler ---
    if (action === "copy" && gameId) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: `Game ID copied: ${gameId}`,
        show_alert: true,
      });
      return;
    }

    // --- Dice Game Handlers ---

    // Handle dice stake selection
    if (action === "dice_stake" && parts[1]) {
      console.log(
        `[DICE] dice_stake callback received: userId=${userId}, parts=`,
        parts
      );
      const stake = parseInt(parts[1]) as DiceStake;
      console.log(`[DICE] Parsed stake: ${stake}`);

      if (!DICE_STAKES.includes(stake)) {
        console.log(`[DICE] Invalid stake amount: ${stake}`);
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Invalid stake amount",
          show_alert: true,
        });
        return;
      }

      try {
        console.log(
          `[DICE] Creating dice game for userId=${userId}, stake=${stake}`
        );
        const gameState = await createDiceGame(userId.toString(), stake);

        const guessKeyboard = {
          inline_keyboard: [
            // Exact values row 1 (4x multiplier)
            [
              { text: "1 (4×)", callback_data: `dice_guess:${gameState.id}:1` },
              { text: "2 (4×)", callback_data: `dice_guess:${gameState.id}:2` },
              { text: "3 (4×)", callback_data: `dice_guess:${gameState.id}:3` },
            ],
            // Exact values row 2 (4x multiplier)
            [
              { text: "4 (4×)", callback_data: `dice_guess:${gameState.id}:4` },
              { text: "5 (4×)", callback_data: `dice_guess:${gameState.id}:5` },
              { text: "6 (4×)", callback_data: `dice_guess:${gameState.id}:6` },
            ],
            // Ranges row 1 (2x multiplier)
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
            // Ranges row 2 (2x multiplier)
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
        const text =
          `🎲 Dice Guess Game - Stake: ${stake} Coins\n\nWhat's your guess?\n\n` +
          `🎯 Exact values (1-6): 4× reward\n` +
          `📊 Ranges (ODD/EVEN/1-3/4-6): 2× reward`;
        if (inlineMessageId) {
          await bot.editMessageText(text, {
            inline_message_id: inlineMessageId,
            reply_markup: guessKeyboard,
          });
        } else if (chatId && messageId) {
          await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: guessKeyboard,
          });
        }

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(
          `[DICE] Created game ${gameState.id} with stake ${stake} for user ${userId}`
        );
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to create dice game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to create dice game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // Handle dice guess selection
    if (action === "dice_guess" && parts[1] && parts[2]) {
      console.log(
        `[DICE] dice_guess callback received: userId=${userId}, parts=`,
        parts
      );
      const gameId = parts[1];
      const guess = parts[2];
      console.log(`[DICE] Processing guess: gameId=${gameId}, guess=${guess}`);

      // Set the guess and get game state (to get stake)
      const gameState = await setDiceGuess(gameId, guess);
      const stake = gameState.stake;
      // --- Game Running Status ---
      const diceLoadingMessages = [
        `⏳ Rolling the dice...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
        `🔄 Shaking the cup...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
        `🎲 Tossing the dice...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
        `⏳ Game is running... Please wait for the result.\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
      ];
      const loadingMsg =
        diceLoadingMessages[
          Math.floor(Math.random() * diceLoadingMessages.length)
        ];
      const inlineMessageId = callbackQuery.inline_message_id;
      const messageId = callbackQuery.message?.message_id;
      if (inlineMessageId) {
        await bot.editMessageText(loadingMsg, {
          inline_message_id: inlineMessageId,
        });
      } else if (chatId && messageId) {
        await bot.editMessageText(loadingMsg, {
          chat_id: chatId,
          message_id: messageId,
        });
      }

      try {
        // Set the guess and get game state
        console.log(`[DICE] Setting guess for game ${gameId}`);
        const gameState = await setDiceGuess(gameId, guess);
        const stake = gameState.stake;

        // Send the dice emoji
        console.log(`[DICE] Sending dice emoji to chatId=${chatId}`);
        const diceMessage = await bot.sendDice(chatId, { emoji: "🎲" });
        const diceResult = diceMessage.dice?.value;
        console.log(
          `[DICE] Dice message received:`,
          JSON.stringify(diceMessage, null, 2)
        );
        console.log(`[DICE] Dice result: ${diceResult}`);

        if (!diceResult) {
          console.log(`[DICE] Failed to get dice result from message`);
          throw new Error("Failed to get dice result");
        }

        // Wait for dice animation to finish (3 seconds)
        console.log(`[DICE] Waiting for dice animation to finish...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Process the result
        console.log(
          `[DICE] Processing dice result: gameId=${gameId}, diceResult=${diceResult}`
        );
        const result = await processDiceResult(gameId, diceResult);

        // Use centralized result text
        const resultText = getDiceResultText(
          result.won,
          result.reward,
          guess,
          diceResult,
          stake
        );

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

        // Always update the original message to the result (with glass buttons)
        if (inlineMessageId) {
          await bot.editMessageText(resultText, {
            inline_message_id: inlineMessageId,
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        } else if (chatId && messageId) {
          await bot.editMessageText(resultText, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        } else {
          // Fallback: send as a new message
          await bot.sendMessage(chatId, resultText, {
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        }

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(
          `[DICE] Game ${gameId} completed: won=${result.won}, reward=${result.reward}`
        );
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to process dice game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to process dice game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // Handle play again with same stake
    if (action === "dice_play_again_same" && parts[1]) {
      const stake = parseInt(parts[1]);
      console.log(
        `[DICE] Play again same stake: userId=${userId}, stake=${stake}`
      );

      try {
        // Check balance
        const hasBalance = await requireBalance(userId.toString(), stake);
        if (!hasBalance) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
          return;
        }

        // Create new game with same stake
        const gameState = await createDiceGame(
          userId.toString(),
          stake as DiceStake
        );

        // Show guess options
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

        // Update the message
        const inlineMessageId = callbackQuery.inline_message_id;
        if (inlineMessageId) {
          await bot.editMessageText(text, {
            inline_message_id: inlineMessageId,
            reply_markup: guessKeyboard,
          });
        } else if (chatId && callbackQuery.message?.message_id) {
          await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: guessKeyboard,
          });
        }

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(
          `[DICE] Play again same stake: created game ${gameState.id}`
        );
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to start new game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to start new game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // Handle play again with same stake and same guess
    if (action === "dice_play_again_exact" && parts[1] && parts[2]) {
      const stake = parseInt(parts[1]);
      const guess = parts[2];
      const inlineMessageId = callbackQuery.inline_message_id;
      const messageId = callbackQuery.message?.message_id;
      // --- Game Running Status ---
      const diceLoadingMessages = [
        `⏳ Rolling the dice...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
        `🔄 Shaking the cup...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
        `🎲 Tossing the dice...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
        `⏳ Game is running... Please wait for the result.\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guess}`,
      ];
      const loadingMsg =
        diceLoadingMessages[
          Math.floor(Math.random() * diceLoadingMessages.length)
        ];
      if (inlineMessageId) {
        await bot.editMessageText(loadingMsg, {
          inline_message_id: inlineMessageId,
        });
      } else if (chatId && messageId) {
        await bot.editMessageText(loadingMsg, {
          chat_id: chatId,
          message_id: messageId,
        });
      }
      console.log(
        `[DICE] Play again exact: userId=${userId}, stake=${stake}, guess=${guess}`
      );

      try {
        // Check balance
        const hasBalance = await requireBalance(userId.toString(), stake);
        if (!hasBalance) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
          return;
        }

        // Create new game with same stake
        const gameState = await createDiceGame(
          userId.toString(),
          stake as DiceStake
        );

        // Set the same guess immediately
        await setDiceGuess(gameState.id, guess);

        // Send the dice emoji
        console.log(`[DICE] Sending dice emoji to chatId=${chatId}`);
        const diceMessage = await bot.sendDice(chatId, { emoji: "🎲" });
        const diceResult = diceMessage.dice?.value;
        console.log(`[DICE] Dice result: ${diceResult}`);

        if (!diceResult) {
          console.log(`[DICE] Failed to get dice result from message`);
          throw new Error("Failed to get dice result");
        }

        // Wait for dice animation to finish (3 seconds)
        console.log(`[DICE] Waiting for dice animation to finish...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Process the result
        console.log(
          `[DICE] Processing dice result: gameId=${gameState.id}, diceResult=${diceResult}`
        );
        const result = await processDiceResult(gameState.id, diceResult);

        // Use centralized result text
        const resultText = getDiceResultText(
          result.won,
          result.reward,
          guess,
          diceResult,
          stake
        );

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

        // Always update the original message to the result (with glass buttons)
        if (inlineMessageId) {
          await bot.editMessageText(resultText, {
            inline_message_id: inlineMessageId,
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        } else if (chatId && messageId) {
          await bot.editMessageText(resultText, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        } else {
          // Fallback: send as a new message
          await bot.sendMessage(chatId, resultText, {
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        }

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(`[DICE] Play again exact: completed game ${gameState.id}`);
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to start new game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to start new game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // Handle new dice game
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

      // Update the message
      const inlineMessageId = callbackQuery.inline_message_id;
      if (inlineMessageId) {
        await bot.editMessageText(text, {
          inline_message_id: inlineMessageId,
          reply_markup: stakeKeyboard,
        });
      } else if (chatId && callbackQuery.message?.message_id) {
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

    // --- Blackjack Game Handlers ---

    // Handle blackjack stake selection
    if (action === "blackjack_stake" && parts[1]) {
      console.log(
        `[BLACKJACK] blackjack_stake callback received: userId=${userId}, parts=`,
        parts
      );
      const stake = parseInt(parts[1]) as BlackjackStake;
      console.log(`[BLACKJACK] Parsed stake: ${stake}`);

      if (!BLACKJACK_STAKES.includes(stake)) {
        console.log(`[BLACKJACK] Invalid stake amount: ${stake}`);
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Invalid stake amount",
          show_alert: true,
        });
        return;
      }

      try {
        console.log(
          `[BLACKJACK] Creating blackjack game for userId=${userId}, stake=${stake}`
        );
        const gameState = await createBlackjackGame(userId.toString(), stake);

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
          ],
        };

        const playerValue = calculateHandValue(gameState.playerHand);

        const chatId = callbackQuery.message?.chat.id;
        const messageId = callbackQuery.message?.message_id;
        const inlineMessageId = callbackQuery.inline_message_id;
        const text =
          `🃏 Blackjack Game - Stake: ${stake} Coins\n\n` +
          `👤 Your Hand: ${gameState.playerHand
            .map((card) => card.displayValue)
            .join(", ")} (${playerValue})\n` +
          `🎰 Dealer's Hand: ${gameState.dealerHand[0].displayValue}, ?\n\n` +
          `What would you like to do?`;

        if (inlineMessageId) {
          await bot.editMessageText(text, {
            inline_message_id: inlineMessageId,
            reply_markup: actionKeyboard,
          });
        } else if (chatId && messageId) {
          await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: actionKeyboard,
          });
        }

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(
          `[BLACKJACK] Created game ${gameState.id} with stake ${stake} for user ${userId}`
        );
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to create blackjack game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to create blackjack game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // Handle blackjack hit action
    if (action === "blackjack_hit" && parts[1]) {
      console.log(
        `[BLACKJACK] blackjack_hit callback received: userId=${userId}, gameId=${parts[1]}`
      );
      const gameId = parts[1];

      try {
        const gameState = await hitCard(gameId);
        const playerValue = calculateHandValue(gameState.playerHand);

        if (gameState.status === "completed") {
          // Player busted
          const resultText = getBlackjackResultText(
            "lose",
            0,
            playerValue,
            0,
            gameState.stake
          );

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
            });
          } else if (chatId && messageId) {
            await bot.editMessageText(resultText, {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: playAgainKeyboard,
            });
          }
        } else {
          // Game continues
          const actionKeyboard = {
            inline_keyboard: [
              [
                { text: "🃏 Hit", callback_data: `blackjack_hit:${gameId}` },
                {
                  text: "✋ Stand",
                  callback_data: `blackjack_stand:${gameId}`,
                },
              ],
            ],
          };

          const text =
            `🃏 Blackjack Game - Stake: ${gameState.stake} Coins\n\n` +
            `👤 Your Hand: ${gameState.playerHand
              .map((card) => card.displayValue)
              .join(", ")} (${playerValue})\n` +
            `🎰 Dealer's Hand: ${gameState.dealerHand[0].displayValue}, ?\n\n` +
            `What would you like to do?`;

          const chatId = callbackQuery.message?.chat.id;
          const messageId = callbackQuery.message?.message_id;
          const inlineMessageId = callbackQuery.inline_message_id;

          if (inlineMessageId) {
            await bot.editMessageText(text, {
              inline_message_id: inlineMessageId,
              reply_markup: actionKeyboard,
            });
          } else if (chatId && messageId) {
            await bot.editMessageText(text, {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: actionKeyboard,
            });
          }
        }

        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      } catch (error: unknown) {
        console.error(`[BLACKJACK] hitCard error:`, error);
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Failed to hit card",
          show_alert: true,
        });
        return;
      }
    }

    // Handle blackjack stand action
    if (action === "blackjack_stand" && parts[1]) {
      console.log(
        `[BLACKJACK] blackjack_stand callback received: userId=${userId}, gameId=${parts[1]}`
      );
      const gameId = parts[1];

      try {
        const result = await standGame(gameId);

        const playAgainKeyboard = {
          inline_keyboard: [
            [
              {
                text: "🔄 Play Again (Same Stake)",
                callback_data: `blackjack_play_again:${
                  result.reward > 0 ? result.reward / 2 : 0
                }`,
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
          });
        } else if (chatId && messageId) {
          await bot.editMessageText(result.message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: playAgainKeyboard,
          });
        }

        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      } catch (error: unknown) {
        console.error(`[BLACKJACK] standGame error:`, error);
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Failed to stand",
          show_alert: true,
        });
        return;
      }
    }

    // Handle blackjack play again
    if (action === "blackjack_play_again" && parts[1]) {
      // const stake = parseInt(parts[1]); // Not used in this handler

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
      } else if (chatId && messageId) {
        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: stakeKeyboard,
        });
      }

      await bot.answerCallbackQuery(callbackQuery.id);
      console.log(`[BLACKJACK] Play again: showing stake selection`);
      return;
    }

    // --- Football Game Handlers ---

    // Handle football stake selection
    if (action === "football_stake" && parts[1]) {
      console.log(
        `[FOOTBALL] football_stake callback received: userId=${userId}, parts=`,
        parts
      );
      const stake = parseInt(parts[1]) as FootballStake;
      console.log(`[FOOTBALL] Parsed stake: ${stake}`);

      if (!FOOTBALL_STAKES.includes(stake)) {
        console.log(`[FOOTBALL] Invalid stake amount: ${stake}`);
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Invalid stake amount",
          show_alert: true,
        });
        return;
      }

      try {
        console.log(
          `[FOOTBALL] Creating football game for userId=${userId}, stake=${stake}`
        );
        const gameState = await createFootballGame(userId.toString(), stake);

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
        const text =
          `⚽️ Direction Guess Game - Stake: ${stake} Coins\n\nWhere do you want to shoot?\n\n` +
          `🎯 Win 4× your stake if the ball lands in your chosen direction!`;
        if (inlineMessageId) {
          await bot.editMessageText(text, {
            inline_message_id: inlineMessageId,
            reply_markup: directionKeyboard,
          });
        } else if (chatId && messageId) {
          await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: directionKeyboard,
          });
        }

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(
          `[FOOTBALL] Created game ${gameState.id} with stake ${stake} for user ${userId}`
        );
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to create football game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to create football game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // Handle football direction selection
    if (action === "football_guess" && parts[1] && parts[2]) {
      console.log(
        `[FOOTBALL] football_guess callback received: userId=${userId}, parts=`,
        parts
      );
      const gameId = parts[1];
      const guess = parseInt(parts[2]);
      console.log(
        `[FOOTBALL] Processing guess: gameId=${gameId}, guess=${guess}`
      );

      // Set the guess and get game state (to get stake)
      const gameState = await setFootballGuess(gameId, guess);
      const stake = gameState.stake;
      // --- Game Running Status ---
      const guessDirection =
        FOOTBALL_DIRECTIONS[guess as keyof typeof FOOTBALL_DIRECTIONS];
      const footballLoadingMessages = [
        `⏳ Kicking the ball...\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
        `🔄 Preparing the shot...\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
        `⚽️ Shooting...\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
        `⏳ Game is running... Please wait for the result.\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
      ];
      const loadingMsg =
        footballLoadingMessages[
          Math.floor(Math.random() * footballLoadingMessages.length)
        ];
      const inlineMessageId = callbackQuery.inline_message_id;
      const messageId = callbackQuery.message?.message_id;
      if (inlineMessageId) {
        await bot.editMessageText(loadingMsg, {
          inline_message_id: inlineMessageId,
        });
      } else if (chatId && messageId) {
        await bot.editMessageText(loadingMsg, {
          chat_id: chatId,
          message_id: messageId,
        });
      }

      try {
        // Set the guess and get game state
        console.log(`[FOOTBALL] Setting guess for game ${gameId}`);
        const gameState = await setFootballGuess(gameId, guess);
        const stake = gameState.stake;

        // Send the football emoji
        console.log(`[FOOTBALL] Sending football emoji to chatId=${chatId}`);
        const footballMessage = await bot.sendDice(chatId, { emoji: "⚽️" });
        const footballResult = footballMessage.dice?.value;
        console.log(
          `[FOOTBALL] Football message received:`,
          JSON.stringify(footballMessage, null, 2)
        );
        console.log(`[FOOTBALL] Football result: ${footballResult}`);

        if (!footballResult) {
          console.log(`[FOOTBALL] Failed to get football result from message`);
          throw new Error("Failed to get football result");
        }

        // Wait for football animation to finish (3 seconds)
        console.log(`[FOOTBALL] Waiting for football animation to finish...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Process the result
        console.log(
          `[FOOTBALL] Processing football result: gameId=${gameId}, footballResult=${footballResult}`
        );
        const result = await processFootballResult(gameId, footballResult);

        // Update the original message to remove buttons
        const inlineMessageId = callbackQuery.inline_message_id;
        if (inlineMessageId) {
          await bot.editMessageText(result.message, {
            inline_message_id: inlineMessageId,
            reply_markup: { inline_keyboard: [] },
          });
        } else if (chatId && messageId) {
          await bot.editMessageText(result.message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: { inline_keyboard: [] },
          });
        }

        // Send result message with glass buttons
        const resultEmoji = result.won ? "🎉" : "😔";
        const guessDirection =
          FOOTBALL_DIRECTIONS[guess as keyof typeof FOOTBALL_DIRECTIONS];
        const resultDirection =
          FOOTBALL_DIRECTIONS[
            footballResult as keyof typeof FOOTBALL_DIRECTIONS
          ];
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

        // Always update the original message to the result (with glass buttons)
        if (inlineMessageId) {
          await bot.editMessageText(resultText, {
            inline_message_id: inlineMessageId,
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        } else if (chatId && messageId) {
          await bot.editMessageText(resultText, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        } else {
          // Fallback: send as a new message
          await bot.sendMessage(chatId, resultText, {
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        }

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(
          `[FOOTBALL] Game ${gameId} completed: won=${result.won}, reward=${result.reward}`
        );
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to process football game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to process football game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // Handle play again with same stake
    if (action === "football_play_again_same" && parts[1]) {
      const stake = parseInt(parts[1]) as FootballStake;
      console.log(
        `[FOOTBALL] Play again same stake: userId=${userId}, stake=${stake}`
      );

      try {
        // Check balance
        const hasBalance = await requireBalance(userId.toString(), stake);
        if (!hasBalance) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
          return;
        }

        // Create new game with same stake
        const gameState = await createFootballGame(userId.toString(), stake);

        // Show direction options
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

        // Update the message
        const inlineMessageId = callbackQuery.inline_message_id;
        if (inlineMessageId) {
          await bot.editMessageText(text, {
            inline_message_id: inlineMessageId,
            reply_markup: directionKeyboard,
          });
        } else if (chatId && callbackQuery.message?.message_id) {
          await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: directionKeyboard,
          });
        }

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(
          `[FOOTBALL] Play again same stake: created game ${gameState.id}`
        );
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to start new game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to start new game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // Handle play again with same stake and same direction
    if (action === "football_play_again_exact" && parts[1] && parts[2]) {
      const stake = parseInt(parts[1]) as FootballStake;
      const guess = parseInt(parts[2]);
      const inlineMessageId = callbackQuery.inline_message_id;
      const messageId = callbackQuery.message?.message_id;
      // --- Game Running Status ---
      const guessDirection =
        FOOTBALL_DIRECTIONS[guess as keyof typeof FOOTBALL_DIRECTIONS];
      const footballLoadingMessages = [
        `⏳ Kicking the ball...\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
        `🔄 Preparing the shot...\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
        `⚽️ Shooting...\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
        `⏳ Game is running... Please wait for the result.\n\n💰 Stake: ${stake} coins\n🎯 Your shot: ${guessDirection}`,
      ];
      const loadingMsg =
        footballLoadingMessages[
          Math.floor(Math.random() * footballLoadingMessages.length)
        ];
      if (inlineMessageId) {
        await bot.editMessageText(loadingMsg, {
          inline_message_id: inlineMessageId,
        });
      } else if (chatId && messageId) {
        await bot.editMessageText(loadingMsg, {
          chat_id: chatId,
          message_id: messageId,
        });
      }
      console.log(
        `[FOOTBALL] Play again exact: userId=${userId}, stake=${stake}, guess=${guess}`
      );

      try {
        // Check balance
        const hasBalance = await requireBalance(userId.toString(), stake);
        if (!hasBalance) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
          return;
        }

        // Create new game with same stake
        const gameState = await createFootballGame(userId.toString(), stake);

        // Set the same guess immediately
        await setFootballGuess(gameState.id, guess);

        // Send the football emoji
        console.log(`[FOOTBALL] Sending football emoji to chatId=${chatId}`);
        const footballMessage = await bot.sendDice(chatId, { emoji: "⚽️" });
        const footballResult = footballMessage.dice?.value;
        console.log(`[FOOTBALL] Football result: ${footballResult}`);

        if (!footballResult) {
          console.log(`[FOOTBALL] Failed to get football result from message`);
          throw new Error("Failed to get football result");
        }

        // Wait for football animation to finish (3 seconds)
        console.log(`[FOOTBALL] Waiting for football animation to finish...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Process the result
        console.log(
          `[FOOTBALL] Processing football result: gameId=${gameState.id}, footballResult=${footballResult}`
        );
        const result = await processFootballResult(
          gameState.id,
          footballResult
        );

        // Send result message with glass buttons
        const resultEmoji = result.won ? "🎉" : "😔";
        const guessDirection =
          FOOTBALL_DIRECTIONS[guess as keyof typeof FOOTBALL_DIRECTIONS];
        const resultDirection =
          FOOTBALL_DIRECTIONS[
            footballResult as keyof typeof FOOTBALL_DIRECTIONS
          ];
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

        // Always update the original message to the result (with glass buttons)
        if (inlineMessageId) {
          await bot.editMessageText(resultText, {
            inline_message_id: inlineMessageId,
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        } else if (chatId && messageId) {
          await bot.editMessageText(resultText, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        } else {
          // Fallback: send as a new message
          await bot.sendMessage(chatId, resultText, {
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        }

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(
          `[FOOTBALL] Play again exact: completed game ${gameState.id}`
        );
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to start new game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to start new game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // Handle new football game
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

      // Update the message
      const inlineMessageId = callbackQuery.inline_message_id;
      if (inlineMessageId) {
        await bot.editMessageText(text, {
          inline_message_id: inlineMessageId,
          reply_markup: stakeKeyboard,
        });
      } else if (chatId && callbackQuery.message?.message_id) {
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

    // --- Basketball Game Handlers ---

    // Handle basketball stake selection
    if (action === "basketball_stake" && parts[1]) {
      console.log(
        `[BASKETBALL] basketball_stake callback received: userId=${userId}, parts=`,
        parts
      );
      const stake = parseInt(parts[1]) as BasketballStake;
      console.log(`[BASKETBALL] Parsed stake: ${stake}`);

      if (!BASKETBALL_STAKES.includes(stake)) {
        console.log(`[BASKETBALL] Invalid stake amount: ${stake}`);
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Invalid stake amount",
          show_alert: true,
        });
        return;
      }

      try {
        console.log(
          `[BASKETBALL] Creating basketball game for userId=${userId}, stake=${stake}`
        );
        const gameState = await createBasketballGame(userId.toString(), stake);

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
        const text =
          `🏀 Hoop Shot Game - Stake: ${stake} Coins\n\nWill your shot score?\n\n` +
          `🎯 Win 2× your stake if you guess correctly!`;
        if (inlineMessageId) {
          await bot.editMessageText(text, {
            inline_message_id: inlineMessageId,
            reply_markup: guessKeyboard,
          });
        } else if (chatId && messageId) {
          await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: guessKeyboard,
          });
        }

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(
          `[BASKETBALL] Created game ${gameState.id} with stake ${stake} for user ${userId}`
        );
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to create basketball game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to create basketball game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // Handle basketball guess selection
    if (action === "basketball_guess" && parts[1] && parts[2]) {
      console.log(
        `[BASKETBALL] basketball_guess callback received: userId=${userId}, parts=`,
        parts
      );
      const gameId = parts[1];
      const guess = parts[2] as "score" | "miss";
      console.log(
        `[BASKETBALL] Processing guess: gameId=${gameId}, guess=${guess}`
      );

      // Set the guess and get game state (to get stake)
      const gameState = await setBasketballGuess(gameId, guess);
      const stake = gameState.stake;
      // --- Game Running Status ---
      const guessText = guess === "score" ? "🏀 Score" : "❌ Miss";
      const basketballLoadingMessages = [
        `⏳ Shooting the hoop...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
        `🔄 Aiming for the basket...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
        `🏀 Throwing the ball...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
        `⏳ Game is running... Please wait for the result.\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
      ];
      const loadingMsg =
        basketballLoadingMessages[
          Math.floor(Math.random() * basketballLoadingMessages.length)
        ];
      const inlineMessageId = callbackQuery.inline_message_id;
      const messageId = callbackQuery.message?.message_id;
      if (inlineMessageId) {
        await bot.editMessageText(loadingMsg, {
          inline_message_id: inlineMessageId,
        });
      } else if (chatId && messageId) {
        await bot.editMessageText(loadingMsg, {
          chat_id: chatId,
          message_id: messageId,
        });
      }

      try {
        // Set the guess and get game state
        console.log(`[BASKETBALL] Setting guess for game ${gameId}`);
        const gameState = await setBasketballGuess(gameId, guess);
        const stake = gameState.stake;

        // Send the basketball emoji
        console.log(
          `[BASKETBALL] Sending basketball emoji to chatId=${chatId}`
        );
        const basketballMessage = await bot.sendDice(chatId, { emoji: "🏀" });
        const basketballResult = basketballMessage.dice?.value;
        console.log(
          `[BASKETBALL] Basketball message received:`,
          JSON.stringify(basketballMessage, null, 2)
        );
        console.log(`[BASKETBALL] Basketball result: ${basketballResult}`);

        if (!basketballResult) {
          console.log(
            `[BASKETBALL] Failed to get basketball result from message`
          );
          throw new Error("Failed to get basketball result");
        }

        // Wait for basketball animation to finish (3 seconds)
        console.log(
          `[BASKETBALL] Waiting for basketball animation to finish...`
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Process the result
        console.log(
          `[BASKETBALL] Processing basketball result: gameId=${gameId}, basketballResult=${basketballResult}`
        );
        const result = await processBasketballResult(gameId, basketballResult);

        // Update the original message to remove buttons
        const inlineMessageId = callbackQuery.inline_message_id;
        if (inlineMessageId) {
          await bot.editMessageText(result.message, {
            inline_message_id: inlineMessageId,
            reply_markup: { inline_keyboard: [] },
          });
        } else if (chatId && messageId) {
          await bot.editMessageText(result.message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: { inline_keyboard: [] },
          });
        }

        // Send result message with play again buttons
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

        // Always update the original message to the result (with glass buttons)
        if (inlineMessageId) {
          await bot.editMessageText(finalResultText, {
            inline_message_id: inlineMessageId,
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        } else if (chatId && messageId) {
          await bot.editMessageText(finalResultText, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        } else {
          // Fallback: send as a new message
          await bot.sendMessage(chatId, finalResultText, {
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        }

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(
          `[BASKETBALL] Game ${gameId} completed: won=${result.won}, reward=${result.reward}`
        );
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to process basketball game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to process basketball game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // Handle play again with same stake
    if (action === "basketball_play_again_same" && parts[1]) {
      const stake = parseInt(parts[1]) as BasketballStake;
      console.log(
        `[BASKETBALL] Play again same stake: userId=${userId}, stake=${stake}`
      );

      try {
        // Check balance
        const hasBalance = await requireBalance(userId.toString(), stake);
        if (!hasBalance) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
          return;
        }

        // Create new game with same stake
        const gameState = await createBasketballGame(userId.toString(), stake);

        // Show guess options
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

        // Update the message
        const inlineMessageId = callbackQuery.inline_message_id;
        if (inlineMessageId) {
          await bot.editMessageText(text, {
            inline_message_id: inlineMessageId,
            reply_markup: guessKeyboard,
          });
        } else if (chatId && callbackQuery.message?.message_id) {
          await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: guessKeyboard,
          });
        }

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(
          `[BASKETBALL] Play again same stake: created game ${gameState.id}`
        );
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to start new game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to start new game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // Handle play again with same stake and same guess
    if (action === "basketball_play_again_exact" && parts[1] && parts[2]) {
      const stake = parseInt(parts[1]) as BasketballStake;
      const guess = parts[2] as "score" | "miss";
      const inlineMessageId = callbackQuery.inline_message_id;
      const messageId = callbackQuery.message?.message_id;
      // --- Game Running Status ---
      const guessText = guess === "score" ? "🏀 Score" : "❌ Miss";
      const basketballLoadingMessages = [
        `⏳ Shooting the hoop...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
        `🔄 Aiming for the basket...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
        `🏀 Throwing the ball...\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
        `⏳ Game is running... Please wait for the result.\n\n💰 Stake: ${stake} coins\n🎯 Your guess: ${guessText}`,
      ];
      const loadingMsg =
        basketballLoadingMessages[
          Math.floor(Math.random() * basketballLoadingMessages.length)
        ];
      if (inlineMessageId) {
        await bot.editMessageText(loadingMsg, {
          inline_message_id: inlineMessageId,
        });
      } else if (chatId && messageId) {
        await bot.editMessageText(loadingMsg, {
          chat_id: chatId,
          message_id: messageId,
        });
      }
      console.log(
        `[BASKETBALL] Play again exact: userId=${userId}, stake=${stake}, guess=${guess}`
      );

      try {
        // Check balance
        const hasBalance = await requireBalance(userId.toString(), stake);
        if (!hasBalance) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
          return;
        }

        // Create new game with same stake
        const gameState = await createBasketballGame(userId.toString(), stake);

        // Set the same guess immediately
        await setBasketballGuess(gameState.id, guess);

        // Send the basketball emoji
        console.log(
          `[BASKETBALL] Sending basketball emoji to chatId=${chatId}`
        );
        const basketballMessage = await bot.sendDice(chatId, { emoji: "🏀" });
        const basketballResult = basketballMessage.dice?.value;
        console.log(`[BASKETBALL] Basketball result: ${basketballResult}`);

        if (!basketballResult) {
          console.log(
            `[BASKETBALL] Failed to get basketball result from message`
          );
          throw new Error("Failed to get basketball result");
        }

        // Wait for basketball animation to finish (3 seconds)
        console.log(
          `[BASKETBALL] Waiting for basketball animation to finish...`
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Process the result
        console.log(
          `[BASKETBALL] Processing basketball result: gameId=${gameState.id}, basketballResult=${basketballResult}`
        );
        const result = await processBasketballResult(
          gameState.id,
          basketballResult
        );

        // Send result message with play again buttons
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

        // Always update the original message to the result (with glass buttons)
        if (inlineMessageId) {
          await bot.editMessageText(finalResultText, {
            inline_message_id: inlineMessageId,
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        } else if (chatId && messageId) {
          await bot.editMessageText(finalResultText, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        } else {
          // Fallback: send as a new message
          await bot.sendMessage(chatId, finalResultText, {
            parse_mode: "Markdown",
            reply_markup: playAgainKeyboard,
          });
        }

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(
          `[BASKETBALL] Play again exact: completed game ${gameState.id}`
        );
        return;
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else if (error instanceof Error) {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to start new game",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Failed to start new game",
            show_alert: true,
          });
        }
        return;
      }
    }

    // Handle new basketball game
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

      // Update the message
      const inlineMessageId = callbackQuery.inline_message_id;
      if (inlineMessageId) {
        await bot.editMessageText(text, {
          inline_message_id: inlineMessageId,
          reply_markup: stakeKeyboard,
        });
      } else if (chatId && callbackQuery.message?.message_id) {
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

  // Inline query handler (restored)
  bot.on("inline_query", async (inlineQuery: TelegramBot.InlineQuery) => {
    const query = inlineQuery.query;
    const userId = inlineQuery.from.id;

    // Handle "start GAMEID" format for joining existing games
    if (query.startsWith("start ") && !query.startsWith("start_game")) {
      const gameId = query.substring(6).trim();
      const gameState = getXoGame(gameId);

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

      const results: TelegramBot.InlineQueryResultArticle[] = [
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

    // Handle "start_game" format for creating new games
    if (query.startsWith("start_game")) {
      const results: TelegramBot.InlineQueryResultArticle[] = [
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

      // Optionally, send game options to user's private chat
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

    // Default inline query response - show "Start a new game" option
    const results: TelegramBot.InlineQueryResultArticle[] = [
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
