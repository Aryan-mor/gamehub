import { HandlerContext } from '@/modules/core/handler';
import { UserId } from '@/utils/types';
import { isValidUserId } from '@/utils/typeGuards';

/**
 * Handle balance action
 * Show user's coin balance
 */
async function handleBalance(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { user, ctx } = context;
  
  // Validate user ID
  if (!isValidUserId(user.id)) {
    throw new Error('Invalid user ID');
  }
  
  try {
    // Import required services
    const { getUser } = await import('@/modules/core/userService');
    const { createOptimizedKeyboard } = await import('@/modules/core/interfaceHelpers');
    
    // Get user data
    const userData = await getUser(user.id);
    const message = `💰 <b>Your Balance:</b>\n\n<b>${userData.coins} Coins</b>`;
    
    const buttons = [
      { text: '🪙 Free Coin', callbackData: { action: 'financial.freecoin' } },
      { text: '🎮 Start Game', callbackData: { action: 'games.start' } },
    ];
    
    const keyboard = createOptimizedKeyboard(buttons, true);
    
    // Send balance message
    if (ctx.reply) {
      await ctx.reply(message, { 
        parse_mode: 'HTML',
        reply_markup: keyboard 
      });
    }
    
  } catch (error) {
    console.error('Balance action error:', error);
    
    // Fallback message
    if (ctx.reply) {
      await ctx.reply('❌ Failed to get balance. Please try again later.');
    }
  }
}

export default handleBalance; 