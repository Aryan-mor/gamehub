
import { Bot } from 'grammy';



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

// Legacy functions for bot.ts compatibility
// These should be replaced with plugin functions in new code
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

// These functions have been moved to plugins:
// - extractUserInfo -> UserPlugin (src/plugins/user.ts)
// - formatCoins, formatTimeRemaining -> UtilsPlugin (src/plugins/utils.ts)
// Use ctx.user and ctx.utils instead
// 
// For new code, use plugin functions:
// - ctx.telegram.sendMessage, ctx.telegram.editMessage, ctx.telegram.answerCallbackQuery 