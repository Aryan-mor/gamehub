// Load environment variables
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// @ts-expect-error - node-telegram-bot-api types issue
import TelegramBot from "node-telegram-bot-api";
import {
  PlayerInfo,
  GameState,
  createInitialGameState,
  checkWinner,
  isDraw,
  getNextPlayer,
} from "../lib/game";

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
/help - Show this help message

Start by creating a new game with /newgame!
  `;

  await bot.sendMessage(chatId, welcomeMessage);
});

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
      const gameState = games.get(gameId);

      if (!gameState) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Game not found",
        });
        return;
      }

      // Check if it's the player's turn
      const currentPlayerInfo = gameState.players[gameState.currentPlayer];
      if (!currentPlayerInfo || currentPlayerInfo.id !== userId.toString()) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Not your turn",
        });
        return;
      }

      // Check if cell is empty
      if (gameState.board[pos] !== "-") {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Cell already occupied",
        });
        return;
      }

      // Make the move
      gameState.board[pos] = gameState.currentPlayer;
      gameState.lastMoveAt = Date.now();

      // Check for winner
      const winner = checkWinner(gameState.board);
      if (winner) {
        gameState.status = "won";
        gameState.winner = winner;
      } else if (isDraw(gameState.board)) {
        gameState.status = "draw";
      } else {
        gameState.currentPlayer = getNextPlayer(gameState.currentPlayer);
        gameState.turnStartedAt = Date.now();
      }

      games.set(gameId, gameState);

      // For inline queries, we need to edit the inline message instead of sending new messages
      const inlineMessageId = callbackQuery.inline_message_id;

      if (inlineMessageId) {
        console.log(
          `📝 Editing inline message ${inlineMessageId} to update game board...`
        );

        // Format the game board and status
        const boardMessage = formatBoard(gameState.board);
        const statusMessage = getGameStatusMessage(gameState, false);
        const fullMessage = `${boardMessage}\n\n${statusMessage}`;

        // Create the game board keyboard
        const keyboard = createBoardKeyboard(gameState, gameId, false);

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
        // Fallback for regular messages (not inline)
        console.log(`📝 Updating regular message for game board...`);
        await updateGameMessage(
          chatId,
          callbackQuery.message?.message_id,
          gameState,
          gameId
        );

        // Get the original chat context where the game was created
        const activeGame = activeGames.get(chatId.toString());
        const originalChatId = activeGame?.originalChatId || chatId;

        console.log(
          `📍 Updating game in original chat context: ${originalChatId}`
        );

        // Update the game board in the original chat
        await updateGameMessage(
          originalChatId,
          activeGame?.lastMessageId,
          gameState,
          gameId
        );
      }

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

      // Handle join game from shared message
      const gameState = games.get(gameId);

      if (!gameState) {
        console.error(`❌ Game ${gameId} not found`);
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

      if (gameState.players.O) {
        console.error(`❌ Game ${gameId} is full`);
        try {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Game is full",
            show_alert: true,
          });
        } catch (error) {
          console.error(
            "Failed to answer callback query for full game:",
            error
          );
        }
        return;
      }

      // Check if user is already in the game
      if (gameState.players.X?.id === userId.toString()) {
        console.log(`✅ User ${userId} is the creator of game ${gameId}`);
        try {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "You created this game!",
            show_alert: true,
          });
        } catch (error) {
          console.error("Failed to answer callback query for creator:", error);
        }
        return;
      }

      console.log(`🔄 Adding player ${userId} as O to game ${gameId}`);

      // Join the game
      const playerInfo: PlayerInfo = {
        id: userId.toString(),
        name: callbackQuery.from?.first_name || "Player",
        email: `${userId}@telegram.user`,
        disconnected: false,
        lastSeen: Date.now(),
      };

      gameState.players.O = playerInfo;
      gameState.status = "playing";
      gameState.currentPlayer = "X";
      gameState.turnStartedAt = Date.now();

      games.set(gameId, gameState);

      // Get the original chat context where the game was created
      const activeGame = activeGames.get(gameState.players.X?.id || "");
      const originalChatId = activeGame?.originalChatId || chatId;

      console.log(`📍 Original chat context: ${originalChatId}`);

      activeGames.set(chatId.toString(), {
        gameId,
        players: { X: gameState.players.X?.id, O: gameState.players.O?.id },
        originalChatId: originalChatId,
      });

      // For inline queries, we need to edit the inline message instead of sending new messages
      const inlineMessageId = callbackQuery.inline_message_id;

      if (inlineMessageId) {
        console.log(
          `📝 Editing inline message ${inlineMessageId} to show game board...`
        );

        // Format the game board and status
        const boardMessage = formatBoard(gameState.board);
        const statusMessage = getGameStatusMessage(gameState, false);
        const fullMessage = `${boardMessage}\n\n${statusMessage}`;

        // Create the game board keyboard
        const keyboard = createBoardKeyboard(gameState, gameId, false);

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
        await sendGameBoard(originalChatId, gameState, gameId, false);
      }

      try {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Successfully joined the game!",
          show_alert: true,
        });
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

          // Create a new X/O game
          const playerInfo: PlayerInfo = {
            id: userId.toString(),
            name: callbackQuery.from?.first_name || "Player",
            email: `${userId}@telegram.user`,
            disconnected: false,
            lastSeen: Date.now(),
          };

          console.log("✅ Player info created:", {
            id: playerInfo.id,
            name: playerInfo.name,
            email: playerInfo.email,
          });

          const newGameId = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

          console.log("🎲 Generated game ID:", newGameId);

          const gameState: GameState = {
            ...createInitialGameState(),
            players: { X: playerInfo },
            status: "waiting",
          };

          console.log("✅ Game state created successfully");

          games.set(newGameId, gameState);
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
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: `${gameName} created!`,
          show_alert: true,
        });

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

          // Create a new X/O game
          const playerInfo: PlayerInfo = {
            id: userId.toString(),
            name: callbackQuery.from?.first_name || "Player",
            email: `${userId}@telegram.user`,
            disconnected: false,
            lastSeen: Date.now(),
          };

          console.log("✅ Player info created for inline game:", {
            id: playerInfo.id,
            name: playerInfo.name,
            email: playerInfo.email,
          });

          const newGameId = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

          console.log("🎲 Generated game ID for inline game:", newGameId);

          const gameState: GameState = {
            ...createInitialGameState(),
            players: { X: playerInfo },
            status: "waiting",
          };

          console.log("✅ Game state created successfully for inline game");

          // Store the original chat ID where the game was created
          const originalChatId = chatId;

          games.set(newGameId, gameState);
          activeGames.set(chatId.toString(), {
            gameId: newGameId,
            players: { X: userId.toString() },
            originalChatId: originalChatId, // Store the original chat context
          });

          console.log(`✅ Game ${newGameId} stored in memory for inline game`);
          console.log(`📍 Original chat context: ${originalChatId}`);

          const gameMessage = `
🎮 ${gameName} created by ${callbackQuery.from?.first_name || "Player"}!

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
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: `${gameName} created!`,
            show_alert: true,
          });
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
    const gameState = games.get(gameId);

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
    const gameState = games.get(gameId);
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

    if (gameState.players.O) {
      console.log(`Game ${gameId} is full`);
      await bot.sendMessage(chatId, "❌ Game is full.");
      return;
    }

    // Check if user is already in the game
    if (gameState.players.X?.id === userId.toString()) {
      console.log(`User ${userId} is the creator of game ${gameId}`);
      await bot.sendMessage(
        chatId,
        "🎮 You created this game! Waiting for opponent to join..."
      );
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
    await sendGameBoard(originalChatId, gameState, gameId, false);

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

// Helper functions
function createBoardKeyboard(
  game: GameState,
  gameId: string,
  isMyTurn: boolean
): TelegramBot.InlineKeyboardMarkup {
  const keyboard: TelegramBot.InlineKeyboardButton[][] = [];
  let row: TelegramBot.InlineKeyboardButton[] = [];

  for (let i = 0; i < 9; i++) {
    const cell = game.board[i];
    let text = "⬜";
    let callbackData = `move:${gameId}:${i}`;

    if (cell === "X") {
      text = "❌";
      callbackData = "noop";
    } else if (cell === "O") {
      text = "⭕";
      callbackData = "noop";
    }

    // Disable buttons if not player's turn or game is over
    if (!isMyTurn || game.winner || game.status === "draw") {
      callbackData = "noop";
    }

    row.push({
      text,
      callback_data: callbackData,
    });

    if (row.length === 3) {
      keyboard.push(row);
      row = [];
    }
  }

  return { inline_keyboard: keyboard };
}

function formatBoard(board: string[]): string {
  const symbols = board.map((cell) =>
    cell === "-" ? "⬜" : cell === "X" ? "❌" : "⭕"
  );

  return `
${symbols[0]} | ${symbols[1]} | ${symbols[2]}
---------
${symbols[3]} | ${symbols[4]} | ${symbols[5]}
---------
${symbols[6]} | ${symbols[7]} | ${symbols[8]}
  `.trim();
}

function getGameStatusMessage(game: GameState, isMyTurn: boolean): string {
  if (game.winner) {
    const winnerName =
      game.winner === "X" ? game.players.X?.name : game.players.O?.name;
    return `🎉 ${winnerName || "Unknown"} wins!`;
  }

  if (game.status === "draw") {
    return `🤝 It's a draw!`;
  }

  const currentPlayerName =
    game.currentPlayer === "X" ? game.players.X?.name : game.players.O?.name;

  if (isMyTurn) {
    return `🎯 It's your turn!`;
  } else {
    return `⏳ Waiting for ${currentPlayerName || "opponent"} to move...`;
  }
}

async function sendGameBoard(
  chatId: number,
  game: GameState,
  gameId: string,
  isMyTurn: boolean
) {
  const boardMessage = formatBoard(game.board);
  const statusMessage = getGameStatusMessage(game, isMyTurn);
  const fullMessage = `${boardMessage}\n\n${statusMessage}`;

  const keyboard = createBoardKeyboard(game, gameId, isMyTurn);

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

async function updateGameMessage(
  chatId: number,
  messageId: number | undefined,
  game: GameState,
  gameId: string
) {
  if (!messageId) return;

  const boardMessage = formatBoard(game.board);
  const statusMessage = getGameStatusMessage(game, false);
  const fullMessage = `${boardMessage}\n\n${statusMessage}`;

  const keyboard = createBoardKeyboard(game, gameId, false);

  try {
    await bot.editMessageText(fullMessage, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error("Error updating message:", error);
  }
}

console.log("🤖 Telegram bot is running...");
