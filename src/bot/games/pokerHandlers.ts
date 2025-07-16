import TelegramBot from "node-telegram-bot-api";
import {
  PokerGame,
  createPokerGame,
  addPlayerToGame,
  removePlayerFromGame,
  startPokerGame,
  handlePlayerAction,
  checkRoundComplete,
  advanceGamePhase,
  endPokerGame,
  checkTimeout,
  getPokerStats,
} from "./poker";
import { getUserCoins, adjustCoins } from "../../lib/coinService";

// Helper function to safely escape gameId for HTML
function escapeGameId(gameId: string): string {
  return gameId.replace(/[<>]/g, "");
}

// Store active poker games
const activePokerGames = new Map<string, PokerGame>();

// Store player game sessions
const playerGameSessions = new Map<string, string>(); // userId -> gameId

export function registerPokerHandlers(bot: TelegramBot) {
  console.log("[POKER] Registering poker handlers...");

  // Create new poker game
  bot.onText(/\/poker/, async (msg: TelegramBot.Message) => {
    const userId = msg.from?.id?.toString();
    const username = msg.from?.username || msg.from?.first_name || "Unknown";

    if (!userId) {
      await bot.sendMessage(msg.chat.id, "❌ Error: Could not identify user.");
      return;
    }

    // Check if player is already in a game
    if (playerGameSessions.has(userId)) {
      const gameId = playerGameSessions.get(userId)!;
      const game = activePokerGames.get(gameId);
      if (game && game.gamePhase !== "finished") {
        await bot.sendMessage(
          msg.chat.id,
          "❌ You are already in a poker game. Use /leave_poker to exit first."
        );
        return;
      }
    }

    // Check player's coins
    const user = await getUserCoins(userId);
    if (user.coins < 100) {
      await bot.sendMessage(
        msg.chat.id,
        "❌ You need at least 100 coins to join a poker game."
      );
      return;
    }

    // Create new game or join existing
    let game: PokerGame | undefined;
    let gameId: string = "";

    // Find available game or create new one
    for (const [id, existingGame] of activePokerGames) {
      if (
        existingGame.gamePhase === "waiting" &&
        existingGame.players.length < existingGame.maxPlayers
      ) {
        game = existingGame;
        gameId = id;
        break;
      }
    }

    if (!game) {
      // Generate a safe gameId using only alphanumeric characters
      const timestamp = Date.now();
      const randomPart = Math.random()
        .toString(36)
        .substr(2, 9)
        .replace(/[^a-zA-Z0-9]/g, "");
      gameId = `poker_${timestamp}_${randomPart}`;
      game = createPokerGame(gameId);
      activePokerGames.set(gameId, game);
    }

    // Add player to game
    const buyIn = Math.min(100, user.coins);
    if (addPlayerToGame(game, userId, username, buyIn)) {
      // Deduct buy-in from player's coins
      await adjustCoins(userId, -buyIn, "poker_buyin", "poker");
      playerGameSessions.set(userId, gameId);

      const message =
        `🃏 <b>Poker Game</b>\n\n` +
        `Game ID: <code>${escapeGameId(gameId)}</code>\n` +
        `Players: ${game.players.length}/${game.maxPlayers}\n` +
        `Buy-in: ${buyIn} coins\n\n` +
        `Players:\n${game.players
          .map((p) => `• ${p.username} (${p.chips} chips)`)
          .join("\n")}\n\n` +
        `Use /join_poker ${escapeGameId(gameId)} to join this game\n` +
        `Use /start_poker ${escapeGameId(gameId)} to start when ready`;

      await bot.sendMessage(msg.chat.id, message, { parse_mode: "HTML" });
    } else {
      await bot.sendMessage(
        msg.chat.id,
        "❌ Could not join game. Game might be full."
      );
    }
  });

  // Join specific poker game
  bot.onText(
    /\/join_poker (.+)/,
    async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
      const userId = msg.from?.id?.toString();
      const username = msg.from?.username || msg.from?.first_name || "Unknown";

      if (!userId || !match) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Usage: /join_poker &lt;game_id&gt;"
        );
        return;
      }

      const gameId = match[1];
      const game = activePokerGames.get(gameId);

      if (!game) {
        await bot.sendMessage(msg.chat.id, "❌ Game not found.");
        return;
      }

      if (game.gamePhase !== "waiting") {
        await bot.sendMessage(msg.chat.id, "❌ Game has already started.");
        return;
      }

      if (game.players.length >= game.maxPlayers) {
        await bot.sendMessage(msg.chat.id, "❌ Game is full.");
        return;
      }

      // Check if player is already in this game
      if (game.players.find((p) => p.userId === userId)) {
        await bot.sendMessage(msg.chat.id, "❌ You are already in this game.");
        return;
      }

      // Check player's coins
      const user = await getUserCoins(userId);
      if (user.coins < 100) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ You need at least 100 coins to join a poker game."
        );
        return;
      }

      const buyIn = Math.min(100, user.coins);
      if (addPlayerToGame(game, userId, username, buyIn)) {
        await adjustCoins(userId, -buyIn, "poker_buyin", "poker");
        playerGameSessions.set(userId, gameId);

        const message =
          `✅ <b>Joined Poker Game</b>\n\n` +
          `Game ID: <code>${escapeGameId(gameId)}</code>\n` +
          `Players: ${game.players.length}/${game.maxPlayers}\n` +
          `Your buy-in: ${buyIn} coins\n\n` +
          `Players:\n${game.players
            .map((p) => `• ${p.username} (${p.chips} chips)`)
            .join("\n")}`;

        await bot.sendMessage(msg.chat.id, message, { parse_mode: "HTML" });
      } else {
        await bot.sendMessage(msg.chat.id, "❌ Could not join game.");
      }
    }
  );

  // Start poker game
  bot.onText(
    /\/start_poker (.+)/,
    async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
      const userId = msg.from?.id?.toString();

      if (!userId || !match) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Usage: /start_poker &lt;game_id&gt;"
        );
        return;
      }

      const gameId = match[1];
      const game = activePokerGames.get(gameId);

      if (!game) {
        await bot.sendMessage(msg.chat.id, "❌ Game not found.");
        return;
      }

      // Check if user is in the game
      const player = game.players.find((p) => p.userId === userId);
      if (!player) {
        await bot.sendMessage(msg.chat.id, "❌ You are not in this game.");
        return;
      }

      if (game.gamePhase !== "waiting") {
        await bot.sendMessage(msg.chat.id, "❌ Game has already started.");
        return;
      }

      if (game.players.length < game.minPlayers) {
        await bot.sendMessage(
          msg.chat.id,
          `❌ Need at least ${game.minPlayers} players to start. Current: ${game.players.length}`
        );
        return;
      }

      if (startPokerGame(game)) {
        const message =
          `🎰 <b>Poker Game Started!</b>\n\n` +
          `Game ID: <code>${escapeGameId(gameId)}</code>\n` +
          `Players: ${game.players.length}\n` +
          `Small Blind: ${game.smallBlind}\n` +
          `Big Blind: ${game.bigBlind}\n\n` +
          `Dealer: ${game.players[game.dealerIndex].username}\n` +
          `Small Blind: ${
            game.players[(game.dealerIndex + 1) % game.players.length].username
          }\n` +
          `Big Blind: ${
            game.players[(game.dealerIndex + 2) % game.players.length].username
          }\n\n` +
          `Current Pot: ${game.pot} chips\n` +
          `Current Bet: ${game.currentBet} chips\n\n` +
          `It's ${
            game.players[game.currentPlayerIndex].username
          }'s turn to act!`;

        await bot.sendMessage(msg.chat.id, message, { parse_mode: "HTML" });

        // Send action buttons to current player
        await sendActionButtons(bot, game, game.currentPlayerIndex);
      } else {
        await bot.sendMessage(msg.chat.id, "❌ Could not start game.");
      }
    }
  );

  // Leave poker game
  bot.onText(/\/leave_poker/, async (msg: TelegramBot.Message) => {
    const userId = msg.from?.id?.toString();

    if (!userId) {
      await bot.sendMessage(msg.chat.id, "❌ Error: Could not identify user.");
      return;
    }

    const gameId = playerGameSessions.get(userId);
    if (!gameId) {
      await bot.sendMessage(msg.chat.id, "❌ You are not in any poker game.");
      return;
    }

    const game = activePokerGames.get(gameId);
    if (!game) {
      playerGameSessions.delete(userId);
      await bot.sendMessage(
        msg.chat.id,
        "❌ Game not found. Removed from session."
      );
      return;
    }

    if (removePlayerFromGame(game, userId)) {
      playerGameSessions.delete(userId);

      if (game.players.length === 0) {
        activePokerGames.delete(gameId);
        await bot.sendMessage(msg.chat.id, "✅ Left game. Game closed.");
      } else {
        await bot.sendMessage(
          msg.chat.id,
          `✅ Left game. ${game.players.length} players remaining.`
        );
      }
    } else {
      await bot.sendMessage(msg.chat.id, "❌ Could not leave game.");
    }
  });

  // Handle poker actions
  bot.on("callback_query", async (query) => {
    const data = query.data;
    if (!data || !data.startsWith("poker_")) return;

    const userId = query.from?.id?.toString();
    if (!userId) return;

    const gameId = playerGameSessions.get(userId);
    if (!gameId) {
      await bot.answerCallbackQuery(query.id, {
        text: "❌ You are not in a poker game.",
      });
      return;
    }

    const game = activePokerGames.get(gameId);
    if (!game) {
      await bot.answerCallbackQuery(query.id, { text: "❌ Game not found." });
      return;
    }

    const playerIndex = game.players.findIndex((p) => p.userId === userId);
    if (playerIndex === -1) {
      await bot.answerCallbackQuery(query.id, {
        text: "❌ You are not in this game.",
      });
      return;
    }

    if (game.currentPlayerIndex !== playerIndex) {
      await bot.answerCallbackQuery(query.id, {
        text: "❌ It's not your turn.",
      });
      return;
    }

    const player = game.players[playerIndex];
    const callAmount = game.currentBet - player.totalBet;

    if (data === "poker_fold") {
      if (handlePlayerAction(game, playerIndex, "fold")) {
        await bot.answerCallbackQuery(query.id, { text: "✅ Folded" });
        await updateGameState(bot, game);
      } else {
        await bot.answerCallbackQuery(query.id, { text: "❌ Invalid action" });
      }
    } else if (data === "poker_check") {
      if (callAmount > 0) {
        await bot.answerCallbackQuery(query.id, {
          text: "❌ Cannot check when there's a bet to call",
        });
        return;
      }
      if (handlePlayerAction(game, playerIndex, "check")) {
        await bot.answerCallbackQuery(query.id, { text: "✅ Checked" });
        await updateGameState(bot, game);
      } else {
        await bot.answerCallbackQuery(query.id, { text: "❌ Invalid action" });
      }
    } else if (data === "poker_call") {
      if (callAmount === 0) {
        await bot.answerCallbackQuery(query.id, { text: "❌ Nothing to call" });
        return;
      }
      if (handlePlayerAction(game, playerIndex, "call")) {
        await bot.answerCallbackQuery(query.id, {
          text: `✅ Called ${Math.min(callAmount, player.chips)}`,
        });
        await updateGameState(bot, game);
      } else {
        await bot.answerCallbackQuery(query.id, { text: "❌ Invalid action" });
      }
    } else if (data === "poker_allin") {
      if (handlePlayerAction(game, playerIndex, "all-in")) {
        await bot.answerCallbackQuery(query.id, {
          text: `✅ All-in ${player.chips}`,
        });
        await updateGameState(bot, game);
      } else {
        await bot.answerCallbackQuery(query.id, { text: "❌ Invalid action" });
      }
    } else if (data.startsWith("poker_raise_")) {
      const raiseAmount = parseInt(data.split("_")[2]);
      if (handlePlayerAction(game, playerIndex, "raise", raiseAmount)) {
        await bot.answerCallbackQuery(query.id, {
          text: `✅ Raised to ${raiseAmount}`,
        });
        await updateGameState(bot, game);
      } else {
        await bot.answerCallbackQuery(query.id, {
          text: "❌ Invalid raise amount",
        });
      }
    }
  });

  // Poker stats command
  bot.onText(/\/poker_stats/, async (msg: TelegramBot.Message) => {
    const userId = msg.from?.id?.toString();
    if (!userId) {
      await bot.sendMessage(msg.chat.id, "❌ Error: Could not identify user.");
      return;
    }

    const stats = await getPokerStats();
    const message =
      `📊 <b>Poker Statistics</b>\n\n` +
      `🎮 Total Games: ${stats.totalGames}\n` +
      `🏆 Total Wins: ${stats.totalWins}\n` +
      `💰 Total Winnings: ${stats.totalWinnings} coins\n` +
      `🎯 Biggest Pot: ${stats.biggestPot} coins\n` +
      `🃏 Total Hands: ${stats.totalHandsPlayed}`;

    await bot.sendMessage(msg.chat.id, message, { parse_mode: "HTML" });
  });
}

async function sendActionButtons(
  bot: TelegramBot,
  game: PokerGame,
  playerIndex: number
) {
  const player = game.players[playerIndex];
  const callAmount = game.currentBet - player.totalBet;
  const canRaise = player.chips > callAmount;

  const keyboard = {
    inline_keyboard: [[{ text: "🃏 Fold", callback_data: "poker_fold" }]],
  };

  if (callAmount === 0) {
    keyboard.inline_keyboard.push([
      { text: "✅ Check", callback_data: "poker_check" },
    ]);
  } else {
    keyboard.inline_keyboard.push([
      {
        text: `📞 Call ${Math.min(callAmount, player.chips)}`,
        callback_data: "poker_call",
      },
    ]);
  }

  if (canRaise) {
    const raiseOptions = [];
    const minRaise = game.currentBet + game.bigBlind;
    const maxRaise = player.chips;

    if (minRaise <= maxRaise) {
      raiseOptions.push({
        text: `📈 Raise ${minRaise}`,
        callback_data: `poker_raise_${minRaise}`,
      });
    }

    if (maxRaise > minRaise) {
      raiseOptions.push({
        text: `📈 Raise ${maxRaise}`,
        callback_data: `poker_raise_${maxRaise}`,
      });
    }

    if (raiseOptions.length > 0) {
      keyboard.inline_keyboard.push(raiseOptions);
    }
  }

  if (player.chips > 0) {
    keyboard.inline_keyboard.push([
      { text: "🔥 All-In", callback_data: "poker_allin" },
    ]);
  }

  await bot.sendMessage(
    game.players[playerIndex].userId,
    `🃏 <b>Your Turn</b>\n\n` +
      `Your chips: ${player.chips}\n` +
      `Current bet: ${game.currentBet}\n` +
      `Your bet: ${player.totalBet}\n` +
      `To call: ${callAmount}\n\n` +
      `Choose your action:`,
    {
      parse_mode: "HTML",
      reply_markup: keyboard,
    }
  );
}

async function updateGameState(bot: TelegramBot, game: PokerGame) {
  // Check for timeouts
  const timedOutPlayers = checkTimeout(game);

  // Check if round is complete
  if (checkRoundComplete(game)) {
    if (game.gamePhase === "showdown") {
      // End game
      const result = endPokerGame(game);

      const message =
        `🏁 <b>Game Over!</b>\n\n` +
        `Winner(s): ${result.winners.map((w) => w.username).join(", ")}\n` +
        `Hand: ${result.handName}\n` +
        `Pot: ${result.pot} chips\n\n` +
        `Final standings:\n${game.players
          .sort((a, b) => b.chips - a.chips)
          .map((p, i) => `${i + 1}. ${p.username}: ${p.chips} chips`)
          .join("\n")}`;

      // Send to all players
      for (const player of game.players) {
        await bot.sendMessage(player.userId, message, { parse_mode: "HTML" });
        playerGameSessions.delete(player.userId);
      }

      activePokerGames.delete(game.gameId);
    } else {
      // Advance to next phase
      advanceGamePhase(game);

      const phaseNames: Record<string, string> = {
        flop: "Flop",
        turn: "Turn",
        river: "River",
        showdown: "Showdown",
      };

      const message =
        `🃏 <b>${phaseNames[game.gamePhase]} Phase</b>\n\n` +
        `Community cards: ${game.communityCards.join(" ")}\n` +
        `Pot: ${game.pot} chips\n` +
        `Current bet: ${game.currentBet} chips\n\n` +
        `It's ${game.players[game.currentPlayerIndex].username}'s turn!`;

      // Send to all players
      for (const player of game.players) {
        await bot.sendMessage(player.userId, message, { parse_mode: "HTML" });
      }

      // Send action buttons to current player
      await sendActionButtons(bot, game, game.currentPlayerIndex);
    }
  } else {
    // Continue current round
    const currentPlayer = game.players[game.currentPlayerIndex];
    const message =
      `🃏 <b>Next Player</b>\n\n` +
      `It's ${currentPlayer.username}'s turn to act!\n` +
      `Pot: ${game.pot} chips\n` +
      `Current bet: ${game.currentBet} chips`;

    // Send to all players
    for (const player of game.players) {
      await bot.sendMessage(player.userId, message, { parse_mode: "HTML" });
    }

    // Send action buttons to current player
    await sendActionButtons(bot, game, game.currentPlayerIndex);
  }

  // Handle timed out players
  for (const player of timedOutPlayers) {
    await bot.sendMessage(player.userId, `⏰ You were folded due to timeout.`);
  }
}
