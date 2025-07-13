import { getDiceStats } from "./dice";

/**
 * Registers all dice game Telegram bot handlers
 * @param bot - The TelegramBot instance
 */
export function registerDiceHandlers(bot: any) {
  console.log(
    "[DICE] registerDiceHandlers called. Registering dice game handlers..."
  );

  // /dice_game command
  bot.onText(/\/dice_game/, async (msg: any) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) {
      await bot.sendMessage(chatId, "❌ Unable to identify user");
      return;
    }

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
      { reply_markup: stakeKeyboard }
    );
  });

  // /dice_stats command
  bot.onText(/\/dice_stats/, async (msg: any) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) {
      await bot.sendMessage(chatId, "❌ Unable to identify user");
      return;
    }

    try {
      const stats = await getDiceStats(userId.toString());
      const winRate =
        stats.totalGames > 0
          ? Math.round((stats.totalWins / stats.totalGames) * 100)
          : 0;

      const message =
        `📊 Your Dice Game Stats:\n\n` +
        `🎲 Games Played: ${stats.totalGames}\n` +
        `🏆 Wins: ${stats.totalWins}\n` +
        `📈 Win Rate: ${winRate}%\n` +
        `💰 Total Winnings: ${stats.totalWinnings} Coins`;

      await bot.sendMessage(chatId, message);
    } catch (error: any) {
      console.error(`[DICE] /dice_stats error for userId=${userId}:`, error);
      await bot.sendMessage(chatId, "❌ Failed to fetch your dice stats.");
    }
  });

  // Inline query handler for dice game
  bot.on("inline_query", async (inlineQuery: any) => {
    const query = inlineQuery.query;
    const userId = inlineQuery.from?.id;

    if (!userId) return;

    // Handle dice game inline queries
    if (query === "dice" || query === "dice_game" || query === "🎲") {
      const results = [
        {
          type: "article",
          id: "dice_game",
          title: "🎲 Dice Guess Game",
          description: "Guess the dice roll and win coins!",
          input_message_content: {
            message_text:
              "🎲 Dice Guess Game\n\nChoose your stake to start playing!",
          },
          reply_markup: {
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
          },
        },
      ];

      await bot.answerInlineQuery(inlineQuery.id, results);
    }
  });
}
