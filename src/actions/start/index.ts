import { HandlerContext, createHandler } from '@/modules/core/handler';
import { isValidUserId } from '@/utils/typeGuards';

// Export the action key for consistency and debugging
export const key = 'start';

/**
 * Handle /start command
 * Welcome new users and show main menu
 */
async function handleStart(context: HandlerContext): Promise<void> {
  const { user, ctx } = context;
  
  // Validate user ID
  if (!isValidUserId(user.id)) {
    throw new Error('Invalid user ID');
  }
  
  try {
    // Import required services
    const { setUserProfile } = await import('@/modules/core/userService');
    const { keyboard } = ctx;
    const { ROUTES } = await import('@/modules/core/routes.generated');
    const { encodeAction } = await import('@/modules/core/route-alias');
    const { getPreferredLanguage } = await import('@/modules/global/language');
    
    // Legacy keys intentionally not used to keep minimal main menu
    
    // Save user profile in background to avoid blocking the reply
    const saveProfilePromise = setUserProfile(user.id, user.username, user.username || 'Unknown').catch((err: unknown) => {
      ctx.log?.warn?.('setUserProfile failed (non-blocking)', { error: err instanceof Error ? err.message : String(err) });
    });
    
    // Get user data
    // const userData = await getUser(user.id);
    
    // Build welcome message
    const welcome = `${ctx.t('bot.start.welcome')}\n\n` +
      `💰 ${ctx.t('bot.start.tips.freecoin')}\n\n` +
      `🎯 ${ctx.t('bot.start.chooseAction')}`;
    
    // TODO: Coin system temporarily disabled
    // Give 100 coins to new users
    // if (userData.coins === 0 && !userData.lastFreeCoinAt) {
    //   await addCoins(user.id, 100, 'initial grant');
    //   welcome = `${ctx.t('bot.start.joinBonus')}\n\n` + welcome;
    // }
    
    // If user has no preferred language stored, prompt language selection first
    const preferredLang = await getPreferredLanguage(user.id);
    if (!preferredLang) {
      const title = `🌐 Select your language\n\nلطفاً زبان خود را انتخاب کنید`;
      const setRoute = ROUTES.settings.language.set;
      const enBtn = { text: `🇬🇧 ${ctx.t('settings.language.en') || 'English'}`, callback_data: JSON.stringify({ action: encodeAction(setRoute), lang: 'en' }) };
      const faBtn = { text: `🇮🇷 ${ctx.t('settings.language.fa') || 'فارسی'}`, callback_data: JSON.stringify({ action: encodeAction(setRoute), lang: 'fa' }) };
      const replyMarkup = keyboard.createInlineKeyboard([
        enBtn,
        faBtn,
      ]);
      await ctx.replySmart(title, { reply_markup: replyMarkup, parse_mode: 'HTML' });
      await Promise.race([saveProfilePromise, new Promise<void>((resolve) => setTimeout(resolve, 1000))]);
      return;
    }

    // Create buttons with proper translation
    const helpText = ctx.t('bot.buttons.help');
    
    // New minimal main menu focusing on Poker entry and Help; other actions will be re-added in new stories
    const pokerText = ctx.t('bot.games.poker');
    const settingsText = ctx.t('settings.title') || '⚙️ Settings';
    const settingsRoute = ROUTES.settings._self;
    const buttons = [
      { text: pokerText, callbackData: { action: encodeAction(ROUTES.games.poker.start) } },
      { text: helpText, callbackData: { action: encodeAction(ROUTES.help) } },
      { text: settingsText, callbackData: { action: encodeAction(settingsRoute) } },
    ];

    const replyMarkup = keyboard.createInlineKeyboard(
      buttons.map(b => ({ text: b.text, callback_data: JSON.stringify(b.callbackData) }))
    );

    await ctx.replySmart(welcome, {
      parse_mode: 'HTML',
      reply_markup: replyMarkup
    });
    // Best-effort wait (brief) for profile save without blocking user response
    await Promise.race([saveProfilePromise, new Promise<void>((resolve) => setTimeout(resolve, 1000))]);
    
  } catch (error) {
    ctx.log?.error?.('Start command error', { error: error instanceof Error ? error.message : String(error) });
    
    // Fallback message
    await ctx.replySmart(ctx.t('bot.start.welcome'));
  }
}

export default createHandler(handleStart); 