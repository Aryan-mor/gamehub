import "dotenv/config";

import TelegramBot from "node-telegram-bot-api";
import { registerXoHandlers } from "../games/xo";
import { registerDiceHandlers } from "./games/diceHandlers";
import { registerFootballHandlers } from "./games/footballHandlers";
import { registerBasketballHandlers } from "./games/basketballHandlers";
import { registerBlackjackHandlers } from "./games/blackjackHandlers";

import {
  getUser,
  addCoins,
  canClaimDaily,
  setLastFreeCoinAt,
  getUserStatistics,
} from "./games/userStats";
import { getUnfinishedGamesForUser } from "../games/xo/game";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

const bot = new TelegramBot(token, { polling: true });

// Add error handlers for debugging
bot.on("polling_error", (error) => {
  console.error("❌ Polling error:", error);
});

bot.on("error", (error) => {
  console.error("❌ Bot error:", error);
});

bot.on("message", (msg) => {
  console.log("📨 Raw message received:", {
    chatId: msg.chat.id,
    text: msg.text,
    from: msg.from?.username || msg.from?.first_name,
    userId: msg.from?.id,
  });
});

// Register all X/O handlers (and future games)
registerXoHandlers(bot);

// Register dice game handlers
registerDiceHandlers(bot);

// Register football game handlers
registerFootballHandlers(bot);

// Register basketball game handlers
registerBasketballHandlers(bot);

// Register blackjack game handlers
registerBlackjackHandlers(bot);

// Set bot commands (generic)
bot.setMyCommands([
  { command: "/start", description: "Start the bot" },
  { command: "/startgame", description: "Start a new game" },
  { command: "/freecoin", description: "Claim your daily free coins" },
  { command: "/help", description: "Show help information" },
  { command: "/newgame", description: "Create a new game" },
  { command: "/games", description: "Show your unfinished games" },
  { command: "/stats", description: "Show your game statistics" },
  { command: "/balance", description: "Show your coin balance" },
]);

// Add generic /start and /help handlers
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from?.id);
  const username = msg.from?.username || "unknown";
  console.log(
    `[BOT] /start received from userId=${userId}, username=${username}`
  );

  try {
    const user = await getUser(userId);
    let welcome = `🎮 Welcome to GameHub!\n\n💰 Earn and claim daily Coins with /freecoin!\n\n🎯 Choose an action below:`;
    if (user.coins === 0 && !user.lastFreeCoinAt) {
      await addCoins(userId, 100, "initial grant");
      welcome = `🎉 You received 100\u202FCoins for joining!\n\n` + welcome;
    }

    // Glass buttons keyboard
    const glassKeyboard = {
      inline_keyboard: [
        [
          { text: "🎮 Start Game", callback_data: "startgame" },
          { text: "🪙 Free Coin", callback_data: "freecoin" },
        ],
        [
          { text: "❓ Help", callback_data: "help" },
          { text: "💰 Balance", callback_data: "balance" },
        ],
      ],
    };

    console.log(
      `[BOT] Sending glass keyboard to userId=${userId}:`,
      JSON.stringify(glassKeyboard, null, 2)
    );
    await bot.sendMessage(chatId, welcome, { reply_markup: glassKeyboard });
    console.log(`[BOT] /start response sent successfully to userId=${userId}`);
  } catch (error) {
    console.error(`[BOT] /start error for userId=${userId}:`, error);
    await bot.sendMessage(
      chatId,
      "🎮 Welcome to GameHub!\n\nUse /help to see available commands."
    );
  }
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from?.id);
  const username = msg.from?.username || "unknown";
  console.log(
    `[BOT] /help received from userId=${userId}, username=${username}`
  );
  await bot.sendMessage(
    chatId,
    `Available commands:\n` +
      `/start - Start the bot\n` +
      `/startgame - Start a new game\n` +
      `/freecoin - Claim your daily free coins\n` +
      `/help - Show this help message\n` +
      `/newgame - Create a new game\n` +
      `/games - Show your unfinished games\n` +
      `/stats - Show your game statistics\n` +
      `/balance - Show your coin balance`
  );
});

// /startgame command - same as /newgame
bot.onText(/\/startgame/, async (msg) => {
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

// Add any additional generic bot setup or shared utilities here.

// --- COIN SYSTEM COMMANDS ---

// /balance: show current coin balance
bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from?.id);
  const username = msg.from?.username || "unknown";
  console.log(
    `[BOT] /balance received from userId=${userId}, username=${username}`
  );
  const user = await getUser(userId);
  await bot.sendMessage(chatId, `💰 Your balance: <b>${user.coins}</b> Coins`, {
    parse_mode: "HTML",
  });
});

// /free_coin: daily claim
const freeCoinHandler = async (msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from?.id);
  const username = msg.from?.username || "unknown";
  console.log(
    `[BOT] /free_coin received from userId=${userId}, username=${username}`
  );
  const { canClaim, nextClaimIn } = await canClaimDaily(userId);
  if (canClaim) {
    await addCoins(userId, 20, "daily free coin");
    await setLastFreeCoinAt(userId, Date.now());
    await bot.sendMessage(
      chatId,
      `🪙 You claimed <b>+20</b> daily Coins! Come back tomorrow.`,
      { parse_mode: "HTML" }
    );
  } else {
    // Format nextClaimIn as HH:MM:SS
    const h = Math.floor(nextClaimIn / 3600000);
    const m = Math.floor((nextClaimIn % 3600000) / 60000);
    const s = Math.floor((nextClaimIn % 60000) / 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    await bot.sendMessage(
      chatId,
      `⏰ You already claimed today. Come back in ${pad(h)}:${pad(m)}:${pad(
        s
      )}.`
    );
  }
};
bot.onText(/\/free_coin/, freeCoinHandler);
bot.onText(/\/freecoin/, freeCoinHandler);

// /games: show unfinished games
bot.onText(/\/games/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from?.id);
  const username = msg.from?.username || "unknown";
  console.log(
    `[BOT] /games received from userId=${userId}, username=${username}`
  );

  try {
    const unfinishedGames = getUnfinishedGamesForUser(userId);
    console.log(
      `[BOT] /games result for userId=${userId}:`,
      unfinishedGames.length,
      "games found"
    );

    if (unfinishedGames.length === 0) {
      await bot.sendMessage(chatId, "📋 You have no unfinished games.");
      return;
    }

    let message = `📋 Your unfinished games (${unfinishedGames.length}):\n\n`;

    for (const { gameId, gameState } of unfinishedGames) {
      const status =
        gameState.status === "waiting" ? "⏳ Waiting" : "🎮 Playing";
      const stake = gameState.stake || 0;
      const creatorName = gameState.players.X?.name || "Unknown";
      const joinerName = gameState.players.O?.name || "None";

      message += `🎮 Game: \`${gameId}\`\n`;
      message += `📊 Status: ${status}\n`;
      message += `💰 Stake: ${stake} Coins\n`;
      message += `👤 Creator: ${creatorName}\n`;
      message += `👥 Joiner: ${joinerName}\n`;

      if (gameState.status === "playing") {
        const currentPlayerName =
          gameState.players[gameState.currentPlayer]?.name ||
          gameState.currentPlayer;
        message += `🎯 Current Turn: ${currentPlayerName}\n`;
      }

      message += `\n`;
    }

    await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (err) {
    console.error(`[BOT] /games error for userId=${userId}:`, err);
    await bot.sendMessage(chatId, `❌ Failed to fetch your games.`);
  }
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from?.id);
  const username = msg.from?.username || "unknown";
  console.log(
    `[BOT] /stats received from userId=${userId}, username=${username}`
  );
  try {
    const stats = await getUserStatistics(userId, "xo");
    console.log(`[BOT] /stats result for userId=${userId}:`, stats);
    await bot.sendMessage(
      chatId,
      `📊 Your X/O Stats:\n\nWins: ${stats.totalWins}\nGames Played: ${stats.totalGames}`
    );
  } catch (err) {
    console.error(`[BOT] /stats error for userId=${userId}:`, err);
    await bot.sendMessage(chatId, `❌ Failed to fetch your stats.`);
  }
});

// /dice command handler
bot.onText(/\/dice/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from?.id);
  console.log(`[BOT] /dice called by userId=${userId}`);

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

  await bot.sendMessage(
    chatId,
    "🎲 Dice Guess Game\n\nChoose your stake amount:",
    {
      reply_markup: stakeKeyboard,
    }
  );
});

export default bot;
