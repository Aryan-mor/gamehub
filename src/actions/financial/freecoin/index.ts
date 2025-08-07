import { HandlerContext } from '@/modules/core/handler';
import { isValidUserId } from '@/utils/typeGuards';

// Export the action key for consistency and debugging
export const key = 'financial.freecoin';

/**
 * Handle freecoin action
 * Give user daily free coins
 */
async function handleFreeCoin(context: HandlerContext): Promise<void> {
  const { user, ctx } = context;
  
  // Validate user ID
  if (!isValidUserId(user.id)) {
    throw new Error('Invalid user ID');
  }
  
  try {
    // Import required services
    const { getUser, addCoins, setLastFreeCoinAt } = await import('@/modules/core/userService');
    
    // Get user data
    const userData = await getUser(user.id);
    
    // Check if user can claim free coins
    const now = new Date();
    const lastClaim = userData.lastFreeCoinAt ? new Date(userData.lastFreeCoinAt) : null;
    const canClaim = !lastClaim || 
      (now.getTime() - lastClaim.getTime()) >= 24 * 60 * 60 * 1000; // 24 hours
    
    if (canClaim) {
      // Add coins and update last claim time
      await addCoins(user.id, 20, 'daily free coin');
      await setLastFreeCoinAt(user.id);
      
      const successMessage = `${ctx.t('bot.freecoin.success.title')}\n\n` +
        `${ctx.t('bot.freecoin.success.received')}\n\n` +
        `${ctx.t('bot.freecoin.success.newBalance')}: ${userData.coins + 20} ${ctx.t('bot.balance.coinUnit')}\n\n` +
        `${ctx.t('bot.freecoin.success.nextClaim')}\n\n` +
        `${ctx.t('bot.freecoin.success.tip')}`;
      
      await ctx.replySmart(successMessage, { 
        parse_mode: 'HTML'
      });
    } else {
      // Calculate time until next claim
      const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      const hoursLeft = Math.ceil((nextClaim.getTime() - now.getTime()) / (60 * 60 * 1000));
      
      const waitMessage = `${ctx.t('bot.freecoin.wait.title')}\n\n` +
        `${ctx.t('bot.freecoin.wait.alreadyClaimed')}\n\n` +
        `${ctx.t('bot.freecoin.wait.nextClaim')}: ${hoursLeft} ${ctx.t('bot.freecoin.wait.hours')}\n\n` +
        `${ctx.t('bot.freecoin.wait.currentBalance')}: ${userData.coins} ${ctx.t('bot.balance.coinUnit')}\n\n` +
        `${ctx.t('bot.freecoin.wait.tip')}`;
      
      await ctx.replySmart(waitMessage, { 
        parse_mode: 'HTML'
      });
    }
    
  } catch (error) {
    console.error('Freecoin action error:', error);
    
    // Fallback message
    await ctx.replySmart(ctx.t('bot.freecoin.error'));
  }
}

export default handleFreeCoin; 