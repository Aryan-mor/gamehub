import "dotenv/config";

import TelegramBot from "node-telegram-bot-api";
import { registerXoHandlers } from "../games/xo";
import { registerDiceHandlers } from "./games/diceHandlers";
import { registerFootballHandlers } from "./games/footballHandlers";
import { registerBasketballHandlers } from "./games/basketballHandlers";

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

// Register all X/O handlers (and future games)
registerXoHandlers(bot);

// Register dice game handlers
registerDiceHandlers(bot);

// Register football game handlers
registerFootballHandlers(bot);

// Register basketball game handlers
registerBasketballHandlers(bot);

// Set bot commands (generic)
bot.setMyCommands([
  { command: "/start", description: "Start the bot" },
  { command: "/newgame", description: "Create a new X/O game with stake" },
  { command: "/dice", description: "Play dice guess game" },
  {
    command: "/football_game",
    description: "Play football direction guess game",
  },
  {
    command: "/basketball_game",
    description: "Play basketball hoop shot game",
  },
  { command: "/games", description: "Show your unfinished games" },
  { command: "/stats", description: "Show your X/O game statistics" },
  { command: "/dice_stats", description: "Show your dice game statistics" },
  {
    command: "/football_stats",
    description: "Show your football game statistics",
  },
  {
    command: "/basketball_stats",
    description: "Show your basketball game statistics",
  },
  { command: "/balance", description: "Show your coin balance" },
  { command: "/free_coin", description: "Claim your daily free coins" },
  { command: "/help", description: "Show help information" },
]);

// Add generic /start and /help handlers
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from?.id);
  const user = await getUser(userId);
  let welcome = `🎮 Welcome to GameHub!\n\nUse /help to see available commands.\n\n💰 Earn and claim daily Coins with /free_coin!`;
  if (user.coins === 0 && !user.lastFreeCoinAt) {
    await addCoins(userId, 100, "initial grant");
    welcome = `🎉 You received 100\u202FCoins for joining!\n\n` + welcome;
  }
  await bot.sendMessage(chatId, welcome);
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(
    chatId,
    `Available commands:\n` +
      `/start - Start the bot\n` +
      `/newgame - Create a new X/O game with stake\n` +
      `/dice - Play dice guess game\n` +
      `/football_game - Play football direction guess game\n` +
      `/basketball_game - Play basketball hoop shot game\n` +
      `/join <gameId> - Join an existing game\n` +
      `/games - Show your unfinished games\n` +
      `/stats - Show your X/O game statistics\n` +
      `/dice_stats - Show your dice game statistics\n` +
      `/football_stats - Show your football game statistics\n` +
      `/basketball_stats - Show your basketball game statistics\n` +
      `/balance - Show your coin balance\n` +
      `/free_coin - Claim your daily free coins\n` +
      `/help - Show this help message`
  );
});

// Add any additional generic bot setup or shared utilities here.

// --- COIN SYSTEM COMMANDS ---

// /balance: show current coin balance
bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from?.id);
  const user = await getUser(userId);
  await bot.sendMessage(chatId, `💰 Your balance: <b>${user.coins}</b> Coins`, {
    parse_mode: "HTML",
  });
});

// /free_coin: daily claim
const freeCoinHandler = async (msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from?.id);
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

// /games: show unfinished games
bot.onText(/\/games/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from?.id);
  console.log(`[BOT] /games called by userId=${userId}`);

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
  console.log(`[BOT] /stats called by userId=${userId}`);
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
