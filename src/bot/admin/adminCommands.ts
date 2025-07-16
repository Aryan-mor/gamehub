import TelegramBot from "node-telegram-bot-api";
import { adjustCoins, getUserCoins } from "../../lib/coinService";
import { getBlackjackStats } from "../games/blackjack";
import { getDiceStats } from "../games/dice";
import { getFootballStats } from "../games/football";
import { getBasketballStats } from "../games/basketball";
import { getDatabase, ref as dbRef, get as dbGet } from "firebase/database";

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

  // Admin panel command with glass buttons
  bot.onText(/\/admin/, async (msg: TelegramBot.Message) => {
    const userId = msg.from?.id?.toString();
    if (!userId || !isAdmin(userId)) {
      await bot.sendMessage(msg.chat.id, "❌ Access denied. Admin only.");
      return;
    }

    const adminPanelMessage =
      `🛡️ <b>Admin Panel</b>\n\n` + `Welcome, Admin! Choose an action:`;

    const adminKeyboard = {
      inline_keyboard: [
        [
          { text: "💰 Add Coins", callback_data: "admin_add_coins_panel" },
          {
            text: "➖ Remove Coins",
            callback_data: "admin_remove_coins_panel",
          },
        ],
        [
          { text: "🎯 Set Coins", callback_data: "admin_set_coins_panel" },
          { text: "👁️ View Balance", callback_data: "admin_view_coins_panel" },
        ],
        [
          { text: "📊 View Stats", callback_data: "admin_view_stats_panel" },
          {
            text: "🔍 Find User ID",
            callback_data: "admin_find_user_id_panel",
          },
        ],
        [{ text: "❓ Help", callback_data: "admin_help_panel" }],
      ],
    };

    await bot.sendMessage(msg.chat.id, adminPanelMessage, {
      parse_mode: "HTML",
      reply_markup: adminKeyboard,
    });
  });

  // Handle admin panel callback queries
  bot.on("callback_query", async (query) => {
    const userId = query.from?.id?.toString();
    if (!userId || !isAdmin(userId)) {
      await bot.answerCallbackQuery(query.id, {
        text: "❌ Access denied. Admin only.",
      });
      return;
    }

    const data = query.data;
    if (!data) return;

    if (data === "admin_add_coins_panel") {
      await bot.editMessageText(
        `💰 <b>Add Coins</b>\n\n` +
          `Use the command:\n` +
          `<code>/admin_add_coins &lt;user_id&gt; &lt;amount&gt;</code>\n\n` +
          `Example: <code>/admin_add_coins 123456789 100</code>`,
        {
          chat_id: query.message?.chat.id,
          message_id: query.message?.message_id,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔙 Back to Admin Panel",
                  callback_data: "admin_back_to_panel",
                },
              ],
            ],
          },
        }
      );
    } else if (data === "admin_remove_coins_panel") {
      await bot.editMessageText(
        `➖ <b>Remove Coins</b>\n\n` +
          `Use the command:\n` +
          `<code>/admin_remove_coins &lt;user_id&gt; &lt;amount&gt;</code>\n\n` +
          `Example: <code>/admin_remove_coins 123456789 50</code>`,
        {
          chat_id: query.message?.chat.id,
          message_id: query.message?.message_id,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔙 Back to Admin Panel",
                  callback_data: "admin_back_to_panel",
                },
              ],
            ],
          },
        }
      );
    } else if (data === "admin_set_coins_panel") {
      await bot.editMessageText(
        `🎯 <b>Set Coins</b>\n\n` +
          `Use the command:\n` +
          `<code>/admin_set_coins &lt;user_id&gt; &lt;amount&gt;</code>\n\n` +
          `Example: <code>/admin_set_coins 123456789 200</code>`,
        {
          chat_id: query.message?.chat.id,
          message_id: query.message?.message_id,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔙 Back to Admin Panel",
                  callback_data: "admin_back_to_panel",
                },
              ],
            ],
          },
        }
      );
    } else if (data === "admin_view_coins_panel") {
      await bot.editMessageText(
        `👁️ <b>View Balance</b>\n\n` +
          `Use the command:\n` +
          `<code>/admin_view_coins &lt;user_id&gt;</code>\n\n` +
          `Example: <code>/admin_view_coins 123456789</code>`,
        {
          chat_id: query.message?.chat.id,
          message_id: query.message?.message_id,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔙 Back to Admin Panel",
                  callback_data: "admin_back_to_panel",
                },
              ],
            ],
          },
        }
      );
    } else if (data === "admin_view_stats_panel") {
      await bot.editMessageText(
        `📊 <b>View Statistics</b>\n\n` +
          `Use the command:\n` +
          `<code>/admin_view_stats &lt;user_id&gt;</code>\n\n` +
          `Example: <code>/admin_view_stats 123456789</code>\n\n` +
          `Shows all game statistics including:\n` +
          `• Dice games\n` +
          `• Blackjack games\n` +
          `• Football games\n` +
          `• Basketball games`,
        {
          chat_id: query.message?.chat.id,
          message_id: query.message?.message_id,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔙 Back to Admin Panel",
                  callback_data: "admin_back_to_panel",
                },
              ],
            ],
          },
        }
      );
    } else if (data === "admin_help_panel") {
      const helpMessage =
        `❓ <b>Admin Help</b>\n\n` +
        `💰 <b>Coin Management:</b>\n` +
        `• /admin_add_coins &lt;user_id&gt; &lt;amount&gt; - Add coins\n` +
        `• /admin_remove_coins &lt;user_id&gt; &lt;amount&gt; - Remove coins\n` +
        `• /admin_set_coins &lt;user_id&gt; &lt;amount&gt; - Set exact amount\n` +
        `• /admin_view_coins &lt;user_id&gt; - View balance\n\n` +
        `📊 <b>Statistics:</b>\n` +
        `• /admin_view_stats &lt;user_id&gt; - View all game stats\n\n` +
        `📝 <b>Examples:</b>\n` +
        `• /admin_add_coins 123456789 100\n` +
        `• /admin_view_coins 123456789\n` +
        `• /admin_view_stats 123456789`;

      await bot.editMessageText(helpMessage, {
        chat_id: query.message?.chat.id,
        message_id: query.message?.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔙 Back to Admin Panel",
                callback_data: "admin_back_to_panel",
              },
            ],
          ],
        },
      });
    } else if (data === "admin_back_to_panel") {
      const adminPanelMessage =
        `🛡️ <b>Admin Panel</b>\n\n` + `Welcome, Admin! Choose an action:`;

      const adminKeyboard = {
        inline_keyboard: [
          [
            { text: "💰 Add Coins", callback_data: "admin_add_coins_panel" },
            {
              text: "➖ Remove Coins",
              callback_data: "admin_remove_coins_panel",
            },
          ],
          [
            { text: "🎯 Set Coins", callback_data: "admin_set_coins_panel" },
            {
              text: "👁️ View Balance",
              callback_data: "admin_view_coins_panel",
            },
          ],
          [
            { text: "📊 View Stats", callback_data: "admin_view_stats_panel" },
            {
              text: "🔍 Find User ID",
              callback_data: "admin_find_user_id_panel",
            },
          ],
          [{ text: "❓ Help", callback_data: "admin_help_panel" }],
        ],
      };

      await bot.editMessageText(adminPanelMessage, {
        chat_id: query.message?.chat.id,
        message_id: query.message?.message_id,
        parse_mode: "HTML",
        reply_markup: adminKeyboard,
      });
    } else if (data === "admin_find_user_id_panel") {
      const newText = `🔍 Find User ID\n\nSend /find_user <username|name> to find a user's ID.\nOr ask the user to send /myid to the bot.`;
      // Always answer callback query first
      await bot.answerCallbackQuery(query.id);
      // Only edit if the text is different to avoid Telegram 'message is not modified' error
      if (query.message && query.message.text !== newText) {
        try {
          await bot.editMessageText(newText, {
            chat_id: query.message?.chat.id,
            message_id: query.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔙 Back to Admin Panel",
                    callback_data: "admin_back_to_panel",
                  },
                ],
              ],
            },
          });
        } catch (err: unknown) {
          // Helper to check for Telegram 'message is not modified' error
          function isTelegramNotModifiedError(e: unknown): boolean {
            if (
              typeof e === "object" &&
              e !== null &&
              "response" in e &&
              typeof (e as { response?: { body?: { description?: string } } })
                .response?.body?.description === "string" &&
              (
                e as { response: { body: { description: string } } }
              ).response.body.description.includes("message is not modified")
            ) {
              return true;
            }
            return false;
          }
          if (isTelegramNotModifiedError(err)) {
            // ignore
          } else {
            throw err;
          }
        }
      }
    }

    await bot.answerCallbackQuery(query.id);
  });

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
          "❌ Usage: /admin_add_coins &lt;user_id&gt; &lt;amount&gt;"
        );
        return;
      }

      const args = match[1].split(" ");
      if (args.length !== 2) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Usage: /admin_add_coins &lt;user_id&gt; &lt;amount&gt;"
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
          "❌ Usage: /admin_remove_coins &lt;user_id&gt; &lt;amount&gt;"
        );
        return;
      }

      const args = match[1].split(" ");
      if (args.length !== 2) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Usage: /admin_remove_coins &lt;user_id&gt; &lt;amount&gt;"
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
          "❌ Usage: /admin_set_coins &lt;user_id&gt; &lt;amount&gt;"
        );
        return;
      }

      const args = match[1].split(" ");
      if (args.length !== 2) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Usage: /admin_set_coins &lt;user_id&gt; &lt;amount&gt;"
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
          "❌ Usage: /admin_view_coins &lt;user_id&gt;"
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
          "❌ Usage: /admin_view_stats &lt;user_id&gt;"
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
      `• /admin_add_coins &lt;user_id&gt; &lt;amount&gt; - Add coins\n` +
      `• /admin_remove_coins &lt;user_id&gt; &lt;amount&gt; - Remove coins\n` +
      `• /admin_set_coins &lt;user_id&gt; &lt;amount&gt; - Set exact amount\n` +
      `• /admin_view_coins &lt;user_id&gt; - View balance\n\n` +
      `📊 <b>Statistics:</b>\n` +
      `• /admin_view_stats &lt;user_id&gt; - View all game stats\n\n` +
      `📝 <b>Examples:</b>\n` +
      `• /admin_add_coins 123456789 100\n` +
      `• /admin_view_coins 123456789\n` +
      `• /admin_view_stats 123456789`;

    await bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: "HTML" });
  });

  // Add a /myid command for users to get their own user ID
  bot.onText(/\/myid/, async (msg: TelegramBot.Message) => {
    const userId = msg.from?.id?.toString();
    if (!userId) {
      await bot.sendMessage(msg.chat.id, "❌ Unable to identify your user ID.");
      return;
    }
    await bot.sendMessage(
      msg.chat.id,
      `🆔 Your User ID: <code>${userId}</code>`,
      { parse_mode: "HTML" }
    );
  });

  // Add /find_user <username|name> command for admins
  bot.onText(
    /\/find_user (.+)/,
    async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
      const userId = msg.from?.id?.toString();
      if (!userId || !isAdmin(userId)) {
        await bot.sendMessage(msg.chat.id, "❌ Access denied. Admin only.");
        return;
      }
      if (!match || !match[1]) {
        await bot.sendMessage(
          msg.chat.id,
          "❌ Usage: /find_user <username|name>"
        );
        return;
      }
      const query = match[1].trim().toLowerCase();
      // Search all users in the database
      try {
        const db = getDatabase();
        const usersRef = dbRef(db, "users");
        const snap = await dbGet(usersRef);
        if (!snap.exists()) {
          await bot.sendMessage(msg.chat.id, "❌ No users found.");
          return;
        }
        const users = snap.val();
        let found: { id: string; username?: string; name?: string } | null =
          null;
        for (const [id, user] of Object.entries(users)) {
          if (typeof user === "object" && user !== null) {
            const u = user as { username?: string; name?: string };
            if (
              (u.username && u.username.toLowerCase() === query) ||
              (u.name && u.name.toLowerCase() === query)
            ) {
              found = { id, ...u };
              break;
            }
          }
        }
        if (found) {
          await bot.sendMessage(
            msg.chat.id,
            `🆔 User Found\n\nID: ${found.id}\nUsername: ${
              found.username || "-"
            }\nName: ${found.name || "-"}`
          );
        } else {
          await bot.sendMessage(
            msg.chat.id,
            "❌ User not found by username or name."
          );
        }
      } catch (err) {
        console.error("[ADMIN] Error finding user:", err);
        await bot.sendMessage(msg.chat.id, "❌ Error searching for user.");
      }
    }
  );
}
