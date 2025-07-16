import "dotenv/config";

import TelegramBot from "node-telegram-bot-api";
import { registerXoHandlers } from "../games/xo";
import { registerDiceHandlers } from "./games/diceHandlers";
import { registerFootballHandlers } from "./games/footballHandlers";
import { registerBasketballHandlers } from "./games/basketballHandlers";
import { registerBlackjackHandlers } from "./games/blackjackHandlers";
import { registerAdminCommands } from "./admin/adminCommands";

import {
  getUser,
  addCoins,
  canClaimDaily,
  setLastFreeCoinAt,
  getUserStatistics,
  setUserProfile,
} from "./games/userStats";
import { getUnfinishedGamesForUser } from "../games/xo/game";
import { publicConfig } from "./publicConfig";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

// Validate token format
if (!token.match(/^\d+:[A-Za-z0-9_-]+$/)) {
  throw new Error(
    "Invalid TELEGRAM_BOT_TOKEN format. Expected format: <bot_id>:<bot_token>"
  );
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

// Listen for possible TON transaction hash after 'I Paid'
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const username = msg.from?.username || msg.from?.first_name || "Unknown";
  const text = msg.text?.trim();
  // Only handle if the message is a likely TON hash (64 hex chars)
  if (text && /^[a-fA-F0-9]{64}$/.test(text)) {
    // Respond to user
    await bot.sendMessage(
      chatId,
      "We received your transaction. Admin will check and credit your account as soon as possible."
    );
    // Forward details to admin chat
    const adminChatId = process.env.ADMIN_CHAT_ID;
    if (adminChatId) {
      const adminMsg = `TON Payment Request\nUser: ${username} (ID: ${userId})\nHash: <code>${text}</code>`;
      await bot.sendMessage(adminChatId, adminMsg, { parse_mode: "HTML" });
    }
  }
});

// Initialize bot with async function
async function initializeBot() {
  console.log("🚀 Initializing GameHub bot...");

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

  // Register admin commands
  registerAdminCommands(bot);

  // Wait a moment for bot to fully initialize
  console.log("⏳ Waiting for bot to initialize...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Set bot commands (generic) with error handling
  try {
    console.log("📝 Setting bot commands...");
    await bot.setMyCommands([
      { command: "/start", description: "Start the bot" },
      { command: "/startgame", description: "Start a new game" },
      { command: "/freecoin", description: "Claim your daily free coins" },
      { command: "/help", description: "Show help information" },
      { command: "/newgame", description: "Create a new game" },
      { command: "/games", description: "Show your unfinished games" },
      { command: "/stats", description: "Show your game statistics" },
      { command: "/balance", description: "Show your coin balance" },
    ]);
    console.log("✅ Bot commands set successfully");
  } catch (error) {
    console.error("❌ Failed to set bot commands:", error);
    console.log("⚠️ Bot will continue without setting commands");
  }

  console.log("🎮 GameHub bot is ready!");
}

// Start the bot initialization
initializeBot().catch((error) => {
  console.error("❌ Failed to initialize bot:", error);
});

// Add generic /start and /help handlers
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from?.id);
  const username = msg.from?.username || undefined;
  const name =
    msg.from?.first_name || msg.from?.last_name
      ? `${msg.from?.first_name || ""} ${msg.from?.last_name || ""}`.trim()
      : undefined;
  console.log(
    `[BOT] /start received from userId=${userId}, username=${username}`
  );

  try {
    // Save username and name to user profile
    await setUserProfile(userId, username, name);
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
          { text: "🏀 Basketball Game", callback_data: "newgame:basketball" },
        ],
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

// /buycoin: show TON wallet and instructions
bot.onText(/\/buycoin/, async (msg) => {
  const chatId = msg.chat.id;
  const tonWallet = publicConfig.tonWallet;
  const rate = 1000; // 1 TON = 1000 Coins
  if (!tonWallet) {
    await bot.sendMessage(
      chatId,
      "TON wallet address is not set. Please contact admin."
    );
    return;
  }
  const text =
    `💸 <b>Buy Coins with TON</b>\n\n` +
    `1 TON = <b>${rate}</b> Coins\n` +
    `Send TON to this address:\n<code>${tonWallet}</code>\n\n` +
    `After payment, click <b>I Paid</b> and send your transaction hash.`;
  const keyboard = {
    inline_keyboard: [[{ text: "I Paid", callback_data: `ton_paid` }]],
  };
  await bot.sendMessage(chatId, text, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

// Handle main bot callback queries
bot.on("callback_query", async (query) => {
  try {
    const data = query.data;
    if (!data) return;

    const chatId = query.message?.chat.id;
    const userId = query.from?.id?.toString();

    if (!chatId || !userId) return;

    // Check if callback query is too old (more than 1 hour)
    const now = Date.now();
    const queryTime = query.message?.date ? query.message.date * 1000 : now;
    if (now - queryTime > 3600000) {
      // 1 hour in milliseconds
      console.log(
        `[BOT] Ignoring old callback query: ${data} from userId=${userId}`
      );
      return;
    }

    console.log(`[BOT] Callback query: ${data} from userId=${userId}`);

    // Handle main bot callbacks
    if (data === "startgame") {
      try {
        await bot.answerCallbackQuery(query.id, { text: "Opening games..." });
        // Send the startgame menu
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
        await bot.sendMessage(chatId, "🎮 Choose a game to play:", {
          reply_markup: singlePlayerKeyboard,
        });
      } catch (error) {
        console.error("[BOT] Error handling startgame callback:", error);
      }
    } else if (data === "freecoin") {
      try {
        await bot.answerCallbackQuery(query.id, { text: "Claiming coins..." });
        const fakeMsg = {
          chat: { id: chatId },
          from: query.from,
        } as TelegramBot.Message;
        await freeCoinHandler(fakeMsg);
      } catch (error) {
        console.error("[BOT] Error handling freecoin callback:", error);
      }
    } else if (data === "help") {
      try {
        await bot.answerCallbackQuery(query.id, { text: "Showing help..." });
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
      } catch (error) {
        console.error("[BOT] Error handling help callback:", error);
      }
    } else if (data === "balance") {
      try {
        await bot.answerCallbackQuery(query.id, {
          text: "Checking balance...",
        });
        const user = await getUser(userId);
        await bot.sendMessage(
          chatId,
          `💰 Your balance: <b>${user.coins}</b> Coins`,
          {
            parse_mode: "HTML",
          }
        );
      } catch (error) {
        console.error("[BOT] Error handling balance callback:", error);
      }
    } else if (data.startsWith("newgame:")) {
      try {
        const gameType = data.split(":")[1];
        await bot.answerCallbackQuery(query.id, {
          text: `Starting ${gameType}...`,
        });
        // Handle game-specific logic here
      } catch (error) {
        console.error("[BOT] Error handling newgame callback:", error);
      }
    } else if (data.startsWith("dice_stake:")) {
      try {
        await bot.answerCallbackQuery(query.id, {
          text: "Setting dice stake...",
        });
        // Handle dice stake selection
      } catch (error) {
        console.error("[BOT] Error handling dice_stake callback:", error);
      }
    } else if (data === "ton_paid") {
      try {
        await bot.answerCallbackQuery(query.id, {
          text: "Please send your TON transaction hash.",
        });
        await bot.sendMessage(
          chatId,
          "Please copy and paste your TON transaction hash (TxID) here. Example: 2e3f...a1b9\nAfter we verify your payment, your coins will be credited!"
        );
      } catch (error) {
        console.error("[BOT] Error handling ton_paid callback:", error);
      }
    } else {
      // For any other unhandled callbacks, just acknowledge
      try {
        await bot.answerCallbackQuery(query.id, { text: "Processing..." });
      } catch (error) {
        console.error("[BOT] Error acknowledging callback:", error);
      }
    }
  } catch (error) {
    console.error("❌ Callback query error:", error);
    // Silently ignore old/invalid callback queries
    try {
      await bot.answerCallbackQuery(query.id, { text: "Processing..." });
    } catch {
      // Ignore any errors from answering callback queries
    }
  }
});

export default bot;
