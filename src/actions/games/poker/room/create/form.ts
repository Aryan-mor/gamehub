import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from '../../compact-codes';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { Context } from 'grammy';
import { FormState } from '../../_utils/formStateManager';


// Global form state storage (shared with other handlers)
declare global {
  var formStates: Map<string, FormState>;
}

if (!global.formStates) {
  global.formStates = new Map<string, FormState>();
}

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
  const { s: step, v: value } = query;
  
  if (!step || !value) {
    logError('handleForm', new Error('No step or value provided'), { query });
    return;
  }
  
  try {
    console.log(`Processing form step: ${step} = ${value} for user ${user.id}`);
    
    // Get or create form state for this user
    const userId = user.id.toString();
    let formState = global.formStates.get(userId);
    
    if (!formState) {
      formState = { 
        step: 'name', 
        data: {
          name: '',
          isPrivate: false,
          maxPlayers: 2,
          smallBlind: 1,
          turnTimeoutSec: 30
        }, 
        isComplete: false 
      };
      global.formStates.set(userId, formState);
    }
    
    // Ensure formState.data exists
    if (!formState.data) {
      formState.data = {
        name: '',
        isPrivate: false,
        maxPlayers: 2,
        smallBlind: 1,
        turnTimeoutSec: 30
      };
    }
    
    // Update form state based on step
    switch (step) {
      case 'privacy':
        formState.data.isPrivate = value === 'true';
        formState.step = 'privacy';
        await handlePrivacyStep(ctx, value === 'true');
        break;
      case 'maxPlayers':
        const maxPlayersValue = parseInt(value, 10) as 2 | 4 | 6 | 8;
        formState.data.maxPlayers = maxPlayersValue;
        formState.step = 'maxPlayers';
        await handleMaxPlayersStep(ctx, maxPlayersValue);
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
async function handlePrivacyStep(ctx: Context, isPrivate: boolean): Promise<void> {
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
async function handleMaxPlayersStep(ctx: Context, maxPlayers: number): Promise<void> {
  const _message = `👥 <b>حداکثر بازیکنان</b>\n\n` +
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
  
  await tryEditMessageText(ctx, _message, {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

/**
 * Handle small blind step
 */
async function handleSmallBlindStep(ctx: Context, smallBlind: number): Promise<void> {
  const _message = `💰 <b>Small Blind</b>\n\n` +
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
  
  await tryEditMessageText(ctx, _message, {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

/**
 * Handle timeout step
 */
async function handleTimeoutStep(ctx: Context, timeout: number): Promise<void> {
  const _message = `⏱️ <b>زمان تایم‌اوت</b>\n\n` +
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
  
  await tryEditMessageText(ctx, _message, {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

/**
 * Handle room creation confirmation
 */
async function handleConfirmCreate(context: HandlerContext): Promise<void> {
  const { user, ctx } = context;
  
  console.log(`Confirming room creation for user ${user.id}`);
  
  try {
    const userId = user.id.toString();
    const formState = global.formStates.get(userId);
    
    if (!formState || !formState.isComplete) {
      const message = `❌ <b>خطا در تایید روم</b>\n\n` +
        `فرم تکمیل نشده است. لطفاً ابتدا تمام مراحل را تکمیل کنید.`;
      
      await tryEditMessageText(ctx, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '🔙 بازگشت به منو', callback_data: POKER_ACTIONS.BACK_TO_MENU }
          ]]
        }
      });
      return;
    }
    
    // Create the room using the form data
    const pokerService = await import('../../services/pokerService');
    const { createPokerRoom } = pokerService;
    
    const room = await createPokerRoom({
      name: formState.data.name || '',
      isPrivate: formState.data.isPrivate || false,
      maxPlayers: formState.data.maxPlayers || 2,
      smallBlind: formState.data.smallBlind || 1,
      turnTimeoutSec: formState.data.turnTimeoutSec || 30
    }, user.id as any, user.username || 'Unknown', user.username, ctx.chat?.id);
    
    // Clear form state
    global.formStates.delete(userId);
    
    // Instead of duplicating room info display, redirect to room info handler
    // This ensures consistency and avoids code duplication
    const roomInfoHandler = await import('../info/index');
    await roomInfoHandler.default(context, { roomId: room.id });
    
  } catch (error) {
    console.error('Room creation confirmation error:', error);
    
    const message = `❌ <b>خطا در ساخت روم</b>\n\n` +
      `متأسفانه مشکلی در ساخت روم پیش آمده.\n` +
      `لطفاً دوباره تلاش کنید.`;
    
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

// Self-register with compact router
register(POKER_ACTIONS.FORM_STEP, handleForm, 'Room Creation Form');
register(POKER_ACTIONS.CREATE_ROOM_CONFIRM, handleConfirmCreate, 'Confirm Room Creation');

export default handleForm; 