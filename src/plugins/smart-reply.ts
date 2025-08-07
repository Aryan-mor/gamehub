import { SmartContext } from "../types";

export function smartReplyPlugin(): (ctx: SmartContext, next: () => Promise<void>) => Promise<void> {
  return async (ctx: SmartContext, next: () => Promise<void>): Promise<void> => {
    ctx.replySmart = async (text, options = {}): Promise<void> => {
      const chatId = options.chatId ?? ctx.chat?.id;
      const messageId =
        options.messageId ??
        ctx.callbackQuery?.message?.message_id ??
        ctx.msg?.message_id;

      if (!chatId) {
        throw new Error("chatId is required");
      }

      try {
        if (messageId) {
          await ctx.api.editMessageText(chatId, messageId, text, {
            reply_markup: options.reply_markup,
            parse_mode: options.parse_mode,
          });
          return;
        }
      } catch (err) {
        // اگر نشد، حذف می‌کنیم
        console.log('Failed to edit message, falling back to reply:', err);
        try {
          if (messageId) {
            await ctx.api.deleteMessage(chatId, messageId);
          }
        } catch {
          // حذف هم نشد؟ مشکلی نیست، ادامه می‌دیم
        }
      }

      await ctx.reply(text, {
        reply_markup: options.reply_markup,
        parse_mode: options.parse_mode,
      });
    };

    await next();
  };
} 