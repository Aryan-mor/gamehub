import { Bot, Context } from 'grammy';
import { GameHubContext } from '@/plugins';

/**
 * Send a message to a specific chat
 */
export const sendMessage = async (
  bot: Bot<GameHubContext>,
  chatId: number,
  text: string,
  options?: {
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    replyMarkup?: any;
  }
) => {
  try {
    const result = await bot.api.sendMessage(chatId, text, {
      parse_mode: options?.parseMode,
      reply_markup: options?.replyMarkup,
    });
    return result;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Answer a callback query
 */
export const answerCallbackQuery = async (
  bot: Bot<GameHubContext>,
  callbackQueryId: string,
  text?: string
) => {
  try {
    const result = await bot.api.answerCallbackQuery(callbackQueryId, {
      text,
    });
    return result;
  } catch (error) {
    console.error('Error answering callback query:', error);
    throw error;
  }
};

/**
 * Parse callback data from string
 */
export const parseCallbackData = (data: string): Record<string, string> => {
  try {
    if (!data) return {};
    
    // Handle URL-encoded data
    const decodedData = decodeURIComponent(data);
    
    // Parse as JSON if possible
    try {
      return JSON.parse(decodedData);
    } catch {
      // Fallback to simple key-value parsing
      const params = new URLSearchParams(decodedData);
      const result: Record<string, string> = {};
      
      for (const [key, value] of params.entries()) {
        result[key] = value;
      }
      
      return result;
    }
  } catch (error) {
    console.error('Error parsing callback data:', error);
    return {};
  }
};

/**
 * Edit message text
 */
export const editMessageText = async (
  bot: Bot<GameHubContext>,
  chatId: number,
  messageId: number,
  text: string,
  options?: {
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    replyMarkup?: any;
  }
) => {
  try {
    const result = await bot.api.editMessageText(chatId, messageId, text, {
      parse_mode: options?.parseMode,
      reply_markup: options?.replyMarkup,
    });
    return result;
  } catch (error) {
    console.error('Error editing message:', error);
    throw error;
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (
  bot: Bot<GameHubContext>,
  chatId: number,
  messageId: number
) => {
  try {
    const result = await bot.api.deleteMessage(chatId, messageId);
    return result;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Get chat information
 */
export const getChat = async (
  bot: Bot<GameHubContext>,
  chatId: number
) => {
  try {
    const result = await bot.api.getChat(chatId);
    return result;
  } catch (error) {
    console.error('Error getting chat:', error);
    throw error;
  }
};

/**
 * Get user information
 */
export const getUser = async (
  bot: Bot<GameHubContext>,
  userId: number
) => {
  try {
    const result = await bot.api.getChat(userId);
    return result;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}; 