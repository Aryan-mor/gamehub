
import { Bot, Context } from 'grammy';
import { SmartContext } from '../../types';

/**
 * Try to edit message text first, fallback to sending new message
 * This provides a consistent way to update messages across the app
 * @deprecated Use ctx.replySmart() instead
 */
export async function tryEditMessageText(
  ctx: SmartContext,
  text: string,
  options?: { parse_mode?: 'HTML' | 'Markdown'; reply_markup?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } }
): Promise<unknown> {
  // Use the smart reply plugin instead
  return await ctx.replySmart(text, options);
}

/**
 * Try to edit message reply markup first, fallback to sending new message
 * This provides a consistent way to update message keyboards across the app
 * @deprecated Use ctx.replySmart() instead
 */
export async function tryEditMessageReplyMarkup(
  ctx: SmartContext,
  replyMarkup: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> },
  fallbackText?: string,
  fallbackOptions?: { parse_mode?: 'HTML' | 'Markdown'; reply_markup?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } }
): Promise<unknown> {
  // Use the smart reply plugin instead
  return await ctx.replySmart(fallbackText || 'Message updated', { 
    ...fallbackOptions, 
    reply_markup: replyMarkup 
  });
}

export const createInlineKeyboard = (buttons: Array<{
  text: string;
  callbackData: Record<string, unknown>;
}>): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } => {
  return {
    inline_keyboard: buttons.map(button => [{
      text: button.text,
      callback_data: JSON.stringify(button.callbackData)
    }])
  };
};

export const parseCallbackData = (data: string): Record<string, unknown> => {
  try {
    return JSON.parse(data) as Record<string, unknown>;
  } catch {
    return { action: data };
  }
};

export const sendMessage = async (
  bot: Bot,
  chatId: number,
  text: string,
  options?: {
    parseMode?: 'HTML' | 'Markdown';
    replyMarkup?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
  }
): Promise<void> => {
  await bot.api.sendMessage(chatId, text, {
    ...(options?.parseMode && { parse_mode: options.parseMode }),
    ...(options?.replyMarkup && { reply_markup: options.replyMarkup }),
  });
};

export const editMessage = async (
  bot: Bot,
  chatId: number,
  messageId: number,
  text: string,
  options?: {
    parseMode?: 'HTML' | 'Markdown';
    replyMarkup?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
  }
): Promise<void> => {
  await bot.api.editMessageText(chatId, messageId, text, {
    ...(options?.parseMode && { parse_mode: options.parseMode }),
    ...(options?.replyMarkup && { reply_markup: options.replyMarkup }),
  });
};

export const answerCallbackQuery = async (
  bot: Bot,
  callbackQueryId: string,
  text?: string
): Promise<void> => {
  await bot.api.answerCallbackQuery(callbackQueryId, text ? { text } : {});
};

export const formatCoins = (amount: number): string => {
  return `${amount} Coins`;
};

export const formatTimeRemaining = (milliseconds: number): string => {
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  
  const pad = (n: number): string => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const extractUserInfo = (ctx: Context): {
  userId: string;
  chatId: number;
  username: string | undefined;
  name: string | undefined;
} => {
  const from = ctx.from;
  if (!from) {
    throw new Error('User information not available');
  }
  
  return {
    userId: from.id.toString(),
    chatId: ctx.chat?.id || from.id,
    username: from.username || undefined,
    name: from.first_name || from.last_name ? 
      `${from.first_name || ''} ${from.last_name || ''}`.trim() : 
      undefined,
  };
}; 