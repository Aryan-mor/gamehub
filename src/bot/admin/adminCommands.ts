import TelegramBot from "node-telegram-bot-api";
import { adjustCoins, getUserCoins } from "../../lib/coinService";
import { getBlackjackStats } from "../games/blackjack";
import { getDiceStats } from "../games/dice";
import { getFootballStats } from "../games/football";
import { getBasketballStats } from "../games/basketball";
import {
  getAllSponsorChannels,
  addSponsorChannel,
  updateSponsorChannel,
  removeSponsorChannel,
} from "../../lib/gameService";

// Admin user IDs - add your admin user IDs here
const ADMIN_USER_IDS = [
  "68169486", // Replace with actual admin user IDs
  // Add more admin IDs as needed
];

export function isAdmin(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId);
}

// In-memory state for sponsor add flow per admin
const sponsorAddState: Record<
  string,
  { step: number; name?: string; link?: string; editId?: string }
> = {};

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
        [
          {
            text: "🏷️ Sponsor Channels",
            callback_data: "admin_sponsors_panel",
          },
        ],
        [
          {
            text: "🔍 Check Bot Permissions",
            callback_data: "admin_check_bot_permissions",
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
      await bot.answerCallbackQuery(query.id); // No toast
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
          [
            {
              text: "🏷️ Sponsor Channels",
              callback_data: "admin_sponsors_panel",
            },
          ],
          [
            {
              text: "🔍 Check Bot Permissions",
              callback_data: "admin_check_bot_permissions",
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
    } else if (data === "admin_sponsors_panel") {
      // Show sponsor management panel (names only)
      const sponsors = await getAllSponsorChannels();
      let text = "<b>Manage Sponsor Channels</b>\n\n";
      if (sponsors.length === 0) {
        text += "No sponsor channels found.";
      } else {
        text += "Click a sponsor name to manage it.";
      }
      const keyboard: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [] as unknown as TelegramBot.InlineKeyboardButton[][],
      };
      for (const sponsor of sponsors) {
        keyboard.inline_keyboard.push([
          {
            text: sponsor.name,
            callback_data: `admin_sponsor_details:${sponsor.id}`,
          },
        ]);
      }
      keyboard.inline_keyboard.push([
        { text: "➕ Add Sponsor", callback_data: "admin_add_sponsor" },
        {
          text: "🔙 Back to Admin Panel",
          callback_data: "admin_back_to_panel",
        },
      ]);
      await bot.sendMessage(query.message!.chat.id, text, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
    } else if (data === "admin_add_sponsor") {
      sponsorAddState[userId] = { step: 1 };
      await bot.sendMessage(
        query.message!.chat.id,
        "Please send the sponsor <b>name</b> as a message.",
        { parse_mode: "HTML" }
      );
      return;
    } else if (data.startsWith("admin_sponsor_details:")) {
      const sponsorId = data.split(":")[1];
      const sponsors = await getAllSponsorChannels();
      const sponsor = sponsors.find((s) => s.id === sponsorId);
      if (!sponsor) {
        await bot.answerCallbackQuery(query.id, { text: "Sponsor not found." });
        return;
      }
      let text = `<b>${sponsor.name}</b>\n\n`;
      text += `<b>Link:</b> <a href='${sponsor.link}'>${sponsor.link}</a>\n`;
      text += `<b>Preview:</b> ${sponsor.previewText}`;
      const keyboard: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [] as unknown as TelegramBot.InlineKeyboardButton[][],
      };
      keyboard.inline_keyboard.push([
        { text: "✏️ Edit", callback_data: `admin_edit_sponsor:${sponsor.id}` },
        {
          text: "❌ Remove",
          callback_data: `admin_remove_sponsor:${sponsor.id}`,
        },
        { text: "🔗 Open Link", url: sponsor.link },
      ]);
      keyboard.inline_keyboard.push([
        { text: "🔙 Back", callback_data: "admin_sponsors_panel" },
      ]);
      await bot.editMessageText(text, {
        chat_id: query.message?.chat.id,
        message_id: query.message?.message_id,
        parse_mode: "HTML",
        disable_web_page_preview: false,
        reply_markup: keyboard,
      });
      return;
    } else if (data.startsWith("admin_edit_sponsor:")) {
      const sponsorId = data.split(":")[1];
      const sponsors = await getAllSponsorChannels();
      const sponsor = sponsors.find((s) => s.id === sponsorId);
      if (!sponsor) {
        await bot.answerCallbackQuery(query.id, { text: "Sponsor not found." });
        return;
      }
      sponsorAddState[userId] = {
        step: 10,
        editId: sponsor.id,
        name: sponsor.name,
        link: sponsor.link,
      };
      await bot.sendMessage(
        query.message!.chat.id,
        `Editing sponsor: <b>${sponsor.name}</b>\n\nSend new name (or send the same name to keep unchanged):`,
        { parse_mode: "HTML" }
      );
      return;
    } else if (data.startsWith("admin_remove_sponsor:")) {
      const sponsorId = data.split(":")[1];
      const sponsors = await getAllSponsorChannels();
      const sponsor = sponsors.find((s) => s.id === sponsorId);
      if (!sponsor) {
        await bot.answerCallbackQuery(query.id, { text: "Sponsor not found." });
        return;
      }
      const keyboard: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [
          [
            {
              text: "❌ Confirm Remove",
              callback_data: `admin_remove_sponsor_confirm:${sponsor.id}`,
            },
            {
              text: "🔙 Cancel",
              callback_data: "admin_sponsor_details:" + sponsor.id,
            },
          ],
        ],
      };
      await bot.editMessageText(
        `Are you sure you want to remove sponsor <b>${sponsor.name}</b>?`,
        {
          chat_id: query.message?.chat.id,
          message_id: query.message?.message_id,
          parse_mode: "HTML",
          reply_markup: keyboard,
        }
      );
      return;
    } else if (data.startsWith("admin_remove_sponsor_confirm:")) {
      const sponsorId = data.split(":")[1];
      await removeSponsorChannel(sponsorId);
      await bot.editMessageText("✅ Sponsor removed.", {
        chat_id: query.message?.chat.id,
        message_id: query.message?.message_id,
      });
      // Refresh panel
      const sponsors = await getAllSponsorChannels();
      let text = "<b>Manage Sponsor Channels</b>\n\n";
      if (sponsors.length === 0) {
        text += "No sponsor channels found.";
      } else {
        text += "Click a sponsor name to manage it.";
      }
      const keyboard: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [] as unknown as TelegramBot.InlineKeyboardButton[][],
      };
      for (const sponsor of sponsors) {
        keyboard.inline_keyboard.push([
          {
            text: sponsor.name,
            callback_data: `admin_sponsor_details:${sponsor.id}`,
          },
        ]);
      }
      keyboard.inline_keyboard.push([
        { text: "➕ Add Sponsor", callback_data: "admin_add_sponsor" },
        {
          text: "🔙 Back to Admin Panel",
          callback_data: "admin_back_to_panel",
        },
      ]);
      await bot.sendMessage(query.message!.chat.id, text, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
      return;
    } else if (data === "admin_check_bot_permissions") {
      // Check bot's admin status in all sponsor channels
      const sponsors = await getAllSponsorChannels();
      if (sponsors.length === 0) {
        await bot.sendMessage(
          query.message!.chat.id,
          "No sponsor channels found."
        );
        return;
      }
      let text = "<b>Bot Permissions in Sponsor Channels</b>\n\n";
      for (const sponsor of sponsors) {
        try {
          // Try to get chat member info for the bot itself
          const me = await bot.getMe();
          const member = await bot.getChatMember(
            sponsor.link.includes("t.me/+")
              ? sponsor.link.match(/t\.me\/(\+.+)$/)?.[1] || ""
              : "@" + (sponsor.link.match(/t\.me\/([A-Za-z0-9_]+)/)?.[1] || ""),
            Number(me.id)
          );
          if (["administrator", "creator"].includes(member.status)) {
            text += `✅ <b>${sponsor.name}</b>: Bot is admin\n`;
          } else {
            text += `⚠️ <b>${sponsor.name}</b>: Bot is NOT admin (status: ${member.status})\n`;
          }
        } catch {
          text += `❌ <b>${sponsor.name}</b>: Unable to check (bot may not be in channel)\n`;
        }
      }
      await bot.sendMessage(query.message!.chat.id, text, {
        parse_mode: "HTML",
      });
      return;
    }

    await bot.answerCallbackQuery(query.id);
  });

  // Listen for admin sponsor add flow messages
  bot.on("message", async (msg) => {
    const userId = msg.from?.id?.toString();
    if (!userId || !isAdmin(userId)) return;
    if (!sponsorAddState[userId]) return;
    const state = sponsorAddState[userId];
    if (state.step === 1) {
      // Got name, ask for link
      sponsorAddState[userId] = { step: 2, name: msg.text };
      await bot.sendMessage(
        msg.chat.id,
        "Now send the sponsor channel link (https://t.me/...) as a message."
      );
      return;
    } else if (state.step === 2 && state.name) {
      // Got link, ask for preview text
      sponsorAddState[userId] = { step: 3, name: state.name, link: msg.text };
      await bot.sendMessage(
        msg.chat.id,
        "Now send the preview text for this sponsor channel."
      );
      return;
    } else if (state.step === 3 && state.name && state.link) {
      // Got preview text, confirm and save
      const name = state.name;
      const link = state.link;
      const previewText = msg.text || "";
      await addSponsorChannel(name, link, previewText);
      delete sponsorAddState[userId];
      await bot.sendMessage(
        msg.chat.id,
        `✅ Sponsor channel added!\nName: ${name}\nLink: ${link}\nPreview: ${previewText}`
      );
      // Refresh the sponsor panel
      const sponsors = await getAllSponsorChannels();
      let text = "<b>Manage Sponsor Channels</b>\n\n";
      if (sponsors.length === 0) {
        text += "No sponsor channels found.";
      } else {
        text += "Click a sponsor name to manage it.";
      }
      const keyboard: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [] as unknown as TelegramBot.InlineKeyboardButton[][],
      };
      for (const sponsor of sponsors) {
        keyboard.inline_keyboard.push([
          {
            text: sponsor.name,
            callback_data: `admin_sponsor_details:${sponsor.id}`,
          },
        ]);
      }
      keyboard.inline_keyboard.push([
        { text: "➕ Add Sponsor", callback_data: "admin_add_sponsor" },
        {
          text: "🔙 Back to Admin Panel",
          callback_data: "admin_back_to_panel",
        },
      ]);
      await bot.sendMessage(msg.chat.id, text, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
      return;
    } else if (state.step === 10 && state.editId) {
      // Editing: got new name, ask for new link
      sponsorAddState[userId] = {
        step: 11,
        editId: state.editId,
        name: msg.text,
      };
      await bot.sendMessage(
        msg.chat.id,
        "Now send the new sponsor channel link (or send the same link to keep unchanged)."
      );
      return;
    } else if (state.step === 11 && state.editId && state.name) {
      // Editing: got new link, ask for new preview text
      sponsorAddState[userId] = {
        step: 12,
        editId: state.editId,
        name: state.name,
        link: msg.text,
      };
      await bot.sendMessage(
        msg.chat.id,
        "Now send the new preview text (or send the same to keep unchanged)."
      );
      return;
    } else if (state.step === 12 && state.editId && state.name && state.link) {
      // Editing: got new preview text, update sponsor
      const sponsors = await getAllSponsorChannels();
      const sponsor = sponsors.find((s) => s.id === state.editId);
      const link = state.link || sponsor?.link || "";
      const previewText = msg.text || sponsor?.previewText || "";
      await updateSponsorChannel(state.editId, state.name, link, previewText);
      delete sponsorAddState[userId];
      await bot.sendMessage(
        msg.chat.id,
        `✅ Sponsor updated!\nName: ${state.name}\nLink: ${link}\nPreview: ${previewText}`
      );
      // Refresh panel
      const allSponsors = await getAllSponsorChannels();
      let text = "<b>Manage Sponsor Channels</b>\n\n";
      if (allSponsors.length === 0) {
        text += "No sponsor channels found.";
      } else {
        text += "Click a sponsor name to manage it.";
      }
      const keyboard: TelegramBot.InlineKeyboardMarkup = {
        inline_keyboard: [] as unknown as TelegramBot.InlineKeyboardButton[][],
      };
      for (const s of allSponsors) {
        keyboard.inline_keyboard.push([
          { text: s.name, callback_data: `admin_sponsor_details:${s.id}` },
        ]);
      }
      keyboard.inline_keyboard.push([
        { text: "➕ Add Sponsor", callback_data: "admin_add_sponsor" },
        {
          text: "🔙 Back to Admin Panel",
          callback_data: "admin_back_to_panel",
        },
      ]);
      await bot.sendMessage(msg.chat.id, text, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
      return;
    }
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
}
