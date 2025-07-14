const TelegramBot = require("node-telegram-bot-api");

const token = "8068742132:AAHGIQ4paoJfwklu_-vJej7EOrefqFWC49I";
const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Test bot starting...");
console.log("📝 Bot token:", token);

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const from = msg.from;

  console.log("📨 Received message:", {
    chatId,
    text,
    from: from.username || from.first_name,
    userId: from.id,
  });

  // Respond to any message
  bot
    .sendMessage(chatId, `✅ Bot is working! You sent: "${text}"`)
    .then(() => console.log("✅ Response sent successfully"))
    .catch((err) => console.error("❌ Error sending response:", err));
});

bot.on("polling_error", (error) => {
  console.error("❌ Polling error:", error);
});

bot.on("error", (error) => {
  console.error("❌ Bot error:", error);
});

console.log("🚀 Test bot is running. Send a message to your bot!");
