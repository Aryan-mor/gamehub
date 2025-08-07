import { Context } from 'grammy';
import { SmartReplyOptions } from '../types';
import { GameHubContext, GameHubPlugin, ContextBuilder } from './context';

/**
 * Smart Reply Plugin
 * Provides intelligent message editing and reply functionality
 */
export class SmartReplyPlugin implements GameHubPlugin {
  name = 'smart-reply';
  version = '1.0.0';

  buildContext: ContextBuilder = (ctx: Context): Partial<GameHubContext> => {
    return {
      replySmart: async (text: string, options: SmartReplyOptions = {}): Promise<void> => {
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
      }
    };
  };

  middleware = async (ctx: GameHubContext, next: () => Promise<void>): Promise<void> => {
    // Smart reply functionality is already added via buildContext
    await next();
  };
}

// Legacy function for backward compatibility
export function smartReplyPlugin(): (ctx: GameHubContext, next: () => Promise<void>) => Promise<void> {
  const plugin = new SmartReplyPlugin();
  return plugin.middleware;
}

// Export plugin instance
export const smartReplyPluginInstance = new SmartReplyPlugin(); 