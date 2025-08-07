
import { Bot, Context } from 'grammy';



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

// These functions have been moved to TelegramPlugin (src/plugins/telegram.ts)
// Use ctx.telegram.sendMessage, ctx.telegram.editMessage, ctx.telegram.answerCallbackQuery instead

// These functions have been moved to plugins:
// - extractUserInfo -> UserPlugin (src/plugins/user.ts)
// - formatCoins, formatTimeRemaining -> UtilsPlugin (src/plugins/utils.ts)
// Use ctx.user and ctx.utils instead 