import { HandlerContext } from '@/modules/core/handler';
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
    let welcome = `🃏 <b>Welcome to GameHub - Poker Edition!</b>\n\n` +
      `🎯 Challenge your friends in competitive poker games!\n\n` +
      `💰 Earn and claim daily Coins with /freecoin!\n\n` +
      `🎯 Choose an action below:`;
    
    // Give 100 coins to new users
    if (userData.coins === 0 && !userData.lastFreeCoinAt) {
      await addCoins(user.id, 100, 'initial grant');
      welcome = `🎉 You received <b>100 Coins</b> for joining!\n\n` + welcome;
    }
    
    // Create buttons
    const buttons = [
      { text: '🃏 Start Poker', callbackData: { action: pokerGameStartKey } },
      { text: '🃏 Start Games', callbackData: { action: gamesStartKey } },
      { text: '🪙 Free Coin', callbackData: { action: freecoinKey } },
      { text: '💰 Balance', callbackData: { action: balanceKey } },
      { text: '❓ Help', callbackData: { action: helpKey } },
    ];
    
    const keyboard = createOptimizedKeyboard(buttons);
    
    // Send message with keyboard
    if (ctx.reply) {
      await ctx.reply(welcome, { 
        parse_mode: 'HTML',
        reply_markup: keyboard 
      });
    }
    
  } catch (error) {
    console.error('Start command error:', error);
    
    // Fallback message
    if (ctx.reply) {
      await ctx.reply('🎮 Welcome to GameHub!÷÷÷÷\n\nUse /help to see available commands.');
    }
  }
}

export default handleStart; 