import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS, parseFormCallbackData } from '../../compact-codes';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

// Export the action key for consistency and debugging
export const key = 'games.poker.room.create.form';

/**
 * Handle room creation form steps
 * Processes compact callback data to stay within Telegram's 64-byte limit
 */
async function handleForm(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  logFunctionStart('handleForm', { query });
  
  const { user, ctx } = context;
  
  // For compact router, params are passed directly in query
  // For legacy router, callback_data is passed
  const { callback_data, s: step, v: value, ...params } = query;
  
  if (!step || !value) {
    logError('handleForm', new Error('No step or value provided'), { query });
    return;
  }
  
  try {
    console.log(`Processing form step: ${step} = ${value} for user ${user.id}`);
    
    // Get or create form state
    const userId = user.id.toString();
    let formState = global.formStates.get(userId);
    
    if (!formState) {
      formState = { 
        step: 'name', 
        data: {}, 
        isComplete: false 
      };
      global.formStates.set(userId, formState);
    }
    
    // Update form state based on step
    switch (step) {
      case 'privacy':
        formState.data.isPrivate = value === 'true';
        formState.step = 'privacy';
        await handlePrivacyStep(ctx, value === 'true');
        break;
      case 'maxPlayers':
        formState.data.maxPlayers = parseInt(value, 10);
        formState.step = 'maxPlayers';
        await handleMaxPlayersStep(ctx, parseInt(value, 10));
        break;
      case 'smallBlind':
        formState.data.smallBlind = parseInt(value, 10);
        formState.step = 'smallBlind';
        await handleSmallBlindStep(ctx, parseInt(value, 10));
        break;
      case 'timeout':
        formState.data.turnTimeoutSec = parseInt(value, 10);
        formState.step = 'timeout';
        formState.isComplete = true; // Mark as complete when timeout is set
        await handleTimeoutStep(ctx, parseInt(value, 10));
        break;
      default:
        throw new Error(`Unknown form step: ${step}`);
    }
    
    // Save updated form state
    global.formStates.set(userId, formState);
    
    logFunctionEnd('handleForm', { step, value }, { userId: user.id });
    
  } catch (error) {
    logError('handleForm', error as Error, { query });
    
    const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص رخ داده است';
    const message = `❌ <b>خطا در پردازش فرم</b>\n\n${errorMessage}`;
    
    await tryEditMessageText(ctx, message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔙 بازگشت به منو', callback_data: POKER_ACTIONS.BACK_TO_MENU }
        ]]
      }
    });
  }
}

/**
 * Handle privacy step
 */
async function handlePrivacyStep(ctx: any, isPrivate: boolean): Promise<void> {
  const message = `🔒 <b>نوع روم</b>\n\n` +
    `✅ ${isPrivate ? 'خصوصی' : 'عمومی'} انتخاب شد.\n\n` +
    `در مرحله بعدی تعداد حداکثر بازیکنان را انتخاب کنید:`;
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '👥 ۲ نفر', callback_data: `${POKER_ACTIONS.FORM_STEP}?s=maxPlayers&v=2` },
        { text: '👥 ۴ نفر', callback_data: `${POKER_ACTIONS.FORM_STEP}?s=maxPlayers&v=4` }
      ],
      [
        { text: '👥 ۶ نفر', callback_data: `${POKER_ACTIONS.FORM_STEP}?s=maxPlayers&v=6` },
        { text: '👥 ۸ نفر', callback_data: `${POKER_ACTIONS.FORM_STEP}?s=maxPlayers&v=8` }
      ],
      [
        { text: '🔙 بازگشت', callback_data: POKER_ACTIONS.BACK }
      ]
    ]
  };
  
  await tryEditMessageText(ctx, message, {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

/**
 * Handle max players step
 */
async function handleMaxPlayersStep(ctx: any, maxPlayers: number): Promise<void> {
  const message = `👥 <b>حداکثر بازیکنان</b>\n\n` +
    `✅ ${maxPlayers} نفر انتخاب شد.\n\n` +
    `در مرحله بعدی مقدار Small Blind را انتخاب کنید:`;
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '💰 ۵۰', callback_data: `${POKER_ACTIONS.FORM_STEP}?s=smallBlind&v=50` },
        { text: '💰 ۱۰۰', callback_data: `${POKER_ACTIONS.FORM_STEP}?s=smallBlind&v=100` }
      ],
      [
        { text: '💰 ۲۰۰', callback_data: `${POKER_ACTIONS.FORM_STEP}?s=smallBlind&v=200` },
        { text: '💰 ۵۰۰', callback_data: `${POKER_ACTIONS.FORM_STEP}?s=smallBlind&v=500` }
      ],
      [
        { text: '🔙 بازگشت', callback_data: POKER_ACTIONS.BACK }
      ]
    ]
  };
  
  await tryEditMessageText(ctx, message, {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

/**
 * Handle small blind step
 */
async function handleSmallBlindStep(ctx: any, smallBlind: number): Promise<void> {
  const message = `💰 <b>Small Blind</b>\n\n` +
    `✅ ${smallBlind} سکه انتخاب شد.\n\n` +
    `در مرحله بعدی زمان تایم‌اوت را انتخاب کنید:`;
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '⏱️ ۶۰ ثانیه', callback_data: `${POKER_ACTIONS.FORM_STEP}?s=timeout&v=60` },
        { text: '⏱️ ۲ دقیقه', callback_data: `${POKER_ACTIONS.FORM_STEP}?s=timeout&v=120` }
      ],
      [
        { text: '⏱️ ۵ دقیقه', callback_data: `${POKER_ACTIONS.FORM_STEP}?s=timeout&v=300` },
        { text: '⏱️ ۱۰ دقیقه', callback_data: `${POKER_ACTIONS.FORM_STEP}?s=timeout&v=600` }
      ],
      [
        { text: '🔙 بازگشت', callback_data: POKER_ACTIONS.BACK }
      ]
    ]
  };
  
  await tryEditMessageText(ctx, message, {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

/**
 * Handle timeout step
 */
async function handleTimeoutStep(ctx: any, timeout: number): Promise<void> {
  const message = `⏱️ <b>زمان تایم‌اوت</b>\n\n` +
    `✅ ${timeout} ثانیه انتخاب شد.\n\n` +
    `🎉 <b>فرم تکمیل شد!</b>\n\n` +
    `برای ساخت روم روی دکمه زیر کلیک کنید:`;
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ ساخت روم', callback_data: POKER_ACTIONS.CREATE_ROOM_CONFIRM }
      ],
      [
        { text: '✏️ ویرایش', callback_data: POKER_ACTIONS.CREATE_ROOM_EDIT }
      ],
      [
        { text: '🔙 بازگشت به منو', callback_data: POKER_ACTIONS.BACK_TO_MENU }
      ]
    ]
  };
  
  await tryEditMessageText(ctx, message, {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

// Self-register with compact router
register(POKER_ACTIONS.FORM_STEP, handleForm, 'Room Creation Form');

export default handleForm; 