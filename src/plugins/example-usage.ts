import { Bot } from "grammy";
import { smartReplyPlugin } from "./smart-reply";
import { SmartContext } from "../types";

// Example of how to use the smart reply plugin
export function setupSmartReplyExample(bot: Bot<SmartContext>): void {
  // Register the smart reply plugin
  bot.use(smartReplyPlugin());

  // Example command handler using replySmart
  bot.command("test", async (ctx) => {
    // This will try to edit the current message if possible, otherwise send a new one
    await ctx.replySmart("Hello! This is a test message.", {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Click me!", callback_data: "test_button" }]
        ]
      }
    });
  });

  // Example callback query handler
  bot.callbackQuery("test_button", async (ctx) => {
    // This will edit the message that triggered the callback
    await ctx.replySmart("Button clicked! Message updated.", {
      parse_mode: "HTML"
    });
  });
} 