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
    const { setUserProfile, getUser, addCoins } = await import('@/modules/core/userService');
    const { createOptimizedKeyboard } = await import('@/modules/core/interfaceHelpers');
    
    // Import keys from other actions for consistency
    const { key: gamesStartKey } = await import('@/actions/games/start');
    const { key: pokerGameStartKey } = await import('@/actions/games/poker/start');
    const { key: freecoinKey } = await import('@/actions/financial/freecoin');
    const { key: balanceKey } = await import('@/actions/balance');
    const { key: helpKey } = await import('@/actions/help');
    
    // Save user profile
    await setUserProfile(user.id, user.username, user.username || 'Unknown');
    
    // Get user data
    const userData = await getUser(user.id);
    
    // Build welcome message
    let welcome = `${ctx.t('bot.start.welcome')}\n\n` +
      `💰 ${ctx.t('bot.start.tips.freecoin')}\n\n` +
      `🎯 ${ctx.t('bot.start.chooseAction')}`;
    
    // Give 100 coins to new users
    if (userData.coins === 0 && !userData.lastFreeCoinAt) {
      await addCoins(user.id, 100, 'initial grant');
      welcome = `${ctx.t('bot.start.joinBonus')}\n\n` + welcome;
    }
    
    // Create buttons with proper translation
    const createRoomText = ctx.t('bot.buttons.createRoom');
    const joinRoomText = ctx.t('bot.buttons.joinRoom');
    const freeCoinText = ctx.t('bot.buttons.freeCoin');
    const balanceText = ctx.t('bot.buttons.balance');
    const helpText = ctx.t('bot.buttons.help');
    
    const buttons = [
      { text: createRoomText, callbackData: { action: pokerGameStartKey } },
      { text: joinRoomText, callbackData: { action: gamesStartKey } },
      { text: freeCoinText, callbackData: { action: freecoinKey } },
      { text: balanceText, callbackData: { action: balanceKey } },
      { text: helpText, callbackData: { action: helpKey } },
    ];
    
    const keyboard = createOptimizedKeyboard(buttons);
    
    // Send message with keyboard
    await ctx.replySmart(welcome, { 
      parse_mode: 'HTML',
      reply_markup: keyboard 
    });
    
  } catch (error) {
    ctx.log?.error?.('Start command error', { error: error instanceof Error ? error.message : String(error) });
    
    // Fallback message
    await ctx.replySmart(ctx.t('bot.start.welcome'));
  }
}

export default createHandler(handleStart); 