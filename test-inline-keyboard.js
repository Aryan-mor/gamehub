import TelegramBot from "node-telegram-bot-api";

const token = "7944471391:AAFUW7KWWWJxbpFOT-kjUqPfvhLsrl_WcUI";
const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Test inline keyboard bot starting...");

bot.onText(/\/test/, async (msg) => {
  const chatId = msg.chat.id;
  console.log(`[TEST] /test received from chatId=${chatId}`);

  const testKeyboard = {
    inline_keyboard: [
      [
        { text: "🎮 Test Button 1", callback_data: "test1" },
        { text: "🪙 Test Button 2", callback_data: "test2" },
      ],
      [
        { text: "❓ Test Button 3", callback_data: "test3" },
        { text: "💰 Test Button 4", callback_data: "test4" },
      ],
    ],
  };

  console.log(
    `[TEST] Sending test keyboard:`,
    JSON.stringify(testKeyboard, null, 2)
  );

  try {
    await bot.sendMessage(chatId, "🧪 Testing inline keyboard...", {
      reply_markup: testKeyboard,
    });
    console.log(`[TEST] Test message sent successfully`);
  } catch (error) {
    console.error(`[TEST] Error sending test message:`, error);
  }
});

bot.on("callback_query", async (callbackQuery) => {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message?.chat.id;
  const userId = callbackQuery.from?.id;

  console.log(
    `[TEST] Callback query received: data=${data}, userId=${userId}, chatId=${chatId}`
  );

  await bot.answerCallbackQuery(callbackQuery.id, {
    text: `You clicked: ${data}`,
  });

  if (chatId && callbackQuery.message?.message_id) {
    await bot.editMessageText(`✅ You clicked: ${data}`, {
      chat_id: chatId,
      message_id: callbackQuery.message.message_id,
    });
  }
});

bot.on("polling_error", (error) => {
  console.error("❌ Polling error:", error);
});

bot.on("error", (error) => {
  console.error("❌ Bot error:", error);
});

console.log("🚀 Test bot is running. Send /test to test inline keyboards!");
