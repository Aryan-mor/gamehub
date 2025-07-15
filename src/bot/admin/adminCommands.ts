import TelegramBot from "node-telegram-bot-api";
import { adjustCoins, getUserCoins } from "../../lib/coinService";
import { getBlackjackStats } from "../games/blackjack";
import { getDiceStats } from "../games/dice";
import { getFootballStats } from "../games/football";
import { getBasketballStats } from "../games/basketball";

// Admin user IDs - add your admin user IDs here
const ADMIN_USER_IDS = [
  "68169486", // Replace with actual admin user IDs
  // Add more admin IDs as needed
];

export function isAdmin(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId);
}

export function registerAdminCommands(bot: TelegramBot) {
  console.log("[ADMIN] Registering admin commands...");

  // Admin add coins command
  bot.onText(
    /\/admin_add_coins (.+)/,
    async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
      const userId = msg.from?.id?.toString();
      if (!userId || !isAdmin(userId)) {
        await bot.sendMessage(msg.chat.id, "❌ Access denied. Admin only.");
        return;
      }

      if (!match || !match[1]) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Usage: /admin_add_coins <user_id> <amount>"
        );
        return;
      }

      const args = match[1].split(" ");
      if (args.length !== 2) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Usage: /admin_add_coins <user_id> <amount>"
        );
        return;
      }

      const targetUserId = args[0];
      const amount = parseInt(args[1]);

      if (isNaN(amount) || amount <= 0) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Invalid amount. Must be a positive number."
        );
        return;
      }

      try {
        await adjustCoins(targetUserId, amount, "admin_add", "admin");
        const user = await getUserCoins(targetUserId);
        await bot.sendMessage(
          msg.chat.id,
          `✅ Successfully added ${amount} coins to user ${targetUserId}\nNew balance: ${user.coins} coins`
        );
      } catch (error) {
        console.error("[ADMIN] Error adding coins:", error);
        await bot.sendMessage(
          msg.chat.id,
          "❌ Error adding coins. Check user ID."
        );
      }
    }
  );

  // Admin remove coins command
  bot.onText(
    /\/admin_remove_coins (.+)/,
    async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
      const userId = msg.from?.id?.toString();
      if (!userId || !isAdmin(userId)) {
        await bot.sendMessage(msg.chat.id, "❌ Access denied. Admin only.");
        return;
      }

      if (!match || !match[1]) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Usage: /admin_remove_coins <user_id> <amount>"
        );
        return;
      }

      const args = match[1].split(" ");
      if (args.length !== 2) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Usage: /admin_remove_coins <user_id> <amount>"
        );
        return;
      }

      const targetUserId = args[0];
      const amount = parseInt(args[1]);

      if (isNaN(amount) || amount <= 0) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Invalid amount. Must be a positive number."
        );
        return;
      }

      try {
        await adjustCoins(targetUserId, -amount, "admin_remove", "admin");
        const user = await getUserCoins(targetUserId);
        await bot.sendMessage(
          msg.chat.id,
          `✅ Successfully removed ${amount} coins from user ${targetUserId}\nNew balance: ${user.coins} coins`
        );
      } catch (error) {
        console.error("[ADMIN] Error removing coins:", error);
        await bot.sendMessage(
          msg.chat.id,
          "❌ Error removing coins. Check user ID."
        );
      }
    }
  );

  // Admin set coins command
  bot.onText(
    /\/admin_set_coins (.+)/,
    async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
      const userId = msg.from?.id?.toString();
      if (!userId || !isAdmin(userId)) {
        await bot.sendMessage(msg.chat.id, "❌ Access denied. Admin only.");
        return;
      }

      if (!match || !match[1]) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Usage: /admin_set_coins <user_id> <amount>"
        );
        return;
      }

      const args = match[1].split(" ");
      if (args.length !== 2) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Usage: /admin_set_coins <user_id> <amount>"
        );
        return;
      }

      const targetUserId = args[0];
      const amount = parseInt(args[1]);

      if (isNaN(amount) || amount < 0) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Invalid amount. Must be a non-negative number."
        );
        return;
      }

      try {
        // Get current balance first
        const currentUser = await getUserCoins(targetUserId);
        const difference = amount - currentUser.coins;

        if (difference !== 0) {
          await adjustCoins(targetUserId, difference, "admin_set", "admin");
        }

        const user = await getUserCoins(targetUserId);
        await bot.sendMessage(
          msg.chat.id,
          `✅ Successfully set coins for user ${targetUserId}\nNew balance: ${user.coins} coins`
        );
      } catch (error) {
        console.error("[ADMIN] Error setting coins:", error);
        await bot.sendMessage(
          msg.chat.id,
          "❌ Error setting coins. Check user ID."
        );
      }
    }
  );

  // Admin view coins command
  bot.onText(
    /\/admin_view_coins (.+)/,
    async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
      const userId = msg.from?.id?.toString();
      if (!userId || !isAdmin(userId)) {
        await bot.sendMessage(msg.chat.id, "❌ Access denied. Admin only.");
        return;
      }

      if (!match || !match[1]) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Usage: /admin_view_coins <user_id>"
        );
        return;
      }

      const targetUserId = match[1];

      try {
        const user = await getUserCoins(targetUserId);
        await bot.sendMessage(
          msg.chat.id,
          `💰 <b>User ${targetUserId} Balance</b>\n\n` +
            `🪙 Coins: ${user.coins}\n` +
            `📅 Last Free Coin: ${
              user.lastFreeCoinAt
                ? new Date(user.lastFreeCoinAt).toLocaleString()
                : "Never"
            }\n` +
            `📊 Total Games: 0\n` +
            `🏆 Total Wins: 0`,
          { parse_mode: "HTML" }
        );
      } catch (error) {
        console.error("[ADMIN] Error viewing coins:", error);
        await bot.sendMessage(
          msg.chat.id,
          "❌ Error viewing coins. Check user ID."
        );
      }
    }
  );

  // Admin view stats command
  bot.onText(
    /\/admin_view_stats (.+)/,
    async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
      const userId = msg.from?.id?.toString();
      if (!userId || !isAdmin(userId)) {
        await bot.sendMessage(msg.chat.id, "❌ Access denied. Admin only.");
        return;
      }

      if (!match || !match[1]) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Usage: /admin_view_stats <user_id>"
        );
        return;
      }

      const targetUserId = match[1];

      try {
        const user = await getUserCoins(targetUserId);
        const blackjackStats = await getBlackjackStats(targetUserId);
        const diceStats = await getDiceStats(targetUserId);
        const footballStats = await getFootballStats(targetUserId);
        const basketballStats = await getBasketballStats(targetUserId);

        const message =
          `📊 <b>User ${targetUserId} Statistics</b>\n\n` +
          `💰 <b>Balance:</b> ${user.coins} coins\n\n` +
          `🎲 <b>Dice Games:</b>\n` +
          `   Games: ${diceStats.totalGames}\n` +
          `   Wins: ${diceStats.totalWins}\n` +
          `   Winnings: ${diceStats.totalWinnings} coins\n\n` +
          `🃏 <b>Blackjack Games:</b>\n` +
          `   Games: ${blackjackStats.totalGames}\n` +
          `   Wins: ${blackjackStats.totalWins}\n` +
          `   Winnings: ${blackjackStats.totalWinnings} coins\n\n` +
          `⚽️ <b>Football Games:</b>\n` +
          `   Games: ${footballStats.totalGames}\n` +
          `   Wins: ${footballStats.totalWins}\n` +
          `   Winnings: ${footballStats.totalWinnings} coins\n\n` +
          `🏀 <b>Basketball Games:</b>\n` +
          `   Games: ${basketballStats.totalGames}\n` +
          `   Wins: ${basketballStats.totalWins}\n` +
          `   Winnings: ${basketballStats.totalWinnings} coins\n\n` +
          `📈 <b>Overall:</b>\n` +
          `   Total Games: ${
            diceStats.totalGames +
            blackjackStats.totalGames +
            footballStats.totalGames +
            basketballStats.totalGames
          }\n` +
          `   Total Wins: ${
            diceStats.totalWins +
            blackjackStats.totalWins +
            footballStats.totalWins +
            basketballStats.totalWins
          }`;

        await bot.sendMessage(msg.chat.id, message, { parse_mode: "HTML" });
      } catch (error) {
        console.error("[ADMIN] Error viewing stats:", error);
        await bot.sendMessage(
          msg.chat.id,
          "❌ Error viewing stats. Check user ID."
        );
      }
    }
  );

  // Admin help command
  bot.onText(/\/admin_help/, async (msg: TelegramBot.Message) => {
    const userId = msg.from?.id?.toString();
    if (!userId || !isAdmin(userId)) {
      await bot.sendMessage(msg.chat.id, "❌ Access denied. Admin only.");
      return;
    }

    const helpMessage =
      `🛡️ <b>Admin Commands</b>\n\n` +
      `💰 <b>Coin Management:</b>\n` +
      `• /admin_add_coins <user_id> <amount> - Add coins\n` +
      `• /admin_remove_coins <user_id> <amount> - Remove coins\n` +
      `• /admin_set_coins <user_id> <amount> - Set exact amount\n` +
      `• /admin_view_coins <user_id> - View balance\n\n` +
      `📊 <b>Statistics:</b>\n` +
      `• /admin_view_stats <user_id> - View all game stats\n\n` +
      `📝 <b>Examples:</b>\n` +
      `• /admin_add_coins 123456789 100\n` +
      `• /admin_view_coins 123456789\n` +
      `• /admin_view_stats 123456789`;

    await bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: "HTML" });
  });
}
