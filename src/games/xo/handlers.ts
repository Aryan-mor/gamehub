import { joinXoGame, createXoGame, getXoGame, formatXoBoard } from "./game";
import { makeXoMove, restartXoGame } from "./logic";
import { formatStatsMessage } from "../../bot/games/userStats";

/**
 * Registers all XO-specific Telegram bot handlers (move, join, restart, etc.).
 * @param bot - The TelegramBot instance
 * @param deps - Shared dependencies (game store, logger, etc.)
 */
export function registerXoTelegramHandlers(bot: any, deps: any) {
  // /newgame command
  bot.onText(/\/newgame/, async (msg: any) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) {
      await bot.sendMessage(chatId, "❌ Unable to identify user");
      return;
    }
    const { gameId, gameState } = createXoGame(
      userId.toString(),
      msg.from?.first_name || "Player"
    );
    const gameMessage = `🎮 X/O Game created!\n\nGame ID: \`${gameId}\`\n\nInvite your friend to join!`;
    const shareKeyboard = {
      inline_keyboard: [
        [
          {
            text: "📤 Invite to Game",
            switch_inline_query: `start ${gameId}`,
          },
        ],
      ],
    };
    await bot.sendMessage(chatId, gameMessage, {
      parse_mode: "Markdown",
      reply_markup: shareKeyboard,
    });
    console.log(`[XO] /newgame created game ${gameId} for user ${userId}`);
  });

  // /join command
  bot.onText(/\/join (.+)/, async (msg: any, match: any) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const gameId = match?.[1];
    if (!userId || !gameId) {
      await bot.sendMessage(
        chatId,
        "❌ Please provide a valid game ID: /join <gameId>"
      );
      return;
    }
    const gameState = joinXoGame(
      gameId,
      userId.toString(),
      msg.from?.first_name || "Player"
    );
    if (!gameState) {
      await bot.sendMessage(chatId, "❌ Game not found or already full.");
      return;
    }
    const boardMessage = formatXoBoard(gameState.board);
    await bot.sendMessage(chatId, `🎮 Joined game!\n\n${boardMessage}`);
    console.log(`[XO] /join: user ${userId} joined game ${gameId}`);
  });

  // Callback queries (move, join_game, restart_game, etc.)
  bot.on("callback_query", async (callbackQuery: any) => {
    const userId = callbackQuery.from?.id;
    const data = callbackQuery.data;
    let chatId = callbackQuery.message?.chat.id;
    if (!chatId && callbackQuery.inline_message_id) chatId = userId;
    if (!userId || !data) return;
    const parts = data.split(":");
    const action = parts[0];
    const gameId = parts[1];
    const position = parts[2];
    // --- Inline Start Game Handler ---
    if (action === "inline_start_game" && gameId) {
      if (gameId === "xo") {
        const { gameId: newGameId, gameState } = createXoGame(
          userId.toString(),
          callbackQuery.from?.first_name || "Player"
        );
        const gameMessage = `\n🎮 X/O Game\n\nClassic TicTacToe game for 2 players\n\nGame ID: \`${newGameId}\`\n\nWaiting for another player to join...\n`;
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
            parse_mode: "Markdown",
            reply_markup: shareKeyboard,
          });
        }
        await bot.answerCallbackQuery(callbackQuery.id);
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
      let statusMessage = "";
      if (gameState.winner) {
        statusMessage = `🎉 ${gameState.winner} wins!`;
        // Add winner stats and head-to-head record
        const winnerId =
          gameState.winner === "X"
            ? gameState.players.X?.id
            : gameState.players.O?.id;
        const loserId =
          gameState.winner === "X"
            ? gameState.players.O?.id
            : gameState.players.X?.id;
        const winnerName =
          gameState.winner === "X"
            ? gameState.players.X?.name
            : gameState.players.O?.name;
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
        statusMessage = `🤝 It's a draw!`;
      } else {
        statusMessage = `🎯 It's ${gameState.currentPlayer}'s turn`;
      }
      const fullMessage = `${boardMessage}\n\n${statusMessage}`;
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
              let text = cell === "-" ? "⬜" : cell === "X" ? "❌" : "🟢";
              let callbackData =
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
      const gameState = joinXoGame(
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
      const statusMessage = `🎯 It's ${gameState.currentPlayer}'s turn`;
      const fullMessage = `${boardMessage}\n\n${statusMessage}`;
      const keyboard = {
        inline_keyboard: Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 3 }, (_, col) => {
            const idx = row * 3 + col;
            const cell = gameState.board[idx];
            let text = cell === "-" ? "⬜" : cell === "X" ? "❌" : "🟢";
            let callbackData = cell === "-" ? `move:${gameId}:${idx}` : "noop";
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
    }
    // --- Restart Game Handler ---
    if (action === "restart_game" && gameId) {
      const newGameState = restartXoGame(gameId);
      if (!newGameState) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Game not found",
          show_alert: true,
        });
        return;
      }
      const boardMessage = formatXoBoard(newGameState.board);
      const statusMessage = `🎯 It's ${newGameState.currentPlayer}'s turn`;
      const fullMessage = `${boardMessage}\n\n${statusMessage}`;
      const keyboard = {
        inline_keyboard: Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 3 }, (_, col) => {
            const idx = row * 3 + col;
            const cell = newGameState.board[idx];
            let text = cell === "-" ? "⬜" : cell === "X" ? "❌" : "🟢";
            let callbackData = cell === "-" ? `move:${gameId}:${idx}` : "noop";
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
  });

  // Inline query handler (restored)
  bot.on("inline_query", async (inlineQuery: any) => {
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

    // Handle "start_game" format for creating new games
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
              { text: "Dots & Boxes", callback_data: "inline_start_game:dots" },
            ],
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
