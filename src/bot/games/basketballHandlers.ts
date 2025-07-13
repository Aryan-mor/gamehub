import TelegramBot from "node-telegram-bot-api";
import { getBasketballStats } from "./basketball";

/**
 * Registers all basketball game Telegram bot handlers
 * @param bot - The TelegramBot instance
 */
export function registerBasketballHandlers(bot: TelegramBot) {
  console.log(
    "[BASKETBALL] registerBasketballHandlers called. Registering basketball game handlers..."
  );

  // /basketball_game command
  bot.onText(/\/basketball_game/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) {
      await bot.sendMessage(chatId, "❌ Unable to identify user");
      return;
    }

    const stakeKeyboard = {
      inline_keyboard: [
        [
          { text: "2 Coins", callback_data: `basketball_stake:2` },
          { text: "5 Coins", callback_data: `basketball_stake:5` },
        ],
        [
          { text: "10 Coins", callback_data: `basketball_stake:10` },
          { text: "20 Coins", callback_data: `basketball_stake:20` },
        ],
      ],
    };

    await bot.sendMessage(
      chatId,
      "🏀 Hoop Shot Game\n\nChoose your stake amount:",
      { reply_markup: stakeKeyboard }
    );
  });

  // /basketball_stats command
  bot.onText(/\/basketball_stats/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) {
      await bot.sendMessage(chatId, "❌ Unable to identify user");
      return;
    }

    try {
      const stats = await getBasketballStats(userId.toString());
      const winRate =
        stats.totalGames > 0
          ? Math.round((stats.totalWins / stats.totalGames) * 100)
          : 0;

      const message =
        `📊 Your Basketball Game Stats:\n\n` +
        `🏀 Games Played: ${stats.totalGames}\n` +
        `🏆 Wins: ${stats.totalWins}\n` +
        `📈 Win Rate: ${winRate}%\n` +
        `💰 Total Winnings: ${stats.totalWinnings} Coins`;

      await bot.sendMessage(chatId, message);
    } catch (error: unknown) {
      console.error(
        `[BASKETBALL] /basketball_stats error for userId=${userId}:`,
        error
      );
      await bot.sendMessage(
        chatId,
        "❌ Failed to fetch your basketball stats."
      );
    }
  });

  // Inline query handler for basketball game
  bot.on("inline_query", async (inlineQuery: TelegramBot.InlineQuery) => {
    const query = inlineQuery.query;
    const userId = inlineQuery.from?.id;

    if (!userId) return;

    // Handle basketball game inline queries
    if (
      query === "basketball" ||
      query === "basketball_game" ||
      query === "🏀"
    ) {
      const results: TelegramBot.InlineQueryResult[] = [
        {
          type: "article",
          id: "basketball_game",
          title: "🏀 Hoop Shot Game",
          description: "Try to score a basket and win coins!",
          input_message_content: {
            message_text:
              "🏀 Hoop Shot Game\n\nChoose your stake to start playing!",
          },
          reply_markup: {
            inline_keyboard: [
              [
                { text: "2 Coins", callback_data: `basketball_stake:2` },
                { text: "5 Coins", callback_data: `basketball_stake:5` },
              ],
              [
                { text: "10 Coins", callback_data: `basketball_stake:10` },
                { text: "20 Coins", callback_data: `basketball_stake:20` },
              ],
            ],
          },
        },
      ];

      await bot.answerInlineQuery(inlineQuery.id, results);
    }
  });
}
