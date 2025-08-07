import { Context, Bot } from 'grammy';
import { GameHubContext, GameHubPlugin, ContextBuilder } from './context';

/**
 * Telegram Plugin
 * Provides telegram API helper functions
 */
export class TelegramPlugin implements GameHubPlugin {
  name = 'telegram';
  version = '1.0.0';

  buildContext: ContextBuilder = (ctx: Context): Partial<GameHubContext> => {
    return {
      telegram: {
        sendMessage: async (
          chatId: number,
          text: string,
          options?: {
            parseMode?: 'HTML' | 'Markdown';
            replyMarkup?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
          }
        ): Promise<void> => {
          await ctx.api.sendMessage(chatId, text, {
            ...(options?.parseMode && { parse_mode: options.parseMode }),
            ...(options?.replyMarkup && { reply_markup: options.replyMarkup }),
          });
        },
        editMessage: async (
          chatId: number,
          messageId: number,
          text: string,
          options?: {
            parseMode?: 'HTML' | 'Markdown';
            replyMarkup?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
          }
        ): Promise<void> => {
          await ctx.api.editMessageText(chatId, messageId, text, {
            ...(options?.parseMode && { parse_mode: options.parseMode }),
            ...(options?.replyMarkup && { reply_markup: options.replyMarkup }),
          });
        },
        answerCallbackQuery: async (
          callbackQueryId: string,
          text?: string
        ): Promise<void> => {
          await ctx.api.answerCallbackQuery(callbackQueryId, text ? { text } : {});
        }
      }
    };
  };

  middleware = async (ctx: GameHubContext, next: () => Promise<void>): Promise<void> => {
    await next();
  };
}

// Export plugin instance
export const telegramPluginInstance = new TelegramPlugin(); 