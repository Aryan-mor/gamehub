import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { generateFormStepKeyboard } from '../../_utils/formKeyboardGenerator';
import { validateRoomName } from '../../_utils/roomValidation';
import { updateFormState } from '../../_utils/formStateManager';

// In-memory form state storage (shared with main handler)
declare global {
  var formStates: Map<string, any>;
}

if (!global.formStates) {
  global.formStates = new Map<string, any>();
}

/**
 * Handle text input for room creation form
 */
export async function handleRoomNameInput(context: HandlerContext, text: string): Promise<boolean> {
  const { user, ctx } = context;
  
  console.log(`Processing room name input: "${text}" for user ${user.id}`);
  
  try {
    const userId = user.id.toString();
    const formState = global.formStates.get(userId);
    
    // Check if user is in form state and on name step
    if (!formState || formState.step !== 'name') {
      return false; // Not handling this text
    }
    
    // Validate room name
    const nameError = validateRoomName(text);
    if (nameError) {
      const message = `❌ <b>خطا در نام روم</b>\n\n${nameError}\n\n` +
        `لطفاً نام دیگری انتخاب کنید:`;
      
      // For text messages, we need to send a new message since we can't edit the original
      if (ctx.reply) {
        await ctx.reply(message, {
          parse_mode: 'HTML',
          reply_markup: generateFormStepKeyboard('name')
        });
      } else {
        await tryEditMessageText(ctx, message, {
          parse_mode: 'HTML',
          reply_markup: generateFormStepKeyboard('name')
        });
      }
      return true; // Handled
    }
    
    // Update form state with room name
    formState.data.name = text.trim();
    formState.step = 'name';
    global.formStates.set(userId, formState);
    
    // Move to next step (privacy)
    const message = `🏠 <b>ساخت روم پوکر</b>\n\n` +
      `✅ <b>نام روم ثبت شد:</b> ${text.trim()}\n\n` +
      `🔒 <b>مرحله ۲: نوع روم</b>\n\n` +
      `نوع روم خود را انتخاب کنید:\n\n` +
      `🔒 <b>خصوصی:</b> فقط با لینک دعوت قابل ورود\n` +
      `🌐 <b>عمومی:</b> در لیست روم‌های عمومی نمایش داده می‌شود`;
    
    // For text messages, we need to send a new message since we can't edit the original
    if (ctx.reply) {
      await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: generateFormStepKeyboard('privacy')
      });
    } else {
      await tryEditMessageText(ctx, message, {
        parse_mode: 'HTML',
        reply_markup: generateFormStepKeyboard('privacy')
      });
    }
    
    return true; // Handled
    
  } catch (error) {
    console.error('Room name input handling error:', error);
    
    const message = `❌ <b>خطا در پردازش نام روم</b>\n\n` +
      `متأسفانه مشکلی در پردازش نام روم پیش آمده.\n` +
      `لطفاً دوباره تلاش کنید.`;
    
    // For text messages, we need to send a new message since we can't edit the original
    if (ctx.reply) {
      await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
          ]]
        }
      });
    } else {
      await tryEditMessageText(ctx, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
          ]]
        }
      });
    }
    
    return true; // Handled
  }
}

/**
 * Check if user is in room creation form
 */
export function isUserInRoomCreationForm(userId: string): boolean {
  const formState = global.formStates.get(userId);
  return !!formState && formState.step === 'name';
} 