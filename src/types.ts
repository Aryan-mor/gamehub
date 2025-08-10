import { Context } from "grammy";
import { InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove, ForceReply } from "grammy/types";

export interface SmartReplyOptions {
  chatId?: number | string;
  messageId?: number;
  reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  userId?: string;
  forceNewMessage?: boolean;
}

export interface BroadcastResult {
  userId: number;
  success: boolean;
  error?: string;
}

export interface SmartContext extends Context {
  replySmart(
    text: string,
    options?: SmartReplyOptions
  ): Promise<void>;
  sendOrEditMessageToUsers(
    userIds: number[],
    text: string,
    messageOptions?: SmartReplyOptions,
    broadcastOptions?: Omit<SmartReplyOptions, 'chatId' | 'userId'>
  ): Promise<BroadcastResult[]>;
} 