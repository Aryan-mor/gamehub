import { HandlerContext } from '@/modules/core/handler';
import { generateFormStepKeyboard } from '../../_utils/formKeyboardGenerator';
import { validateRoomName } from '../../_utils/roomValidation';
import { FormState } from '../../_utils/formStateManager';
import { GameHubContext } from '@/plugins';

/**
 * Handle text input for room creation form
 */
export async function handleRoomNameInput(context: HandlerContext, text: string): Promise<boolean> {
  const { user, ctx } = context;
  
  ctx.log.info('Processing room name input', { text, userId: user.id });
  
  try {
    const userId = user.id.toString();
    const namespace = 'poker.room.create';
    const formState = ctx.formState.get<FormState>(namespace, userId);
    
    // Check if user is in form state and on name step
    if (!formState || formState.step !== 'name') {
      return false; // Not handling this text
    }
    
    // Validate room name
    const nameError = validateRoomName(text);
    if (nameError) {
      const message = `❌ <b>خطا در نام روم</b>\n\n${nameError}\n\n` +
        `لطفاً نام دیگری انتخاب کنید:`;
      
      await ctx.replySmart(message, {
        parse_mode: 'HTML',
        reply_markup: generateFormStepKeyboard('name', ctx)
      });
      return true; // Handled
    }
    
    // Update form state with room name
    formState.data.name = text.trim();
    formState.step = 'privacy';
    ctx.formState.set<FormState>(namespace, userId, formState);
    
    // Move to next step (privacy)
    const message = `🏠 <b>ساخت روم پوکر</b>\n\n` +
      `✅ <b>نام روم ثبت شد:</b> ${text.trim()}\n\n` +
      `🔒 <b>مرحله ۲: نوع روم</b>\n\n` +
      `نوع روم خود را انتخاب کنید:\n\n` +
      `🔒 <b>خصوصی:</b> فقط با لینک دعوت قابل ورود\n` +
      `🌐 <b>عمومی:</b> در لیست روم‌های عمومی نمایش داده می‌شود`;
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: generateFormStepKeyboard('privacy', ctx)
    });
    
    return true; // Handled
    
  } catch (error) {
    ctx.log.error('Room name input handling error', { error: error instanceof Error ? error.message : String(error) });
    
    const message = ctx.t('poker.form.error.processing');
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: ctx.t('poker.room.buttons.backToMenu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {}) }
        ]]
      }
    });
    
    return true; // Handled
  }
}

/**
 * Check if user is in room creation form
 */
export function isUserInRoomCreationForm(ctx: GameHubContext, userId: string): boolean {
  const namespace = 'poker.room.create';
  const formState = ctx.formState.get<FormState>(namespace, userId);
  // Only return true on the 'name' step because only that step expects free-text input
  return !!formState && formState.step === 'name';
}