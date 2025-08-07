import { Context } from "grammy";

export interface SmartReplyOptions {
  chatId?: number | string;
  messageId?: number;
  reply_markup?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
}

export interface SmartContext extends Context {
  replySmart(
    text: string,
    options?: SmartReplyOptions
  ): Promise<void>;
} 