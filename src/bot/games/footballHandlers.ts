import TelegramBot from "node-telegram-bot-api";
import { getFootballStats } from "./football";

/**
 * Registers all football game Telegram bot handlers
 * @param bot - The TelegramBot instance
 */
export function registerFootballHandlers(bot: TelegramBot) {
  console.log(
    "[FOOTBALL] registerFootballHandlers called. Registering football game handlers..."
  );

  // /football_game command
  bot.onText(/\/football_game/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) {
      await bot.sendMessage(chatId, "❌ Unable to identify user");
      return;
    }

    const stakeKeyboard = {
      inline_keyboard: [
        [
          { text: "2 Coins", callback_data: `football_stake:2` },
          { text: "5 Coins", callback_data: `football_stake:5` },
        ],
        [
          { text: "10 Coins", callback_data: `football_stake:10` },
          { text: "20 Coins", callback_data: `football_stake:20` },
        ],
      ],
    };

    await bot.sendMessage(
      chatId,
      "⚽️ Direction Guess Game\n\nChoose your stake amount:",
      { reply_markup: stakeKeyboard }
    );
  });

  // /football_stats command
  bot.onText(/\/football_stats/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) {
      await bot.sendMessage(chatId, "❌ Unable to identify user");
      return;
    }

    try {
      const stats = await getFootballStats(userId.toString());
      const winRate =
        stats.totalGames > 0
          ? Math.round((stats.totalWins / stats.totalGames) * 100)
          : 0;

      const message =
        `📊 Your Football Game Stats:\n\n` +
        `⚽️ Games Played: ${stats.totalGames}\n` +
        `🏆 Wins: ${stats.totalWins}\n` +
        `📈 Win Rate: ${winRate}%\n` +
        `💰 Total Winnings: ${stats.totalWinnings} Coins`;

      await bot.sendMessage(chatId, message);
    } catch (error: unknown) {
      console.error(
        `[FOOTBALL] /football_stats error for userId=${userId}:`,
        error
      );
      await bot.sendMessage(chatId, "❌ Failed to fetch your football stats.");
    }
  });

  // Inline query handler for football game
  bot.on("inline_query", async (inlineQuery: TelegramBot.InlineQuery) => {
    const query = inlineQuery.query;
    const userId = inlineQuery.from?.id;

    if (!userId) return;

    // Handle football game inline queries
    if (query === "football" || query === "football_game" || query === "⚽️") {
      const results: TelegramBot.InlineQueryResult[] = [
        {
          type: "article",
          id: "football_game",
          title: "⚽️ Direction Guess Game",
          description: "Guess the ball direction and win coins!",
          input_message_content: {
            message_text:
              "⚽️ Direction Guess Game\n\nChoose your stake to start playing!",
          },
          reply_markup: {
            inline_keyboard: [
              [
                { text: "2 Coins", callback_data: `football_stake:2` },
                { text: "5 Coins", callback_data: `football_stake:5` },
              ],
              [
                { text: "10 Coins", callback_data: `football_stake:10` },
                { text: "20 Coins", callback_data: `football_stake:20` },
              ],
            ],
          },
        },
      ];

      await bot.answerInlineQuery(inlineQuery.id, results);
    }
  });
}
