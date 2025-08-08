import { Context } from "grammy";
import { InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove, ForceReply } from "grammy/types";

export interface SmartReplyOptions {
  chatId?: number | string;
  messageId?: number;
  reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
}

export interface SmartContext extends Context {
  replySmart(
    text: string,
    options?: SmartReplyOptions
  ): Promise<void>;
} 