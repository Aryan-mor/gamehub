import { HandlerContext } from '@/modules/core/handler';
import { FormState, defaultFormState } from '../../_utils/formStateManager';

// Global form state storage (shared with textHandler)
declare global {
  var formStates: Map<string, FormState>;
}

if (!global.formStates) {
  global.formStates = new Map<string, FormState>();
}

/**
 * Handle initial room creation form start
 */
async function handleCreate(context: HandlerContext): Promise<void> {
  const { user, ctx } = context;
  
  console.log(`Starting room creation form for user ${user.id}`);
  
  try {
    // Check if user is already in an active room
    // const hasActiveRoom = await checkUserActiveRoom(); // This line was removed as per the new_code
    // if (hasActiveRoom) {
    //   const message = `❌ <b>خطا در ساخت روم</b>\n\n` +
    //     `شما در حال حاضر در یک روم فعال هستید.\n` +
    //     `لطفاً ابتدا از روم فعلی خارج شوید.`;
      
    //   await tryEditMessageText(ctx, message, {
    //     parse_mode: 'HTML',
    //     reply_markup: {
    //       inline_keyboard: [[
    //         { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
    //       ]]
    //     }
    //   });
    //   return;
    // }
    
    // Initialize form state
    const formState = { ...defaultFormState };
    global.formStates.set(user.id.toString(), formState);
    
    // Show first step (name input)
    await showFormStep(context, formState);
    
  } catch (error) {
    console.error('Room creation form start error:', error);
    
    const message = `❌ <b>خطا در شروع فرم</b>\n\n` +
      `متأسفانه مشکلی در شروع فرم ساخت روم پیش آمده.\n` +
      `لطفاً دوباره تلاش کنید.`;
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
        ]]
      }
    });
  }
}

/**
 * Handle form step navigation and data input
 */
// async function handleFormStep(context: HandlerContext, query: Record<string, string>): Promise<void> {
//   const { user, ctx } = context;
//   const { step, value } = query;
//   
//   console.log(`Processing form step: ${step} with value: ${value} for user ${user.id}`);
//   
//   try {
//     const userId = user.id.toString();
//     const formState = global.formStates.get(userId) || { ...defaultFormState };
//     
//     // Update form data based on step
//     if (step && value !== undefined) {
//       switch (step) {
//         case 'privacy':
//           formState.data.isPrivate = value === 'true';
//           break;
//         case 'maxPlayers':
//           formState.data.maxPlayers = parseInt(value) as 2 | 4 | 6 | 8;
//           break;
//         case 'smallBlind':
//           formState.data.smallBlind = parseInt(value);
//           break;
//         case 'timeout':
//           formState.data.turnTimeoutSec = parseInt(value);
//           break;
//       }
//     }
//     
//     // Update step
//     if (step) {
//       formState.step = step as FormStep;
//     }
//     
//     // Save updated state
//     global.formStates.set(userId, formState);
//     
//     // Show current step
//     await showFormStep(context, formState);
//     
//   } catch (error) {
//     console.error('Form step handling error:', error);
//     
//     const message = `❌ <b>خطا در پردازش فرم</b>\n\n` +
//       `متأسفانه مشکلی در پردازش اطلاعات فرم پیش آمده.\n` +
//       `لطفاً دوباره تلاش کنید.`;
//     
//     await tryEditMessageText(ctx, message, {
//       parse_mode: 'HTML',
//       reply_markup: {
//         inline_keyboard: [[
//           { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
//         ]]
//       }
//     });
//   }
// }

/**
 * Handle form confirmation and room creation
 */
// async function handleConfirmCreate(context: HandlerContext): Promise<void> {
//   const { user, ctx } = context;
//   
//   console.log(`Confirming room creation for user ${user.id}`);
//   
//   try {
//     const userId = user.id.toString();
//     const formState = global.formStates.get(userId);
//     
//     if (!formState || !formState.isComplete) {
//       const message = `❌ <b>خطا در تایید روم</b>\n\n` +
//         `اطلاعات فرم ناقص است.\n` +
//         `لطفاً ابتدا فرم را تکمیل کنید.`;
//       
//       await tryEditMessageText(ctx, message, {
//         parse_mode: 'HTML',
//         reply_markup: {
//           inline_keyboard: [[
//             { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
//           ]]
//         }
//       });
//       return;
//     }
//     
//     // Validate form data
//     // const validation = validateRoomForm(formState.data); // This line was removed as per the new_code
//     // if (!validation.isValid) {
//     //   const errorMessage = validation.errors.map(e => e.message).join('\n');
//     //   const message = `❌ <b>خطا در اعتبارسنجی</b>\n\n${errorMessage}`;
//     //   
//     //   await tryEditMessageText(ctx, message, {
//     //     parse_mode: 'HTML',
//     //     reply_markup: {
//     //       inline_keyboard: [[
//     //         { text: '✏️ ویرایش فرم', callback_data: 'games.poker.room.create.edit' }
//     //       ]]
//     //     }
//     //   });
//     //   return;
//     // }
//     
//     // Create room
//     // const playerId = validatePlayerId(userId); // This line was removed as per the new_code
//     const roomData = formState.data as CreateRoomFormData;
//     
//     // const roomRequest: CreateRoomRequest = { // This line was removed as per the new_code
//     //   name: roomData.name.trim(),
//     //   isPrivate: roomData.isPrivate,
//     //   maxPlayers: roomData.maxPlayers,
//     //   smallBlind: roomData.smallBlind,
//     //   turnTimeoutSec: roomData.turnTimeoutSec
//     // };
//     
//     // Create display name from first_name + last_name for privacy
//     let displayName = 'Unknown Player';
//     if (ctx.from?.first_name) {
//       displayName = ctx.from.first_name;
//       if (ctx.from.last_name) {
//         displayName += ` ${ctx.from.last_name}`;
//       }
//     } else if (user.username) {
//       displayName = user.username;
//     }
//     
//     console.log(`🎯 CREATING ROOM:`, {
//       playerId,
//       playerName: displayName,
//       playerUsername: user.username,
//       chatId: ctx.chat?.id,
//       chatType: ctx.chat?.type
//     });
//     
//     // const room = await createPokerRoom( // This line was removed as per the new_code
//     //   roomRequest,
//     //   playerId,
//     //   displayName,
//     //   user.username,
//     //   ctx.chat?.id // Store creator's chatId
//     // );
//     
//     // Clear form state
//     global.formStates.delete(userId);
//     
//     // Show success message with room management buttons
//     const message = `🏠 <b>روم با موفقیت ساخته شد!</b>\n\n` +
//       `✅ روم پوکر جدید آماده است!\n\n` +
//       `🎯 <b>مشخصات روم:</b>\n` +
//       `• نام: ${room.name}\n` +
//       `• نوع: ${room.isPrivate ? '🔒 خصوصی' : '🌐 عمومی'}\n` +
//       `• تعداد بازیکنان: ${room.players.length}/${room.maxPlayers}\n` +
//       `• Small Blind: ${room.smallBlind} سکه\n` +
//       `• تایم‌اوت: ${room.turnTimeoutSec} ثانیه\n\n` +
//       `📊 <b>مراحل بعدی:</b>\n` +
//       `• دوستان خود را دعوت کنید\n` +
//       `• منتظر ورود بازیکنان باشید\n` +
//       `• بازی را شروع کنید`;
// 
//     // Generate confirmation keyboard
//     const keyboard = {
//       inline_keyboard: [
//         [
//           { text: '📤 Share Room', callback_data: `games.poker.room.share?roomId=${room.id}` }
//         ],
//         [
//           { text: '🔙 Back to Menu', callback_data: 'games.poker.start' }
//         ]
//       ]
//     };
//     
//     const sentMessage = await tryEditMessageText(ctx, message, {
//       parse_mode: 'HTML',
//       reply_markup: keyboard
//     });
//     
//     // Store message ID for room creator
//     if (sentMessage && (sentMessage as any).message_id) {
//       try {
//         // await storePlayerMessage(room.id, user.id, sentMessage.message_id, ctx.chat?.id || 0); // This line was removed as per the new_code
//         console.log(`💾 Stored message ID ${(sentMessage as any).message_id} for room creator ${user.id}`);
//       } catch (error) {
//         console.error('Failed to store message ID:', error);
//       }
//     }
//     
//   } catch (error) {
//     console.error('Room creation confirmation error:', error);
//     
//     const message = `❌ <b>خطا در ساخت روم</b>\n\n` +
//       `متأسفانه مشکلی در ساخت روم پیش آمده.\n` +
//       `لطفاً دوباره تلاش کنید.`;
//     
//     await tryEditMessageText(ctx, message, {
//       parse_mode: 'HTML',
//       reply_markup: {
//         inline_keyboard: [[
//           { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
//         ]]
//       }
//     });
//   }
// }

/**
 * Show form step with appropriate message and keyboard
 */
async function showFormStep(context: HandlerContext, formState: FormState): Promise<void> {
  const { ctx } = context;
  const { step, data } = formState;
  
  let message = '';
  let keyboard;
  
  switch (step) {
    case 'name':
      message = `🏠 <b>ساخت روم پوکر</b>\n\n` +
        `📝 <b>مرحله ۱: نام روم</b>\n\n` +
        `لطفاً نام روم خود را وارد کنید:\n` +
        `• حداقل ۳ کاراکتر\n` +
        `• حداکثر ۳۰ کاراکتر\n\n` +
        `<i>برای ادامه، نام روم را در پیام بعدی تایپ کنید...</i>`;
      
      keyboard = {
        inline_keyboard: [[
          { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
        ]]
      };
      break;
      
    case 'privacy':
      message = `🏠 <b>ساخت روم پوکر</b>\n\n` +
        `🔒 <b>مرحله ۲: نوع روم</b>\n\n` +
        `نوع روم خود را انتخاب کنید:\n\n` +
        `🔒 <b>خصوصی:</b> فقط با لینک دعوت قابل ورود\n` +
        `🌐 <b>عمومی:</b> در لیست روم‌های عمومی نمایش داده می‌شود`;
      
      // keyboard = generateFormStepKeyboard(step); // This line was removed as per the new_code
      break;
      
    case 'maxPlayers':
      message = `🏠 <b>ساخت روم پوکر</b>\n\n` +
        `👥 <b>مرحله ۳: تعداد بازیکنان</b>\n\n` +
        `حداکثر تعداد بازیکنان را انتخاب کنید:`;
      
      // keyboard = generateFormStepKeyboard(step); // This line was removed as per the new_code
      break;
      
    case 'smallBlind':
      message = `🏠 <b>ساخت روم پوکر</b>\n\n` +
        `💰 <b>مرحله ۴: مقدار Small Blind</b>\n\n` +
        `مقدار Small Blind را انتخاب کنید:\n` +
        `(Big Blind = ۲ × Small Blind)`;
      
      // keyboard = generateFormStepKeyboard(step); // This line was removed as per the new_code
      break;
      
    case 'timeout':
      message = `🏠 <b>ساخت روم پوکر</b>\n\n` +
        `⏱️ <b>مرحله ۵: زمان تایم‌اوت</b>\n\n` +
        `زمان تایم‌اوت هر نوبت را انتخاب کنید:`;
      
      // keyboard = generateFormStepKeyboard(step); // This line was removed as per the new_code
      break;
      
    case 'confirmation':

      message = `🏠 <b>ساخت روم پوکر</b>\n\n` +
        `✅ <b>مرحله ۶: تایید نهایی</b>\n\n` +
        `📊 <b>مشخصات روم:</b>\n` +
        `• نام: ${data.name}\n` +
        `• نوع: ${data.isPrivate ? '🔒 خصوصی' : '🌐 عمومی'}\n` +
        `• تعداد بازیکنان: ${data.maxPlayers} نفر\n` +
        `• Small Blind: ${data.smallBlind} سکه\n` +
        `• تایم‌اوت: ${data.turnTimeoutSec} ثانیه\n\n` +
        `آیا می‌خواهید روم را با این مشخصات بسازید؟`;
      
      // keyboard = generateFormStepKeyboard(step); // This line was removed as per the new_code
      break;
      
          default:
        message = `❌ <b>خطا</b>\n\nمرحله نامعتبر`;
        keyboard = {
          inline_keyboard: [[
            { text: '🔙 بازگشت به منو', callback_data: 'games.poker.backToMenu' }
          ]]
        };
    }
    
    await tryEditMessageText(ctx, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }
  
  // Self-register with compact router
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from '../../compact-codes';

register(POKER_ACTIONS.CREATE_ROOM, handleCreate, 'Create Poker Room');

export default handleCreate;