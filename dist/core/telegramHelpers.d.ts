import { Bot, Context } from 'grammy';
import { CallbackData } from './types';
export declare const createInlineKeyboard: (buttons: Array<{
    text: string;
    callbackData: CallbackData;
}>) => {
    inline_keyboard: {
        text: string;
        callback_data: string;
    }[][];
};
export declare const parseCallbackData: (data: string) => CallbackData;
export declare const sendMessage: (bot: Bot, chatId: number, text: string, options?: {
    parseMode?: "HTML" | "Markdown";
    replyMarkup?: any;
}) => Promise<void>;
export declare const editMessage: (bot: Bot, chatId: number, messageId: number, text: string, options?: {
    parseMode?: "HTML" | "Markdown";
    replyMarkup?: any;
}) => Promise<void>;
export declare const answerCallbackQuery: (bot: Bot, callbackQueryId: string, text?: string) => Promise<void>;
export declare const formatCoins: (amount: number) => string;
export declare const formatTimeRemaining: (milliseconds: number) => string;
export declare const extractUserInfo: (ctx: Context) => {
    userId: string;
    chatId: number;
    username: string | undefined;
    name: string | undefined;
};
//# sourceMappingURL=telegramHelpers.d.ts.map