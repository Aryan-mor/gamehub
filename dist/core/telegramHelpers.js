"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractUserInfo = exports.formatTimeRemaining = exports.formatCoins = exports.answerCallbackQuery = exports.editMessage = exports.sendMessage = exports.parseCallbackData = exports.createInlineKeyboard = void 0;
const createInlineKeyboard = (buttons) => {
    return {
        inline_keyboard: buttons.map(button => [{
                text: button.text,
                callback_data: JSON.stringify(button.callbackData)
            }])
    };
};
exports.createInlineKeyboard = createInlineKeyboard;
const parseCallbackData = (data) => {
    try {
        return JSON.parse(data);
    }
    catch {
        return { action: data };
    }
};
exports.parseCallbackData = parseCallbackData;
const sendMessage = async (bot, chatId, text, options) => {
    await bot.api.sendMessage(chatId, text, {
        ...(options?.parseMode && { parse_mode: options.parseMode }),
        ...(options?.replyMarkup && { reply_markup: options.replyMarkup }),
    });
};
exports.sendMessage = sendMessage;
const editMessage = async (bot, chatId, messageId, text, options) => {
    await bot.api.editMessageText(chatId, messageId, text, {
        ...(options?.parseMode && { parse_mode: options.parseMode }),
        ...(options?.replyMarkup && { reply_markup: options.replyMarkup }),
    });
};
exports.editMessage = editMessage;
const answerCallbackQuery = async (bot, callbackQueryId, text) => {
    await bot.api.answerCallbackQuery(callbackQueryId, text ? { text } : {});
};
exports.answerCallbackQuery = answerCallbackQuery;
const formatCoins = (amount) => {
    return `${amount} Coins`;
};
exports.formatCoins = formatCoins;
const formatTimeRemaining = (milliseconds) => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
exports.formatTimeRemaining = formatTimeRemaining;
const extractUserInfo = (ctx) => {
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
exports.extractUserInfo = extractUserInfo;
//# sourceMappingURL=telegramHelpers.js.map