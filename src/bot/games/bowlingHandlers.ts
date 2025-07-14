import TelegramBot from "node-telegram-bot-api";
import { getBowlingStats } from "./bowling";
// addBotIdToMessage is not available; use identity function
const addBotIdToMessage = (msg: string) => msg;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const hasUserStartedBot = async (_unusedUserId: string) => true; // TODO: Implement actual check

/**
 * Registers all bowling game Telegram bot handlers
 * @param bot - The TelegramBot instance
 */
export function registerBowlingHandlers(bot: TelegramBot) {
  console.log(
    "[BOWLING] registerBowlingHandlers called. Registering bowling game handlers..."
  );

  // /bowling_game command
  bot.onText(/\/bowling_game/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) {
      await bot.sendMessage(
        chatId,
        addBotIdToMessage("❌ Unable to identify user"),
        { parse_mode: "HTML" }
      );
      return;
    }

    // Check if user has started the bot
    const hasStarted = await hasUserStartedBot(userId.toString());
    if (!hasStarted) {
      await bot.sendMessage(
        chatId,
        addBotIdToMessage(
          "🚫 <b>Please start the bot first!</b>\n\nUse /start to begin using GameHub and get your initial coins."
        ),
        { parse_mode: "HTML" }
      );
      return;
    }

    const stakeKeyboard = {
      inline_keyboard: [
        [
          { text: "2 Coins", callback_data: `bowling_stake:2` },
          { text: "5 Coins", callback_data: `bowling_stake:5` },
        ],
        [
          { text: "10 Coins", callback_data: `bowling_stake:10` },
          { text: "20 Coins", callback_data: `bowling_stake:20` },
        ],
      ],
    };

    await bot.sendMessage(
      chatId,
      addBotIdToMessage("🎳 Bowling Challenge\n\nChoose your stake amount:"),
      { reply_markup: stakeKeyboard }
    );
  });

  // /bowling_stats command
  bot.onText(/\/bowling_stats/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) {
      await bot.sendMessage(
        chatId,
        addBotIdToMessage("❌ Unable to identify user"),
        { parse_mode: "HTML" }
      );
      return;
    }

    try {
      const stats = await getBowlingStats(userId.toString());
      const winRate =
        stats.totalGames > 0
          ? Math.round((stats.totalWins / stats.totalGames) * 100)
          : 0;

      const message =
        `📊 Your Bowling Game Stats:\n\n` +
        `🎳 Games Played: ${stats.totalGames}\n` +
        `🏆 Wins: ${stats.totalWins}\n` +
        `📈 Win Rate: ${winRate}%\n` +
        `💰 Total Winnings: ${stats.totalWinnings} Coins`;

      await bot.sendMessage(chatId, addBotIdToMessage(message), {
        parse_mode: "HTML",
      });
    } catch (error: unknown) {
      console.error(
        `[BOWLING] /bowling_stats error for userId=${userId}:`,
        error
      );
      await bot.sendMessage(
        chatId,
        addBotIdToMessage("❌ Failed to fetch your bowling stats."),
        { parse_mode: "HTML" }
      );
    }
  });

  // Inline query handler for bowling game
  bot.on("inline_query", async (inlineQuery: TelegramBot.InlineQuery) => {
    const query = inlineQuery.query;
    const userId = inlineQuery.from?.id;

    if (!userId) return;

    // Handle bowling game inline queries
    if (query === "bowling" || query === "bowling_game" || query === "🎳") {
      const results: TelegramBot.InlineQueryResult[] = [
        {
          type: "article",
          id: "bowling_game",
          title: "🎳 Bowling Challenge",
          description: "Roll the ball and knock down pins to win coins!",
          input_message_content: {
            message_text:
              "🎳 Bowling Challenge\n\nChoose your stake to start playing!",
          },
          reply_markup: {
            inline_keyboard: [
              [
                { text: "2 Coins", callback_data: `bowling_stake:2` },
                { text: "5 Coins", callback_data: `bowling_stake:5` },
              ],
              [
                { text: "10 Coins", callback_data: `bowling_stake:10` },
                { text: "20 Coins", callback_data: `bowling_stake:20` },
              ],
            ],
          },
        },
      ];

      await bot.answerInlineQuery(inlineQuery.id, results);
    }
  });
}
