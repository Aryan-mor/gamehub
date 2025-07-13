// Load environment variables
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import TelegramBot from "node-telegram-bot-api";
import { registerXoHandlers } from "../games/xo";

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
  { command: "/start_game", description: "Choose a game to play" },
  { command: "/newgame", description: "Create a new TicTacToe game" },
  { command: "/join", description: "Join a game with game ID" },
  { command: "/stats", description: "Show your X/O game statistics" },
  { command: "/help", description: "Show help information" },
]);

// Add generic /start and /help handlers
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(
    chatId,
    `🎮 Welcome to GameHub!\n\nUse /newgame to start a TicTacToe game or /help for more info.`
  );
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(
    chatId,
    `Available commands:\n/newgame - Start a new TicTacToe game\n/join <gameId> - Join a game\n/stats - Your X/O stats\n/help - Show this help`
  );
});

// Add any additional generic bot setup or shared utilities here.
