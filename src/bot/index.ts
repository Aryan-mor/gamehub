// Load environment variables
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import TelegramBot from "node-telegram-bot-api";
import { registerXoHandlers } from "../games/xo";
import {
  getUser,
  addCoins,
  canClaimDaily,
  setLastFreeCoinAt,
} from "./games/userStats";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

const bot = new TelegramBot(token, { polling: true });

// Register all X/O handlers (and future games)
registerXoHandlers(bot, {});

// Set bot commands (generic)
bot.setMyCommands([
  { command: "/start", description: "Start the bot" },
  { command: "/stats", description: "Show your X/O game statistics" },
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
      `/stats - Show your X/O game statistics\n` +
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
