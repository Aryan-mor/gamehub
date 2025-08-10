import { Context } from 'grammy';
import { InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove, ForceReply } from 'grammy/types';
import { api } from '@/lib/api';
import { logError } from '@/modules/core/logger';

// TypeScript interfaces for type safety
export interface SendPayload {
  text: string;
  extra?: {
    reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disable_web_page_preview?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
  };
}

export interface SendOptions {
  forceNew?: boolean;
  messageKey: string; // Unique key to track message in DB
}

export interface SendResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export interface BroadcastResult {
  userId: number;
  success: boolean;
  messageId?: number;
  error?: string;
}

// Database helper functions
async function getStoredMessageId(chatId: number, messageKey: string): Promise<number | null> {
  try {
    const tracking = await api.messageTracking.getByChatAndKey(chatId, messageKey);
    return tracking?.message_id || null;
  } catch (error) {
    logError('sendOrUpdateMessage.getStoredMessageId', error as Error, { chatId, messageKey });
    return null;
  }
}

async function storeMessageId(chatId: number, messageId: number, messageKey: string): Promise<void> {
  try {
    await api.messageTracking.upsert({
      chat_id: chatId,
      message_key: messageKey,
      message_id: messageId,
    });
  } catch (error) {
    logError('sendOrUpdateMessage.storeMessageId', error as Error, { chatId, messageId, messageKey });
  }
}

async function deleteStoredMessageId(chatId: number, messageKey: string): Promise<void> {
  try {
    await api.messageTracking.deleteByChatAndKey(chatId, messageKey);
  } catch (error) {
    logError('sendOrUpdateMessage.deleteStoredMessageId', error as Error, { chatId, messageKey });
  }
}

// Telegram API helper functions
async function sendNewMessage(
  ctx: Context,
  chatId: number,
  payload: SendPayload
): Promise<number> {
  const message = await ctx.api.sendMessage(chatId, payload.text, payload.extra);
  return message.message_id;
}

async function editExistingMessage(
  ctx: Context,
  chatId: number,
  messageId: number,
  payload: SendPayload
): Promise<boolean> {
  try {
    // For editMessageText, we can only use InlineKeyboardMarkup
    const editOptions = {
      ...payload.extra,
      reply_markup: payload.extra?.reply_markup as InlineKeyboardMarkup | undefined,
    };
    
    await ctx.api.editMessageText(chatId, messageId, payload.text, editOptions);
    return true;
  } catch (error) {
    logError('sendOrUpdateMessage.editExistingMessage', error as Error, { chatId, messageId });
    return false;
  }
}

async function deleteMessage(
  ctx: Context,
  chatId: number,
  messageId: number
): Promise<boolean> {
  try {
    await ctx.api.deleteMessage(chatId, messageId);
    return true;
  } catch (error) {
    logError('sendOrUpdateMessage.deleteMessage', error as Error, { chatId, messageId });
    return false;
  }
}

// Main function to send or update a message
export async function sendOrUpdateMessage(
  ctx: Context,
  chatId: number,
  payload: SendPayload,
  options: SendOptions
): Promise<SendResult> {
  const { forceNew = false, messageKey } = options;

  try {
    // Get stored message ID for this chat and message key
    const storedMessageId = await getStoredMessageId(chatId, messageKey);

    // If forceNew is true, delete old message and send new one
    if (forceNew && storedMessageId) {
      await deleteMessage(ctx, chatId, storedMessageId);
      await deleteStoredMessageId(chatId, messageKey);
    }

    // If we have a stored message ID and not forcing new, try to edit
    if (storedMessageId && !forceNew) {
      const editSuccess = await editExistingMessage(ctx, chatId, storedMessageId, payload);
      
      if (editSuccess) {
        return {
          success: true,
          messageId: storedMessageId,
        };
      }
      
      // If edit failed, delete the stored message ID and continue to send new message
      await deleteStoredMessageId(chatId, messageKey);
    }

    // Send new message
    const newMessageId = await sendNewMessage(ctx, chatId, payload);
    
    // Store the new message ID
    await storeMessageId(chatId, newMessageId, messageKey);

    return {
      success: true,
      messageId: newMessageId,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('sendOrUpdateMessage', error as Error, { chatId, messageKey, payload });
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Function to send/update message to multiple users
export async function sendOrUpdateMessageToUsers(
  ctx: Context,
  users: number[],
  payload: SendPayload,
  options?: SendOptions
): Promise<BroadcastResult[]> {
  const results: BroadcastResult[] = [];

  // Process each user sequentially to avoid rate limiting issues
  for (const userId of users) {
    try {
      const result = await sendOrUpdateMessage(ctx, userId, payload, options || { messageKey: `broadcast_${Date.now()}` });
      
      results.push({
        userId: userId,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('sendOrUpdateMessageToUsers', error as Error, { userId: String(userId), payload });
      
      results.push({
        userId: userId,
        success: false,
        error: errorMessage,
      });
    }
  }

  return results;
}

// Utility function to create a unique message key
export function createMessageKey(prefix: string, identifier: string): string {
  return `${prefix}_${identifier}`;
}

// Utility function to create a message key for game updates
export function createGameMessageKey(gameId: string, updateType: string): string {
  return createMessageKey('game', `${gameId}_${updateType}`);
}

// Utility function to create a message key for room updates
export function createRoomMessageKey(roomId: string, updateType: string): string {
  return createMessageKey('room', `${roomId}_${updateType}`);
}

// Utility function to create a message key for user notifications
export function createUserMessageKey(userId: number, notificationType: string): string {
  return createMessageKey('user', `${userId}_${notificationType}`);
}
