import { HandlerContext, createHandler } from '@/modules/core/handler';
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
      
      const successMessage = `${ctx.t('bot.freecoin.claimed.title')}\n\n` +
        `${ctx.t('bot.freecoin.claimed.received', { amount: 20 })}\n\n` +
        `${ctx.t('bot.freecoin.balance.new')}: ${userData.coins + 20} ${ctx.t('coins')}\n\n` +
        `${ctx.t('bot.freecoin.nextClaim.24h')}\n\n` +
        `${ctx.t('bot.freecoin.tip')}`;
      
      await ctx.replySmart(successMessage, { 
        parse_mode: 'HTML'
      });
    } else {
      // Calculate time until next claim
      const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      const hoursLeft = Math.ceil((nextClaim.getTime() - now.getTime()) / (60 * 60 * 1000));
      
      const waitMessage = `${ctx.t('bot.freecoin.unavailable.title')}\n\n` +
        `${ctx.t('bot.freecoin.unavailable.alreadyClaimed')}\n\n` +
        `${ctx.t('bot.freecoin.nextClaim.inPrefix')}: ${hoursLeft} ${ctx.t('hours')}\n\n` +
        `${ctx.t('bot.freecoin.balance.current')}: ${userData.coins} ${ctx.t('coins')}\n\n` +
        `${ctx.t('bot.freecoin.tip.playMore')}`;
      
      await ctx.replySmart(waitMessage, { 
        parse_mode: 'HTML'
      });
    }
    
  } catch (error) {
    ctx.log?.error?.('Freecoin action error', { error: error instanceof Error ? error.message : String(error) });
    
    // Fallback message
    await ctx.replySmart(ctx.t('bot.freecoin.error'));
  }
}

export default createHandler(handleFreeCoin); 