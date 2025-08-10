import { Context } from 'grammy';
import { SmartReplyOptions } from '../types';
import { InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove, ForceReply } from 'grammy/types';
import { GameHubContext, GameHubPlugin, ContextBuilder } from './context';
import { logError } from '@/modules/core/logger';

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
        // Only allow editing when triggered from a callback (editing bot's own message)
        const messageId =
          options.messageId ??
          ctx.callbackQuery?.message?.message_id;

        if (!chatId) {
          throw new Error("chatId is required");
        }

        // If sending to a different chat than the current context, skip edit and send a new message
        const isDifferentChat = options.chatId !== undefined && options.chatId !== ctx.chat?.id;

        try {
          if (!isDifferentChat && messageId) {
            await ctx.api.editMessageText(chatId, messageId, text, {
              reply_markup: options.reply_markup as InlineKeyboardMarkup,
              parse_mode: options.parse_mode,
            });
            return;
          }
        } catch (err) {
          // Fallback: delete and send new
          logError('smart-reply.editMessage', err as Error, { chatId, messageId });
          try {
            if (messageId) {
              await ctx.api.deleteMessage(chatId, messageId);
            }
          } catch (deleteErr) {
            logError('smart-reply.deleteMessage', deleteErr as Error, { chatId, messageId });
          }
        }

        await ctx.api.sendMessage(chatId, text, {
          reply_markup: options.reply_markup as InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply,
          parse_mode: options.parse_mode,
        });
      }
    };
  };

  middleware = async (_ctx: GameHubContext, next: () => Promise<void>): Promise<void> => {
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