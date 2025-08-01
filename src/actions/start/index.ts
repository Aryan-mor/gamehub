import { HandlerContext } from '@/modules/core/handler';
import { UserId } from '@/utils/types';
import { isValidUserId } from '@/utils/typeGuards';

/**
 * Handle /start command
 * Welcome new users and show main menu
 */
async function handleStart(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { user, ctx } = context;
  
  // Validate user ID
  if (!isValidUserId(user.id)) {
    throw new Error('Invalid user ID');
  }
  
  try {
    // Import required services
    const { setUserProfile, getUser, addCoins } = await import('@/modules/core/userService');
    const { createOptimizedKeyboard, updateOrSendMessage } = await import('@/modules/core/interfaceHelpers');
    
    // Save user profile
    await setUserProfile(user.id, user.username, user.username || 'Unknown');
    
    // Get user data
    const userData = await getUser(user.id);
    
    // Build welcome message
    let welcome = `🧠 <b>Welcome to GameHub - Trivia Edition!</b>\n\n` +
      `🎯 Challenge your friends in competitive 2-player trivia games!\n\n` +
      `💰 Earn and claim daily Coins with /freecoin!\n\n` +
      `🎯 Choose an action below:`;
    
    // Give 100 coins to new users
    if (userData.coins === 0 && !userData.lastFreeCoinAt) {
      await addCoins(user.id, 100, 'initial grant');
      welcome = `🎉 You received <b>100 Coins</b> for joining!\n\n` + welcome;
    }
    
    // Create buttons
    const buttons = [
      { text: '🧠 Start Trivia', callbackData: { action: 'startgame' } },
      { text: '🪙 Free Coin', callbackData: { action: 'freecoin' } },
      { text: '💰 Balance', callbackData: { action: 'balance' } },
      { text: '❓ Help', callbackData: { action: 'help' } },
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