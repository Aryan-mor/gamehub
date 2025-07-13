// Load environment variables
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import TelegramBot from "node-telegram-bot-api";
import { PlayerInfo, GameState, createInitialGameState } from "../lib/game";
import {
  createTicTacToeGame,
  joinTicTacToeGame,
  makeMove,
  restartTicTacToeGame,
  formatTicTacToeBoard,
  getTicTacToeStatusMessage,
  createTicTacToeKeyboard,
  getTicTacToeGame,
} from "./games/tictactoe";
import { getUserStatistics } from "./games/userStats";

// Initialize bot
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

const bot = new TelegramBot(token, { polling: true });

// Set bot commands
bot.setMyCommands([
  { command: "/start", description: "Start the bot" },
  { command: "/start_game", description: "Choose a game to play" },
  { command: "/newgame", description: "Create a new TicTacToe game" },
  { command: "/join", description: "Join a game with game ID" },
  { command: "/stats", description: "Show your X/O game statistics" },
  { command: "/help", description: "Show help information" },
]);

// In-memory game storage for testing
const games = new Map<string, GameState>();
const activeGames = new Map<
  string,
  {
    gameId: string;
    players: { X?: string; O?: string };
    lastMessageId?: number;
    originalChatId?: number;
  }
>();

// Start command
bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;

  // Debug: Log the received message
  console.log("Start command received:", msg.text);

  // Check if there's a start parameter for joining a game
  // Handle multiple formats: /start GAMEID, /startGAMEID, /start?start=GAMEID
  let gameId: string | null = null;

  if (msg.text) {
    // Try /start GAMEID format (with space)
    const matchWithSpace = msg.text.match(/\/start (.+)/);
    if (matchWithSpace) {
      gameId = matchWithSpace[1];
      console.log("Found gameId with space:", gameId);
    } else {
      // Try /startGAMEID format (without space) - most common for deep links
      const matchWithoutSpace = msg.text.match(/\/start(.+)/);
      if (matchWithoutSpace) {
        gameId = matchWithoutSpace[1];
        console.log("Found gameId without space:", gameId);
      } else {
        // Try /start?start=GAMEID format (query parameter)
        const matchWithQuery = msg.text.match(/\/start\?start=(.+)/);
        if (matchWithQuery) {
          gameId = matchWithQuery[1];
          console.log("Found gameId with query:", gameId);
        }
      }
    }
  }

  if (gameId) {
    console.log("Joining game with ID:", gameId);
    await handleJoinGameById(msg, gameId);
    return;
  }

  console.log("No gameId found, showing welcome message");

  const welcomeMessage = `
🎮 Welcome to GameHub TicTacToe Bot!

Commands:
/newgame - Create a new game
/join <gameId> - Join an existing game
/stats - Show your X/O game statistics
/help - Show this help message

Start by creating a new game with /newgame!
  `;

  await bot.sendMessage(chatId, welcomeMessage);
});

// Stats command
bot.onText(/\/stats/, async (msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!userId) {
    await bot.sendMessage(chatId, "❌ Unable to identify user");
    return;
  }

  const stats = getUserStatistics(userId.toString());
  const winRate =
    stats.totalGames > 0
      ? ((stats.totalWins / stats.totalGames) * 100).toFixed(1)
      : "0.0";

  const statsMessage = `
📊 *Your X/O Game Statistics*

🏆 Total Wins: ${stats.totalWins}
🎮 Total Games: ${stats.totalGames}
📈 Win Rate: ${winRate}%

${
  stats.totalWins > 0
    ? "🔥 Keep up the great work!"
    : "🎯 Start playing to build your stats!"
}
  `.trim();

  await bot.sendMessage(chatId, statsMessage, { parse_mode: "Markdown" });
});

// Head-to-head stats command
bot.onText(
  /\/h2h (.+)/,
  async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    if (!userId || !match) {
      await bot.sendMessage(chatId, "❌ Usage: /h2h <opponent_username>");
      return;
    }

    const stats = getUserStatistics(userId.toString());
    const h2hMessage = `
⚔️ *Head-to-Head Statistics*

🎯 Your Total Wins: ${stats.totalWins}
🎮 Your Total Games: ${stats.totalGames}

*Note: Full head-to-head tracking requires username-to-ID mapping*
  `.trim();

    await bot.sendMessage(chatId, h2hMessage, { parse_mode: "Markdown" });
  }
);

// New game command
bot.onText(/\/newgame/, async (msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!userId) {
    await bot.sendMessage(chatId, "❌ Unable to identify user");
    return;
  }

  try {
    const playerInfo: PlayerInfo = {
      id: userId.toString(),
      name: msg.from?.first_name || "Player",
      email: `${userId}@telegram.user`,
      disconnected: false,
      lastSeen: Date.now(),
    };

    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gameState: GameState = {
      ...createInitialGameState(),
      players: { X: playerInfo },
      status: "waiting",
    };

    games.set(gameId, gameState);
    activeGames.set(chatId.toString(), {
      gameId,
      players: { X: userId.toString() },
    });

    const gameMessage = `
Game created! 🎮

Invite your friend to join:
    `;

    // Create single inline button
    const shareKeyboard: TelegramBot.InlineKeyboardMarkup = {
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
      reply_markup: shareKeyboard,
    });
  } catch (error) {
    console.error("Error creating game:", error);
    await bot.sendMessage(
      chatId,
      "❌ Failed to create game. Please try again."
    );
  }
});

// Join game command
bot.onText(
  /\/join (.+)/,
  async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
    await handleJoinGame(msg, match);
  }
);

// Start game command (without parameters) - shows game selection menu
bot.onText(/^\/start_game$/, async (msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!userId) {
    await bot.sendMessage(chatId, "❌ Unable to identify user");
    return;
  }

  const gameOptionsMessage = "🕹️ Choose a game:";
  const gameOptionsKeyboard: TelegramBot.InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: "X/O Game",
          callback_data: "start_game:xo",
        },
        {
          text: "Dots & Boxes",
          callback_data: "start_game:dots",
        },
      ],
      [
        {
          text: "Memory Game",
          callback_data: "start_game:memory",
        },
      ],
    ],
  };

  await bot.sendMessage(chatId, gameOptionsMessage, {
    reply_markup: gameOptionsKeyboard,
  });
});

// Handle callback queries (button clicks)
bot.on("callback_query", async (callbackQuery: TelegramBot.CallbackQuery) => {
  console.log("=== CALLBACK QUERY RECEIVED ===");
  console.log("Callback ID:", callbackQuery.id);
  console.log("From User ID:", callbackQuery.from?.id);
  console.log("Chat ID:", callbackQuery.message?.chat.id);
  console.log("Message ID:", callbackQuery.message?.message_id);
  console.log("Callback Data:", callbackQuery.data);
  console.log("Chat Type:", callbackQuery.message?.chat.type);
  console.log("Inline Message ID:", callbackQuery.inline_message_id);
  console.log("Chat Instance:", callbackQuery.chat_instance);

  const userId = callbackQuery.from?.id;
  const data = callbackQuery.data;

  // For inline queries, we need to get the chat ID from the user ID
  // since inline queries don't have a message.chat.id
  let chatId = callbackQuery.message?.chat.id;

  if (!chatId) {
    console.log(
      "📝 No chat ID from message, checking if this is an inline query..."
    );
    if (callbackQuery.inline_message_id) {
      console.log("✅ This is an inline query callback");
      // For inline queries, we need to send messages to the user's private chat
      chatId = userId;
      console.log(`🔄 Using user ID as chat ID: ${chatId}`);
    } else {
      console.error(
        "❌ Missing chatId in callback query and not an inline query"
      );
      try {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Error: Missing chat information",
        });
      } catch (error) {
        console.error("Failed to answer callback query:", error);
      }
      return;
    }
  }

  // Validate required fields
  if (!userId) {
    console.error("❌ Missing userId in callback query");
    try {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Error: Missing user information",
      });
    } catch (error) {
      console.error("Failed to answer callback query:", error);
    }
    return;
  }

  if (!data) {
    console.error("❌ Missing callback data");
    try {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Error: Missing callback data",
      });
    } catch (error) {
      console.error("Failed to answer callback query:", error);
    }
    return;
  }

  console.log("✅ All required fields present, processing callback...");
  console.log(`📱 Final chat ID: ${chatId}, User ID: ${userId}`);

  try {
    const parts = data.split(":");
    const action = parts[0];
    const gameId = parts[1];
    const position = parts[2];

    console.log("Parsed callback data:");
    console.log("  Action:", action);
    console.log("  GameId:", gameId);
    console.log("  Position:", position);
    console.log("  Total parts:", parts.length);

    if (action === "move" && gameId && position) {
      const pos = parseInt(position);
      const gameState = getTicTacToeGame(gameId);

      if (!gameState) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Game not found",
        });
        return;
      }

      // Use modularized TicTacToe move function
      const moveResult = makeMove(gameId, userId.toString(), pos);

      if (!moveResult.success) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: moveResult.error || "Invalid move",
        });
        return;
      }

      if (!moveResult.gameState) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Game state error",
        });
        return;
      }

      // Game state is already updated by the makeMove function in the tictactoe module

      // For inline queries, we need to edit the inline message instead of sending new messages
      const inlineMessageId = callbackQuery.inline_message_id;

      if (inlineMessageId) {
        console.log(
          `📝 Editing inline message ${inlineMessageId} to update game board...`
        );

        // Format the game board and status using modularized functions
        const boardMessage = formatTicTacToeBoard(moveResult.gameState.board);
        const statusMessage = getTicTacToeStatusMessage(moveResult.gameState);
        const fullMessage = `${boardMessage}\n\n${statusMessage}`;

        // Create the game board keyboard - show restart buttons if game is over
        let keyboard;
        if (
          moveResult.gameState.winner ||
          moveResult.gameState.status === "draw"
        ) {
          // Game is over - show restart buttons
          keyboard = {
            inline_keyboard: [
              [
                {
                  text: "🔄 Play Again",
                  callback_data: `restart_game:${gameId}`,
                },
                {
                  text: "🎮 New Game",
                  callback_data: `new_game:${gameId}`,
                },
              ],
            ],
          };
          console.log(`🎯 Game over - showing restart buttons`);
        } else {
          // Game is still active - show game board
          keyboard = createTicTacToeKeyboard(moveResult.gameState, gameId);
        }

        try {
          await bot.editMessageText(fullMessage, {
            inline_message_id: inlineMessageId,
            parse_mode: "Markdown",
            reply_markup: keyboard,
          });
          console.log(`✅ Inline message updated with game board successfully`);
        } catch (editError) {
          console.error(
            "❌ Error editing inline message for game board:",
            editError
          );
          console.error("Edit error details:", {
            error:
              editError instanceof Error
                ? editError.message
                : String(editError),
            inlineMessageId,
          });
        }
      } else {
        // For regular messages, send separate game boards to each player
        console.log(`📝 Sending game boards to players...`);

        // Get both players' chat IDs
        const playerXId = moveResult.gameState.players.X?.id;
        const playerOId = moveResult.gameState.players.O?.id;

        // Send game board to player X
        if (playerXId) {
          await sendGameBoard(chatId, moveResult.gameState, gameId);
        }

        // Send game board to player O (if different chat)
        if (playerOId && playerOId !== playerXId) {
          // Note: In a real implementation, you'd need to track each player's chat ID
          // For now, we'll just update the current chat
          await sendGameBoard(chatId, moveResult.gameState, gameId);
        }
      }

      await bot.answerCallbackQuery(callbackQuery.id);
    } else if (action === "noop") {
      // Handle noop actions (clicked on occupied cell or not your turn)
      console.log("🔄 Processing noop callback - ignoring invalid move");
      // Don't show any message for noop actions, just answer the callback silently
      await bot.answerCallbackQuery(callbackQuery.id);
    } else if (action === "copy" && gameId) {
      // Copy game ID to clipboard (show as notification)
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: `Game ID copied: ${gameId}`,
        show_alert: true,
      });
    } else if (action === "join_game" && gameId) {
      console.log("🎮 Processing join_game callback");
      console.log("  Game ID:", gameId);
      console.log("  User ID:", userId);
      console.log("  Chat ID:", chatId);

      // Use modularized TicTacToe join function
      const updatedGameState = joinTicTacToeGame(
        gameId,
        userId.toString(),
        callbackQuery.from?.first_name || "Player"
      );

      if (!updatedGameState) {
        console.error(`❌ Failed to join game ${gameId}`);
        try {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Game not found or already full",
            show_alert: true,
          });
        } catch (error) {
          console.error(
            "Failed to answer callback query for missing game:",
            error
          );
        }
        return;
      }

      // Game state is already updated by the joinTicTacToeGame function in the tictactoe module

      // Get the original chat context where the game was created
      const activeGame = activeGames.get(updatedGameState.players.X?.id || "");
      const originalChatId = activeGame?.originalChatId || chatId;

      console.log(`📍 Original chat context: ${originalChatId}`);

      activeGames.set(chatId.toString(), {
        gameId,
        players: {
          X: updatedGameState.players.X?.id,
          O: updatedGameState.players.O?.id,
        },
        originalChatId: originalChatId,
      });

      // For inline queries, we need to edit the inline message instead of sending new messages
      const inlineMessageId = callbackQuery.inline_message_id;

      if (inlineMessageId) {
        console.log(
          `📝 Editing inline message ${inlineMessageId} to show game board...`
        );

        // Determine if it's the joining player's turn (joining player is O, but X starts first)
        const isJoiningPlayerTurn = updatedGameState.currentPlayer === "O";
        console.log(
          `🎯 Joining player turn: ${isJoiningPlayerTurn}, Current player: ${updatedGameState.currentPlayer}`
        );

        // Format the game board and status using modularized functions
        const boardMessage = formatTicTacToeBoard(updatedGameState.board);
        const statusMessage = getTicTacToeStatusMessage(updatedGameState);
        const fullMessage = `${boardMessage}\n\n${statusMessage}`;

        const keyboard = createTicTacToeKeyboard(updatedGameState, gameId);

        try {
          await bot.editMessageText(fullMessage, {
            inline_message_id: inlineMessageId,
            parse_mode: "Markdown",
            reply_markup: keyboard,
          });
          console.log(`✅ Inline message updated with game board successfully`);
        } catch (editError) {
          console.error(
            "❌ Error editing inline message for game board:",
            editError
          );
          console.error("Edit error details:", {
            error:
              editError instanceof Error
                ? editError.message
                : String(editError),
            inlineMessageId,
          });
        }
      } else {
        console.error("❌ No inline_message_id found for join_game");
        // Fallback: send to original chat (but this shouldn't happen for inline queries)
        console.log(
          `📤 Fallback: Sending game board to original chat ${originalChatId}`
        );
        // Send game board to both players
        await sendGameBoard(originalChatId, updatedGameState, gameId);

        // Send game board to the joining player's chat
        await sendGameBoard(chatId, updatedGameState, gameId);
      }

      try {
        await bot.answerCallbackQuery(callbackQuery.id);
        console.log("✅ Join game callback query answered successfully");
      } catch (error) {
        console.error("Failed to answer join game callback query:", error);
      }

      console.log("=== GAME JOINED SUCCESSFULLY IN ORIGINAL CHAT ===");
    } else if (action === "start_game" && gameId) {
      console.log("🎮 Processing start_game callback");
      console.log("  Game type:", gameId);
      console.log("  User ID:", userId);
      console.log("  Chat ID:", chatId);
      console.log("  Message ID:", callbackQuery.message?.message_id);

      // Handle game selection from inline query
      const gameType = gameId; // gameId parameter contains the game type (xo, dots, memory)

      let gameName = "";
      let gameDescription = "";

      switch (gameType) {
        case "xo":
          gameName = "X/O Game";
          gameDescription = "Classic TicTacToe game for 2 players";
          console.log("✅ Selected X/O Game");
          break;
        case "dots":
          gameName = "Dots & Boxes";
          gameDescription = "Connect dots to create boxes";
          console.log("✅ Selected Dots & Boxes");
          break;
        case "memory":
          gameName = "Memory Game";
          gameDescription = "Find matching pairs of cards";
          console.log("✅ Selected Memory Game");
          break;
        default:
          console.error(`❌ Invalid game type: ${gameType}`);
          try {
            await bot.answerCallbackQuery(callbackQuery.id, {
              text: "Invalid game type",
              show_alert: true,
            });
          } catch (error) {
            console.error(
              "Failed to answer callback query for invalid game type:",
              error
            );
          }
          return;
      }

      try {
        console.log("🔄 Starting game creation process...");

        // For now, only implement X/O game
        if (gameType === "xo") {
          console.log(
            `🎯 Creating X/O game for user ${userId} in chat ${chatId}`
          );

          // Use modularized TicTacToe game creation function
          const { gameId: newGameId, gameState } = createTicTacToeGame(
            userId.toString(),
            callbackQuery.from?.first_name || "Player"
          );

          console.log("✅ Game created with modularized function:", {
            gameId: newGameId,
            playerId: gameState.players.X?.id,
            playerName: gameState.players.X?.name,
          });

          // Update active games tracking
          activeGames.set(chatId.toString(), {
            gameId: newGameId,
            players: { X: userId.toString() },
          });

          console.log(`✅ Game ${newGameId} stored in memory`);

          const gameMessage = `
🎮 ${gameName} created!
Game ID: \`${newGameId}\`

${gameDescription}

Invite your friend to join:
          `;

          const shareKeyboard: TelegramBot.InlineKeyboardMarkup = {
            inline_keyboard: [
              [
                {
                  text: "🎮 Join Game",
                  callback_data: `join_game:${newGameId}`,
                },
              ],
            ],
          };

          // Get the message ID from the callback query
          const messageId = callbackQuery.message?.message_id;

          if (messageId) {
            console.log(`📝 Editing message ${messageId} in chat ${chatId}...`);
            console.log(
              `🔧 Using editMessageText with chat_id: ${chatId}, message_id: ${messageId}`
            );

            try {
              await bot.editMessageText(gameMessage, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: "Markdown",
                reply_markup: shareKeyboard,
              });
              console.log(`✅ Message edited successfully in chat ${chatId}`);
            } catch (editError) {
              console.error("❌ Error editing message:", editError);
              console.error("Edit error details:", {
                error:
                  editError instanceof Error
                    ? editError.message
                    : String(editError),
                chatId,
                messageId,
                gameMessage: gameMessage.substring(0, 100) + "...",
              });

              // Fallback to sending new message if edit fails
              console.log("🔄 Falling back to sending new message...");
              await bot.sendMessage(chatId, gameMessage, {
                parse_mode: "Markdown",
                reply_markup: shareKeyboard,
              });
              console.log(
                `✅ Fallback message sent successfully to chat ${chatId}`
              );
            }
          } else {
            console.error("❌ No message ID found in callback query");
            // Fallback to sending new message
            console.log("🔄 No message ID, sending new message...");
            await bot.sendMessage(chatId, gameMessage, {
              parse_mode: "Markdown",
              reply_markup: shareKeyboard,
            });
            console.log(
              `✅ Fallback message sent successfully to chat ${chatId}`
            );
          }
        } else {
          console.log(`📝 Sending 'coming soon' message for ${gameName}`);
          // For other game types, show "coming soon" message
          await bot.sendMessage(
            chatId,
            `🎮 ${gameName} is coming soon! For now, try the X/O Game.`
          );
          console.log(`✅ 'Coming soon' message sent for ${gameName}`);
        }

        console.log("🔄 Answering callback query...");
        // Always answer the callback query to stop the loading spinner
        await bot.answerCallbackQuery(callbackQuery.id);

        console.log(`✅ Callback query answered successfully for ${gameType}`);
        console.log("=== GAME CREATION COMPLETED SUCCESSFULLY ===");
      } catch (error) {
        console.error(`❌ Error creating game for type ${gameType}:`, error);
        console.error("Error details:", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          gameType,
          userId,
          chatId,
        });

        // Ensure callback query is answered even if there's an error
        try {
          console.log(
            "🔄 Attempting to answer callback query with error message..."
          );
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Error creating game. Please try again.",
            show_alert: true,
          });
          console.log("✅ Error callback query answered successfully");
        } catch (callbackError) {
          console.error("❌ Failed to answer callback query:", callbackError);
          console.error("Callback error details:", {
            error:
              callbackError instanceof Error
                ? callbackError.message
                : String(callbackError),
            stack:
              callbackError instanceof Error ? callbackError.stack : undefined,
          });
          // Don't re-throw this error as it's not critical
        }
      }
    } else if (action === "inline_start_game" && gameId) {
      console.log("🎮 Processing inline_start_game callback");
      console.log("  Game type:", gameId);
      console.log("  User ID:", userId);
      console.log("  Chat ID:", chatId);
      console.log("  Message ID:", callbackQuery.message?.message_id);
      console.log("  Inline Message ID:", callbackQuery.inline_message_id);

      // Handle inline game selection from any chat
      const gameType = gameId;

      let gameName = "";
      let gameDescription = "";

      switch (gameType) {
        case "xo":
          gameName = "X/O Game";
          gameDescription = "Classic TicTacToe game for 2 players";
          console.log("✅ Selected X/O Game (inline)");
          break;
        case "dots":
          gameName = "Dots & Boxes";
          gameDescription = "Connect dots to create boxes";
          console.log("✅ Selected Dots & Boxes (inline)");
          break;
        case "memory":
          gameName = "Memory Game";
          gameDescription = "Find matching pairs of cards";
          console.log("✅ Selected Memory Game (inline)");
          break;
        default:
          console.error(`❌ Invalid game type for inline: ${gameType}`);
          try {
            await bot.answerCallbackQuery(callbackQuery.id, {
              text: "Invalid game type",
              show_alert: true,
            });
          } catch (error) {
            console.error(
              "Failed to answer callback query for invalid inline game type:",
              error
            );
          }
          return;
      }

      try {
        console.log("🔄 Starting inline game creation process...");

        // For now, only implement X/O game
        if (gameType === "xo") {
          console.log(
            `🎯 Creating X/O game for user ${userId} in chat ${chatId} (inline)`
          );

          // Use modularized TicTacToe game creation function
          const { gameId: newGameId, gameState } = createTicTacToeGame(
            userId.toString(),
            callbackQuery.from?.first_name || "Player"
          );

          console.log("✅ Game created with modularized function (inline):", {
            gameId: newGameId,
            playerId: gameState.players.X?.id,
            playerName: gameState.players.X?.name,
          });

          // Store the original chat ID where the game was created
          const originalChatId = chatId;

          // Update active games tracking
          activeGames.set(chatId.toString(), {
            gameId: newGameId,
            players: { X: userId.toString() },
            originalChatId: originalChatId, // Store the original chat context
          });

          console.log(`✅ Game ${newGameId} stored in memory for inline game`);
          console.log(`📍 Original chat context: ${originalChatId}`);

          const gameMessage = `
🎮 ${gameName}

${gameDescription}

Game ID: \`${newGameId}\`

Waiting for another player to join...
          `;

          const shareKeyboard: TelegramBot.InlineKeyboardMarkup = {
            inline_keyboard: [
              [
                {
                  text: "✅ Join Game",
                  callback_data: `join_game:${newGameId}`,
                },
              ],
            ],
          };

          // For inline queries, we need to use inline_message_id instead of message_id
          const inlineMessageId = callbackQuery.inline_message_id;
          const messageId = callbackQuery.message?.message_id;

          if (inlineMessageId) {
            console.log(`📝 Editing inline message ${inlineMessageId}...`);
            console.log(
              `🔧 Using editMessageText with inline_message_id: ${inlineMessageId}`
            );

            try {
              await bot.editMessageText(gameMessage, {
                inline_message_id: inlineMessageId,
                parse_mode: "Markdown",
                reply_markup: shareKeyboard,
              });
              console.log(`✅ Inline message edited successfully`);
            } catch (editError) {
              console.error("❌ Error editing inline message:", editError);
              console.error("Edit error details:", {
                error:
                  editError instanceof Error
                    ? editError.message
                    : String(editError),
                inlineMessageId,
                gameMessage: gameMessage.substring(0, 100) + "...",
              });

              // For inline messages, we can't send a new message to the chat
              // The edit should work, but if it fails, we can only show an error
              console.log(
                "🔄 Inline message edit failed, showing error to user..."
              );
            }
          } else if (messageId) {
            console.log(
              `📝 Editing regular message ${messageId} in chat ${chatId}...`
            );
            console.log(
              `🔧 Using editMessageText with chat_id: ${chatId}, message_id: ${messageId}`
            );

            try {
              await bot.editMessageText(gameMessage, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: "Markdown",
                reply_markup: shareKeyboard,
              });
              console.log(`✅ Message edited successfully in chat ${chatId}`);
            } catch (editError) {
              console.error("❌ Error editing message:", editError);
              console.error("Edit error details:", {
                error:
                  editError instanceof Error
                    ? editError.message
                    : String(editError),
                chatId,
                messageId,
                gameMessage: gameMessage.substring(0, 100) + "...",
              });

              // Fallback to sending new message if edit fails
              console.log("🔄 Falling back to sending new message...");
              await bot.sendMessage(chatId, gameMessage, {
                parse_mode: "Markdown",
                reply_markup: shareKeyboard,
              });
              console.log(
                `✅ Fallback message sent successfully to chat ${chatId}`
              );
            }
          } else {
            console.error(
              "❌ No message ID or inline message ID found in callback query"
            );
            console.log("🔄 Cannot edit message, showing error to user...");
          }
        } else {
          console.log(
            `📝 Sending 'coming soon' message for ${gameName} (inline)`
          );
          // For other game types, show "coming soon" message
          await bot.sendMessage(
            chatId,
            `🎮 ${gameName} is coming soon! For now, try the X/O Game.`
          );
          console.log(`✅ 'Coming soon' message sent for ${gameName} (inline)`);
        }

        console.log("🔄 Answering inline callback query...");
        try {
          await bot.answerCallbackQuery(callbackQuery.id);
          console.log("✅ Inline callback query answered successfully");
        } catch (callbackError) {
          console.error(
            "❌ Failed to answer inline callback query:",
            callbackError
          );
          console.error("Inline callback error details:", {
            error:
              callbackError instanceof Error
                ? callbackError.message
                : String(callbackError),
            stack:
              callbackError instanceof Error ? callbackError.stack : undefined,
          });
        }

        console.log("=== INLINE GAME CREATION COMPLETED SUCCESSFULLY ===");
      } catch (error) {
        console.error(
          `❌ Error creating inline game for type ${gameType}:`,
          error
        );
        console.error("Inline game error details:", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          gameType,
          userId,
          chatId,
        });

        // Ensure callback query is answered even if there's an error
        try {
          console.log(
            "🔄 Attempting to answer inline callback query with error message..."
          );
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Error creating game. Please try again.",
            show_alert: true,
          });
          console.log("✅ Error inline callback query answered successfully");
        } catch (callbackError) {
          console.error(
            "❌ Failed to answer inline callback query:",
            callbackError
          );
          console.error("Inline callback error details:", {
            error:
              callbackError instanceof Error
                ? callbackError.message
                : String(callbackError),
            stack:
              callbackError instanceof Error ? callbackError.stack : undefined,
          });
        }
      }
    } else if (action === "restart_game" && gameId) {
      console.log("🎮 Processing restart_game callback");
      console.log("  Game ID:", gameId);
      console.log("  User ID:", userId);
      console.log("  Chat ID:", chatId);

      // Use modularized TicTacToe restart function
      const newGameState = restartTicTacToeGame(gameId);

      if (!newGameState) {
        console.error(`❌ Game ${gameId} not found for restart`);
        try {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Game not found",
            show_alert: true,
          });
        } catch (error) {
          console.error(
            "Failed to answer callback query for missing game:",
            error
          );
        }
        return;
      }

      // Game state is already updated by the restartTicTacToeGame function in the tictactoe module

      // For inline queries, we need to edit the inline message
      const inlineMessageId = callbackQuery.inline_message_id;

      if (inlineMessageId) {
        console.log(
          `📝 Editing inline message ${inlineMessageId} for restart...`
        );

        // Format the game board and status using modularized functions
        const boardMessage = formatTicTacToeBoard(newGameState.board);
        const statusMessage = getTicTacToeStatusMessage(newGameState); // New game, both players can click
        const fullMessage = `${boardMessage}\n\n${statusMessage}`;

        const keyboard = createTicTacToeKeyboard(newGameState, gameId);

        try {
          await bot.editMessageText(fullMessage, {
            inline_message_id: inlineMessageId,
            parse_mode: "Markdown",
            reply_markup: keyboard,
          });
          console.log(`✅ Inline message updated for restart successfully`);
        } catch (editError) {
          console.error(
            "❌ Error editing inline message for restart:",
            editError
          );
          console.error("Edit error details:", {
            error:
              editError instanceof Error
                ? editError.message
                : String(editError),
            inlineMessageId,
          });
        }
      } else {
        console.error("❌ No inline_message_id found for restart_game");
      }

      try {
        await bot.answerCallbackQuery(callbackQuery.id);
        console.log("✅ Restart game callback query answered successfully");
      } catch (error) {
        console.error("Failed to answer restart game callback query:", error);
      }

      console.log("=== GAME RESTARTED SUCCESSFULLY ===");
    } else if (action === "new_game" && gameId) {
      console.log("🎮 Processing new_game callback");
      console.log("  Game ID:", gameId);
      console.log("  User ID:", userId);
      console.log("  Chat ID:", chatId);

      // Handle new game - reset to game selection menu
      const gameState = getTicTacToeGame(gameId);

      if (!gameState) {
        console.error(`❌ Game ${gameId} not found for new game`);
        try {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Game not found",
            show_alert: true,
          });
        } catch (error) {
          console.error(
            "Failed to answer callback query for missing game:",
            error
          );
        }
        return;
      }

      // Check if user is part of the game
      const isPlayerX = gameState.players.X?.id === userId.toString();
      const isPlayerO = gameState.players.O?.id === userId.toString();

      if (!isPlayerX && !isPlayerO) {
        console.error(`❌ User ${userId} is not part of game ${gameId}`);
        try {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "You are not part of this game",
            show_alert: true,
          });
        } catch (error) {
          console.error(
            "Failed to answer callback query for non-player:",
            error
          );
        }
        return;
      }

      console.log(`🔄 Resetting to game selection menu for new game`);

      // Remove the old game from memory
      games.delete(gameId);

      // For inline queries, we need to edit the inline message
      const inlineMessageId = callbackQuery.inline_message_id;

      if (inlineMessageId) {
        console.log(
          `📝 Editing inline message ${inlineMessageId} to show game selection...`
        );

        const gameSelectionMessage = `
🎮 Choose a game to play:

Select what you want to play with your friend:
        `;

        const gameSelectionKeyboard: TelegramBot.InlineKeyboardMarkup = {
          inline_keyboard: [
            [
              {
                text: "X/O Game",
                callback_data: "inline_start_game:xo",
              },
              {
                text: "Dots & Boxes",
                callback_data: "inline_start_game:dots",
              },
            ],
            [
              {
                text: "Memory Game",
                callback_data: "inline_start_game:memory",
              },
            ],
          ],
        };

        try {
          await bot.editMessageText(gameSelectionMessage, {
            inline_message_id: inlineMessageId,
            parse_mode: "Markdown",
            reply_markup: gameSelectionKeyboard,
          });
          console.log(
            `✅ Inline message updated to game selection successfully`
          );
        } catch (editError) {
          console.error(
            "❌ Error editing inline message for game selection:",
            editError
          );
          console.error("Edit error details:", {
            error:
              editError instanceof Error
                ? editError.message
                : String(editError),
            inlineMessageId,
          });
        }
      } else {
        console.error("❌ No inline_message_id found for new_game");
      }

      try {
        await bot.answerCallbackQuery(callbackQuery.id);
        console.log("✅ New game callback query answered successfully");
      } catch (error) {
        console.error("Failed to answer new game callback query:", error);
      }

      console.log("=== GAME SELECTION MENU SHOWN SUCCESSFULLY ===");
    }
  } catch (error) {
    console.error("❌ Error handling callback query:", error);
    console.error("Main error details:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      callbackId: callbackQuery.id,
      userId: callbackQuery.from?.id,
      chatId: callbackQuery.message?.chat.id,
      data: callbackQuery.data,
    });

    // Only try to answer the callback query if it's still valid
    try {
      console.log(
        "🔄 Attempting to answer callback query with error message..."
      );
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Error processing request",
      });
      console.log("✅ Error callback query answered successfully");
    } catch (callbackError) {
      console.error("❌ Failed to answer callback query:", callbackError);
      console.error("Callback error details:", {
        error:
          callbackError instanceof Error
            ? callbackError.message
            : String(callbackError),
        stack: callbackError instanceof Error ? callbackError.stack : undefined,
      });
      // Don't re-throw this error as it's not critical
    }
  }
});

// Handle inline queries for sharing games and starting new games
bot.on("inline_query", async (inlineQuery: TelegramBot.InlineQuery) => {
  const query = inlineQuery.query;
  const userId = inlineQuery.from.id;

  // Handle "start GAMEID" format for joining existing games
  if (query.startsWith("start ") && !query.startsWith("start_game")) {
    const gameId = query.substring(6).trim();
    const gameState = getTicTacToeGame(gameId);

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

    const results: TelegramBot.InlineQueryResult[] = [
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
    const results: TelegramBot.InlineQueryResult[] = [
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

    // Send game options to user's private chat
    const gameOptionsMessage = "🕹️ Choose a game:";
    const gameOptionsKeyboard: TelegramBot.InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          {
            text: "X/O Game",
            callback_data: "start_game:xo",
          },
        ],
        [
          {
            text: "Dots & Boxes",
            callback_data: "start_game:dots",
          },
        ],
        [
          {
            text: "Memory Game",
            callback_data: "start_game:memory",
          },
        ],
      ],
    };

    await bot.sendMessage(userId, gameOptionsMessage, {
      reply_markup: gameOptionsKeyboard,
    });
    return;
  }

  // Default inline query response - show "Start a new game" option
  const results: TelegramBot.InlineQueryResult[] = [
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
            {
              text: "X/O Game",
              callback_data: "inline_start_game:xo",
            },
            {
              text: "Dots & Boxes",
              callback_data: "inline_start_game:dots",
            },
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

// Extract join game logic to a separate function
async function handleJoinGame(
  msg: TelegramBot.Message,
  match: RegExpExecArray | null
) {
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

  await handleJoinGameById(msg, gameId);
}

// Handle joining game by gameId directly (for deep links)
async function handleJoinGameById(msg: TelegramBot.Message, gameId: string) {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  console.log(`Attempting to join game ${gameId} for user ${userId}`);

  if (!userId) {
    console.log("No userId found");
    await bot.sendMessage(chatId, "❌ Unable to identify user");
    return;
  }

  try {
    const gameState = getTicTacToeGame(gameId);
    if (!gameState) {
      console.log(`Game ${gameId} not found in games map`);
      await bot.sendMessage(chatId, "❌ Game not found. Check the game ID.");
      return;
    }

    console.log(`Game ${gameId} found, current players:`, {
      X: gameState.players.X?.id,
      O: gameState.players.O?.id,
      status: gameState.status,
    });

    // Check if user is already in the game (as X)
    if (gameState.players.X?.id === userId.toString()) {
      console.log(`User ${userId} is the creator of game ${gameId}`);
      await bot.sendMessage(
        chatId,
        "❌ You created this game! You cannot join your own game. Wait for another player to join."
      );
      return;
    }

    if (gameState.players.O) {
      console.log(`Game ${gameId} is full`);
      await bot.sendMessage(chatId, "❌ Game is full.");
      return;
    }

    const playerInfo: PlayerInfo = {
      id: userId.toString(),
      name: msg.from?.first_name || "Player",
      email: `${userId}@telegram.user`,
      disconnected: false,
      lastSeen: Date.now(),
    };

    console.log(`Adding player ${userId} as O to game ${gameId}`);
    gameState.players.O = playerInfo;
    gameState.status = "playing";
    gameState.currentPlayer = "X";
    gameState.turnStartedAt = Date.now();

    games.set(gameId, gameState);
    activeGames.set(chatId.toString(), {
      gameId,
      players: { X: gameState.players.X?.id, O: gameState.players.O?.id },
    });

    console.log(`Sending game board to joining player ${userId}`);

    // Get the original chat context where the game was created
    const activeGame = activeGames.get(gameState.players.X?.id || "");
    const originalChatId = activeGame?.originalChatId || chatId;

    console.log(`📍 Original chat context: ${originalChatId}`);

    // Send game board to the original chat where the game was created
    await sendGameBoard(originalChatId, gameState, gameId);

    // Send game board to the joining player's chat
    await sendGameBoard(chatId, gameState, gameId);

    // Send notification to the original chat that someone joined
    const joinNotification = `🎮 ${msg.from?.first_name} joined the game! Game started!`;
    console.log(
      `📢 Sending join notification to original chat ${originalChatId}`
    );
    await bot.sendMessage(originalChatId, joinNotification);

    console.log(`Successfully joined game ${gameId}`);
  } catch (error) {
    console.error("Error joining game:", error);
    await bot.sendMessage(
      chatId,
      "❌ Failed to join game. Check the game ID and try again."
    );
  }
}

// Help command
bot.onText(/\/help/, async (msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  const helpMessage = `
🎮 GameHub TicTacToe Bot Help

Commands:
• /start - Start the bot
• /newgame - Create a new game
• /join <gameId> - Join an existing game
• /help - Show this help

How to play:
1. Create a game with /newgame
2. Share the game ID with a friend
3. Friend joins with /join <gameId>
4. Use the buttons below the board to make moves

The game will automatically update for both players!
  `;

  await bot.sendMessage(chatId, helpMessage);
});

// Helper functions - now using modularized TicTacToe functions

async function sendGameBoard(chatId: number, game: GameState, gameId: string) {
  const boardMessage = formatTicTacToeBoard(game.board);
  const statusMessage = getTicTacToeStatusMessage(game);
  const fullMessage = `${boardMessage}\n\n${statusMessage}`;

  const keyboard = createTicTacToeKeyboard(game, gameId);

  const sentMessage = await bot.sendMessage(chatId, fullMessage, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });

  // Store message ID for updates
  const activeGame = activeGames.get(chatId.toString());
  if (activeGame) {
    activeGame.lastMessageId = sentMessage.message_id;
  }
}

console.log("🤖 Telegram bot is running...");
