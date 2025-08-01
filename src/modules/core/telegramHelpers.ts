
import { Bot, Context } from 'grammy';
import { CallbackData } from './types';

export const createInlineKeyboard = (buttons: Array<{
  text: string;
  callbackData: CallbackData;
}>): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } => {
  return {
    inline_keyboard: buttons.map(button => [{
      text: button.text,
      callback_data: JSON.stringify(button.callbackData)
    }])
  };
};

export const parseCallbackData = (data: string): CallbackData => {
  try {
    return JSON.parse(data) as CallbackData;
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