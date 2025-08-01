import { HandlerContext } from '@/modules/core/handler';
import { isValidUserId } from '@/utils/typeGuards';

/**
 * Handle freecoin action
 * Claim daily free coins
 */
async function handleFreeCoin(context: HandlerContext): Promise<void> {
  const { user, ctx } = context;
  
  // Validate user ID
  if (!isValidUserId(user.id)) {
    throw new Error('Invalid user ID');
  }
  
  try {
    // Import required services
    const { canClaimDaily, addCoins, setLastFreeCoinAt } = await import('@/modules/core/userService');
    const { createOptimizedKeyboard } = await import('@/modules/core/interfaceHelpers');
    
    // Check if user can claim daily coins
    const { canClaim, nextClaimIn } = await canClaimDaily(user.id);
    
    let message: string;
    if (canClaim) {
      await addCoins(user.id, 20, 'daily free coin');
      await setLastFreeCoinAt(user.id);
      message = `🪙 You claimed <b>+20</b> daily Coins!\n\nCome back tomorrow for more.`;
    } else {
      const timeRemaining = formatTimeRemaining(nextClaimIn);
      message = `⏰ You already claimed today.\n\nCome back in <b>${timeRemaining}</b>.`;
    }
    
    const buttons = [
      { text: '🪙 Claim Again', callbackData: { action: 'financial.freecoin' } },
    ];
    
    const keyboard = createOptimizedKeyboard(buttons, true);
    
    // Send message
    if (ctx.reply) {
      await ctx.reply(message, { 
        parse_mode: 'HTML',
        reply_markup: keyboard 
      });
    }
    
  } catch (error) {
    console.error('FreeCoin action error:', error);
    
    // Fallback message
    if (ctx.reply) {
      await ctx.reply('❌ Failed to claim free coins. Please try again later.');
    }
  }
}

// Helper function for formatting time
const formatTimeRemaining = (milliseconds: number): string => {
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  
  const pad = (n: number): string => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export default handleFreeCoin; 