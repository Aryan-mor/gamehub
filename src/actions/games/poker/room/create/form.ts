import { HandlerContext } from '@/modules/core/handler';
import { FormState, updateFormState, defaultFormState } from '../../_utils/formStateManager';
import { CreateRoomFormData, CreateRoomRequest } from '../../types';
import { GameHubContext } from '@/plugins';
import { generateFormStepKeyboard } from '../../_utils/formKeyboardGenerator';

/**
 * Handle form step navigation and data input
 */
async function handleForm(context: HandlerContext, query: Record<string, string> = {}): Promise<void> {
  const { user, ctx } = context;
  const { s: step, v: value } = query;
  
  ctx.log.info('Processing form step', { step, value, userId: user.id });
  
  // Validate required parameters
  if (!step || value === undefined) {
    return; // Silently return if missing parameters
  }
  
  try {
    const userId = user.id.toString();
    const namespace = 'poker.room.create';
    const formState = ctx.formState.get<FormState>(namespace, userId) || { ...defaultFormState };
    
    // Map step names to field names
    const fieldMap: Record<string, keyof CreateRoomFormData> = {
      'name': 'name',
      'privacy': 'isPrivate',
      'maxPlayers': 'maxPlayers',
      'smallBlind': 'smallBlind',
      'timeout': 'turnTimeoutSec'
    };
    
    const field = fieldMap[step];
    if (!field) {
      throw new Error(`Unknown step: ${step}`);
    }
    
    // Convert value to appropriate type
    let typedValue: string | number | boolean = value;
    if (field === 'isPrivate') {
      typedValue = value === 'true';
    } else if (field === 'maxPlayers' || field === 'smallBlind' || field === 'turnTimeoutSec') {
      typedValue = parseInt(value, 10);
    }
    
    // Update form data based on step
    const updatedState = updateFormState(formState, field, typedValue);
    
    // Save updated state
    ctx.formState.set<FormState>(namespace, userId, updatedState);
    
    // Show next step
    await showFormStep(context, updatedState);
    
  } catch (error) {
    ctx.log.error('Form step handling error', { error: error instanceof Error ? error.message : String(error) });
    
    const message = ctx.t('❌ <b>Form Error</b>\n\nForm information is incomplete.\nPlease complete the form first.', {
      fallback: '❌ <b>خطا در پردازش فرم</b>\n\nمتأسفانه مشکلی در پردازش اطلاعات فرم پیش آمده.\nلطفاً دوباره تلاش کنید.'
    });
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: ctx.t('🔙 Back to Menu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {}) }
        ]]
      }
    });
  }
}

/**
 * Show form step with appropriate message and keyboard
 */
async function showFormStep(context: HandlerContext, formState: FormState): Promise<void> {
  const { ctx } = context;
  const { step, data } = formState;
  
  switch (step) {
    case 'name':
      await handleNameStep(ctx, data.name || '');
      break;
      
    case 'privacy':
      await handlePrivacyStep(ctx, data.isPrivate ?? false);
      break;
      
    case 'maxPlayers':
      await handleMaxPlayersStep(ctx, data.maxPlayers || 4);
      break;
      
    case 'smallBlind':
      await handleSmallBlindStep(ctx, data.smallBlind || 100);
      break;
      
    case 'timeout':
      await handleTimeoutStep(ctx, data.turnTimeoutSec || 120);
      break;
      
    case 'confirmation':
      await handleConfirmCreate(context);
      break;
      
    default:
      const message = ctx.t('❌ Unknown step. Please try again.', {
        step,
        fallback: `❌ <b>خطا در پردازش فرم</b>\n\nمرحله نامعتبر: ${step}`
      });
      
      await ctx.replySmart(message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: ctx.t('🔙 Back to Menu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {}) }
          ]]
        }
      });
  }
}

/**
 * Handle name step
 */
async function handleNameStep(ctx: GameHubContext, name: string): Promise<void> {
        const message = ctx.t('🏠 <b>Create Poker Room</b>\n\n📝 <b>Step 1: Room Name</b>\n\nPlease enter your room name:\n• Minimum 3 characters\n• Maximum 30 characters\n\n<i>Type the room name in the next message to continue...</i>', {
    name,
    fallback: `�� <b>نام روم</b>\n\n✅ "${name}" انتخاب شد.\n\nدر مرحله بعدی نوع روم را انتخاب کنید:`
  });
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: ctx.t('🌐 Public'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.create', { s: 'privacy', v: 'false' }) },
        { text: ctx.t('🔒 Private'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.create', { s: 'privacy', v: 'true' }) }
      ],
      [
        { text: ctx.t('🔙 Back'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {}) }
      ]
    ]
  };
  
  await ctx.replySmart(message, {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

/**
 * Handle privacy step
 */
async function handlePrivacyStep(ctx: GameHubContext, isPrivate: boolean): Promise<void> {
  const privacyType = isPrivate ? 
    ctx.t('🔒 Private') : 
    ctx.t('🌐 Public');
    
        const message = ctx.t('🏠 <b>Create Poker Room</b>\n\n🔒 <b>Step 2: Privacy</b>\n\nChoose room privacy:', {
    privacyType,
    fallback: `🔒 <b>نوع روم</b>\n\n✅ ${privacyType} انتخاب شد.\n\nدر مرحله بعدی تعداد حداکثر بازیکنان را انتخاب کنید:`
  });
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: ctx.t('👥 2 Players'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.create', { s: 'maxPlayers', v: '2' }) },
        { text: ctx.t('👥 4 Players'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.create', { s: 'maxPlayers', v: '4' }) }
      ],
      [
        { text: ctx.t('👥 6 Players'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.create', { s: 'maxPlayers', v: '6' }) },
        { text: ctx.t('👥 8 Players'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.create', { s: 'maxPlayers', v: '8' }) }
      ],
      [
        { text: ctx.t('🔙 Back'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {}) }
      ]
    ]
  };
  
  await ctx.replySmart(message, {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

/**
 * Handle max players step
 */
async function handleMaxPlayersStep(ctx: GameHubContext, maxPlayers: number): Promise<void> {
        const message = ctx.t('🏠 <b>Create Poker Room</b>\n\n👥 <b>Step 3: Max Players</b>\n\nSelect maximum players:', {
    maxPlayers,
    fallback: `👥 <b>حداکثر بازیکنان</b>\n\n✅ ${maxPlayers} نفر انتخاب شد.\n\nدر مرحله بعدی مقدار Small Blind را انتخاب کنید:`
  });
  
  const keyboard = generateFormStepKeyboard('maxPlayers', ctx);
  
  await ctx.replySmart(message, {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

/**
 * Handle small blind step
 */
async function handleSmallBlindStep(ctx: GameHubContext, smallBlind: number): Promise<void> {
        const message = ctx.t('🏠 <b>Create Poker Room</b>\n\n💰 <b>Step 4: Small Blind</b>\n\nSelect small blind amount:', {
    smallBlind,
    fallback: `💰 <b>Small Blind</b>\n\n✅ ${smallBlind} سکه انتخاب شد.\n\nدر مرحله بعدی زمان تایم‌اوت را انتخاب کنید:`
  });
  
  const keyboard = generateFormStepKeyboard('smallBlind', ctx);
  
  await ctx.replySmart(message, {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

/**
 * Handle timeout step
 */
async function handleTimeoutStep(ctx: GameHubContext, timeout: number): Promise<void> {
      const message = ctx.t('🏠 <b>Create Poker Room</b>\n\n⏱️ <b>Step 5: Turn Timeout</b>\n\nSelect timeout for each turn:', {
    timeout,
    fallback: `⏱️ <b>زمان تایم‌اوت</b>\n\n✅ ${timeout} ثانیه انتخاب شد.\n\nفرم تکمیل شد! حالا می‌توانید روم را بسازید.`
  });
  
  const keyboard = generateFormStepKeyboard('timeout', ctx);
  
  await ctx.replySmart(message, {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

/**
 * Handle form confirmation and room creation
 */
async function handleConfirmCreate(context: HandlerContext): Promise<void> {
  const { user, ctx } = context;
  
  ctx.log.info('Confirming room creation', { userId: user.id });
  
  try {
    const userId = user.id.toString();
    const namespace = 'poker.room.create';
    const formState = ctx.formState.get<FormState>(namespace, userId);
    
    if (!formState || !formState.isComplete) {
      const message = ctx.t('❌ <b>Form Error</b>\n\nForm information is incomplete.\nPlease complete the form first.', {
        fallback: '❌ <b>خطا در تایید روم</b>\n\nاطلاعات فرم ناقص است.\nلطفاً ابتدا فرم را تکمیل کنید.'
      });
      
      await ctx.replySmart(message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: ctx.t('🔙 Back to Menu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {}) }
          ]]
        }
      });
      return;
    }
    
    // Create room using service
    const roomData: CreateRoomRequest = {
      name: formState.data.name || '',
      isPrivate: formState.data.isPrivate || false,
      maxPlayers: formState.data.maxPlayers || 4,
      smallBlind: formState.data.smallBlind || 100,
      turnTimeoutSec: formState.data.turnTimeoutSec || 120
    };
    
    // Build display name from first_name + last_name for privacy
    let displayName = 'Unknown Player';
    if (ctx.from?.first_name) {
      displayName = ctx.from.first_name;
      if (ctx.from.last_name) {
        displayName += ` ${ctx.from.last_name}`;
      }
    } else if (user.username) {
      displayName = user.username;
    }
    const room = await createPokerRoom(
      roomData,
      (user.id as unknown) as PlayerId,
      displayName,
      ctx.from?.username,
      ctx.chat?.id
    );
    
    // Clear form state
    ctx.formState.delete(namespace, userId);
    
    // Show success message
    const message = ctx.t('🏠 <b>Room Created Successfully!</b>\n\n✅ New poker room is ready!\n\n🎯 <b>Room Details:</b>\n• Name: {{roomName}}\n• Type: {{isPrivate}} ? \'🔒 Private\' : \'🌐 Public\'\n• Players: {{playerCount}}/{{maxPlayers}}\n• Small Blind: {{smallBlind}} coins\n• Timeout: {{turnTimeoutSec}} seconds\n\n📊 <b>Next Steps:</b>\n• Invite your friends\n• Wait for players to join\n• Start the game', {
      roomName: room.name,
      isPrivate: room.isPrivate,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
      smallBlind: room.smallBlind,
      turnTimeoutSec: room.turnTimeoutSec,
      fallback: `🏠 <b>روم با موفقیت ساخته شد!</b>\n\n✅ روم پوکر جدید آماده است!\n\n🎯 <b>مشخصات روم:</b>\n• نام: ${room.name}\n• نوع: ${room.isPrivate ? '🔒 خصوصی' : '🌐 عمومی'}\n• تعداد بازیکنان: ${room.players.length}/${room.maxPlayers}\n• Small Blind: ${room.smallBlind} سکه\n• تایم‌اوت: ${room.turnTimeoutSec} ثانیه\n\n📊 <b>مراحل بعدی:</b>\n• دوستان خود را دعوت کنید\n• منتظر ورود بازیکنان باشید\n• بازی را شروع کنید`
    });

    const keyboard = {
      inline_keyboard: [
        [
          { text: ctx.t('🔗 Share Room'), callback_data: ctx.keyboard.buildCallbackData('games.poker.room.share', { roomId: room.id }) }
        ],
        [
          { text: ctx.t('🔙 Back to Menu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.start', {}) }
        ]
      ]
    };
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    ctx.log.error('Room creation confirmation error', { error: error instanceof Error ? error.message : String(error) });
    
    const message = ctx.t('❌ <b>Room Creation Error</b>\n\nSorry, there was a problem creating the room.\nPlease try again.', {
      fallback: '❌ <b>خطا در ساخت روم</b>\n\nمتأسفانه مشکلی در ساخت روم پیش آمده.\nلطفاً دوباره تلاش کنید.'
    });
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: ctx.t('🔙 Back to Menu'), callback_data: ctx.keyboard.buildCallbackData('games.poker.back', {}) }
        ]]
      }
    });
  }
}

// Import dependencies
import { createPokerRoom } from '../../services/pokerService';
import { PlayerId } from '../../types';

// Self-register with compact router
// Registration is handled by smart-router auto-discovery

export default handleForm; 