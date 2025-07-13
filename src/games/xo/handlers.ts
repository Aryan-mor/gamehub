import {
  joinXoGame,
  createXoGame,
  getXoGame,
  formatXoBoard,
  VALID_STAKES,
} from "./game";
import { makeXoMove, restartXoGame } from "./logic";
import { formatStatsMessage } from "../../bot/games/userStats";
import { requireBalance } from "../../lib/coinService";
import {
  createDiceGame,
  setDiceGuess,
  processDiceResult,
  DICE_STAKES,
  type DiceStake,
} from "../../bot/games/dice";

/**
 * Registers all XO-specific Telegram bot handlers (move, join, restart, etc.).
 * @param bot - The TelegramBot instance
 * @param deps - Shared dependencies (game store, logger, etc.)
 */
export function registerXoTelegramHandlers(bot: any) {
  // /newgame command - now prompts for stake selection
  bot.onText(/\/newgame/, async (msg: any) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) {
      await bot.sendMessage(chatId, "❌ Unable to identify user");
      return;
    }

    const stakeKeyboard = {
      inline_keyboard: [
        [
          { text: "5 Coins", callback_data: `create_stake:5` },
          { text: "10 Coins", callback_data: `create_stake:10` },
        ],
        [{ text: "20 Coins", callback_data: `create_stake:20` }],
      ],
    };

    await bot.sendMessage(chatId, "🎮 X/O Game\n\nChoose stake amount:", {
      reply_markup: stakeKeyboard,
    });
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
    } catch (error: any) {
      if (error.message === "Insufficient coins") {
        await bot.sendMessage(chatId, "❌ Insufficient Coins.");
      } else {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
      }
    }
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

        await bot.editMessageText(gameMessage, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          reply_markup: shareKeyboard,
        });

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(
          `[XO] create_stake: created game ${newGameId} with stake ${stake} for user ${userId}`
        );
        return;
      } catch (error: any) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: error.message || "Failed to create game",
          show_alert: true,
        });
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
      } catch (error: any) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: error.message || "Failed to create game",
          show_alert: true,
        });
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
              let text = cell === "-" ? "⬜" : cell === "X" ? "❌" : "🟢";
              let callbackData =
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
      } catch (error: any) {
        if (error.message === "Insufficient coins") {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "Insufficient Coins.",
            show_alert: true,
          });
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: error.message || "Failed to join game",
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
              let text = cell === "-" ? "⬜" : cell === "X" ? "❌" : "🟢";
              let callbackData =
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
      } catch (error: any) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: error.message || "Failed to restart game",
          show_alert: true,
        });
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
            // Exact values row 1
            [
              { text: "1", callback_data: `dice_guess:${gameState.id}:1` },
              { text: "2", callback_data: `dice_guess:${gameState.id}:2` },
              { text: "3", callback_data: `dice_guess:${gameState.id}:3` },
            ],
            // Exact values row 2
            [
              { text: "4", callback_data: `dice_guess:${gameState.id}:4` },
              { text: "5", callback_data: `dice_guess:${gameState.id}:5` },
              { text: "6", callback_data: `dice_guess:${gameState.id}:6` },
            ],
            // Ranges row 1
            [
              { text: "ODD", callback_data: `dice_guess:${gameState.id}:ODD` },
              {
                text: "EVEN",
                callback_data: `dice_guess:${gameState.id}:EVEN`,
              },
            ],
            // Ranges row 2
            [
              { text: "1-3", callback_data: `dice_guess:${gameState.id}:1-3` },
              { text: "4-6", callback_data: `dice_guess:${gameState.id}:4-6` },
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
      } catch (error: any) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: error.message || "Failed to create dice game",
          show_alert: true,
        });
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

        // Update the original message to remove buttons
        const resultChatId = callbackQuery.message?.chat.id;
        const messageId = callbackQuery.message?.message_id;
        const inlineMessageId = callbackQuery.inline_message_id;
        if (inlineMessageId) {
          await bot.editMessageText(result.message, {
            inline_message_id: inlineMessageId,
            reply_markup: { inline_keyboard: [] },
          });
        } else if (resultChatId && messageId) {
          await bot.editMessageText(result.message, {
            chat_id: resultChatId,
            message_id: messageId,
            reply_markup: { inline_keyboard: [] },
          });
        }

        // Send result message with glass buttons
        const resultEmoji = result.won ? "🎉" : "😔";
        const resultText = result.won
          ? `${resultEmoji} **Congratulations! You won ${result.reward} coins!**\n\n🎯 Your guess: ${guess}\n🎲 Dice: ${diceResult}\n💰 Reward: ${result.reward} coins`
          : `${resultEmoji} **Better luck next time!**\n\n🎯 Your guess: ${guess}\n🎲 Dice: ${diceResult}\n💸 You lost ${stake} coins`;

        const playAgainKeyboard = {
          inline_keyboard: [
            [
              {
                text: "🔄 Play Again (Same Stake)",
                callback_data: `dice_play_again_same:${stake}`,
              },
            ],
            [
              {
                text: "🎯 Play Again (Same Stake & Guess)",
                callback_data: `dice_play_again_exact:${stake}:${guess}`,
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

        await bot.sendMessage(chatId, resultText, {
          parse_mode: "Markdown",
          reply_markup: playAgainKeyboard,
        });

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(
          `[DICE] Game ${gameId} completed: won=${result.won}, reward=${result.reward}`
        );
        return;
      } catch (error: any) {
        console.error(`[DICE] Error processing dice guess:`, error);
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: error.message || "Failed to process dice game",
          show_alert: true,
        });
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
        const gameState = await createDiceGame(userId.toString(), stake);

        // Show guess options
        const guessKeyboard = {
          inline_keyboard: [
            [
              { text: "1", callback_data: `dice_guess:${gameState.id}:1` },
              { text: "2", callback_data: `dice_guess:${gameState.id}:2` },
              { text: "3", callback_data: `dice_guess:${gameState.id}:3` },
            ],
            [
              { text: "4", callback_data: `dice_guess:${gameState.id}:4` },
              { text: "5", callback_data: `dice_guess:${gameState.id}:5` },
              { text: "6", callback_data: `dice_guess:${gameState.id}:6` },
            ],
            [
              {
                text: "ODD (1,3,5)",
                callback_data: `dice_guess:${gameState.id}:ODD`,
              },
              {
                text: "EVEN (2,4,6)",
                callback_data: `dice_guess:${gameState.id}:EVEN`,
              },
            ],
            [
              { text: "1-3", callback_data: `dice_guess:${gameState.id}:1-3` },
              { text: "4-6", callback_data: `dice_guess:${gameState.id}:4-6` },
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
      } catch (error: any) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: error.message || "Failed to start new game",
          show_alert: true,
        });
        return;
      }
    }

    // Handle play again with same stake and same guess
    if (action === "dice_play_again_exact" && parts[1] && parts[2]) {
      const stake = parseInt(parts[1]);
      const guess = parts[2];
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
        const gameState = await createDiceGame(userId.toString(), stake);

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

        // Send result message with glass buttons
        const resultEmoji = result.won ? "🎉" : "😔";
        const resultText = result.won
          ? `${resultEmoji} **Congratulations! You won ${result.reward} coins!**\n\n🎯 Your guess: ${guess}\n🎲 Dice: ${diceResult}\n💰 Reward: ${result.reward} coins`
          : `${resultEmoji} **Better luck next time!**\n\n🎯 Your guess: ${guess}\n🎲 Dice: ${diceResult}\n💸 You lost ${stake} coins`;

        const playAgainKeyboard = {
          inline_keyboard: [
            [
              {
                text: "🔄 Play Again (Same Stake)",
                callback_data: `dice_play_again_same:${stake}`,
              },
            ],
            [
              {
                text: "🎯 Play Again (Same Stake & Guess)",
                callback_data: `dice_play_again_exact:${stake}:${guess}`,
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

        await bot.sendMessage(chatId, resultText, {
          parse_mode: "Markdown",
          reply_markup: playAgainKeyboard,
        });

        await bot.answerCallbackQuery(callbackQuery.id);
        console.log(`[DICE] Play again exact: completed game ${gameState.id}`);
        return;
      } catch (error: any) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: error.message || "Failed to start new game",
          show_alert: true,
        });
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
              { text: "🎲 Dice Game", callback_data: "inline_start_game:dice" },
            ],
            [
              { text: "Dots & Boxes", callback_data: "inline_start_game:dots" },
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
