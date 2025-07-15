import { getBlackjackStats } from "./blackjack";
import TelegramBot from "node-telegram-bot-api";

/**
 * Registers all blackjack game Telegram bot handlers
 * @param bot - The TelegramBot instance
 */
export function registerBlackjackHandlers(bot: TelegramBot) {
  console.log(
    "[BLACKJACK] registerBlackjackHandlers called. Registering blackjack game handlers..."
  );

  // /blackjack_game command
  bot.onText(/\/blackjack_game/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) {
      await bot.sendMessage(chatId, "❌ Unable to identify user");
      return;
    }

    const stakeKeyboard = {
      inline_keyboard: [
        [
          { text: "2 Coins", callback_data: `blackjack_stake:2` },
          { text: "5 Coins", callback_data: `blackjack_stake:5` },
        ],
        [
          { text: "10 Coins", callback_data: `blackjack_stake:10` },
          { text: "20 Coins", callback_data: `blackjack_stake:20` },
        ],
      ],
    };

    await bot.sendMessage(
      chatId,
      "🃏 Blackjack Game\n\nChoose your stake amount:",
      { reply_markup: stakeKeyboard }
    );
  });

  // /blackjack_stats command
  bot.onText(/\/blackjack_stats/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) {
      await bot.sendMessage(chatId, "❌ Unable to identify user");
      return;
    }

    try {
      const stats = await getBlackjackStats(userId.toString());
      const winRate =
        stats.totalGames > 0
          ? Math.round((stats.totalWins / stats.totalGames) * 100)
          : 0;

      const message =
        `📊 Your Blackjack Stats:\n\n` +
        `🃏 Games Played: ${stats.totalGames}\n` +
        `🏆 Wins: ${stats.totalWins}\n` +
        `📈 Win Rate: ${winRate}%\n` +
        `💰 Total Winnings: ${stats.totalWinnings} Coins`;

      await bot.sendMessage(chatId, message);
    } catch (error: unknown) {
      console.error(
        `[BLACKJACK] /blackjack_stats error for userId=${userId}:`,
        error
      );
      await bot.sendMessage(chatId, "❌ Failed to fetch your blackjack stats.");
    }
  });

  // Inline query handler for blackjack game
  bot.on("inline_query", async (inlineQuery: TelegramBot.InlineQuery) => {
    const query = inlineQuery.query;
    const userId = inlineQuery.from?.id;

    if (!userId) return;

    // Handle blackjack game inline queries
    if (query === "blackjack" || query === "blackjack_game" || query === "🃏") {
      const results: TelegramBot.InlineQueryResult[] = [
        {
          type: "article",
          id: "blackjack_game",
          title: "🃏 Blackjack Game",
          description: "Play blackjack against the dealer!",
          input_message_content: {
            message_text:
              "🃏 Blackjack Game\n\nChoose your stake to start playing!",
          },
          reply_markup: {
            inline_keyboard: [
              [
                { text: "2 Coins", callback_data: `blackjack_stake:2` },
                { text: "5 Coins", callback_data: `blackjack_stake:5` },
              ],
              [
                { text: "10 Coins", callback_data: `blackjack_stake:10` },
                { text: "20 Coins", callback_data: `blackjack_stake:20` },
              ],
            ],
          },
        },
      ];

      await bot.answerInlineQuery(inlineQuery.id, results);
    }
  });
}
