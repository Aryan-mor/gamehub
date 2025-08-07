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
      
      const successMessage = `🎉 <b>Free Coins Claimed!</b>\n\n` +
        `✅ You received <b>20 coins</b>!\n\n` +
        `💰 <b>New Balance:</b> ${userData.coins + 20} coins\n\n` +
        `⏰ <b>Next Claim:</b> Available in 24 hours\n\n` +
        `💡 <b>Tip:</b> Use these coins to play poker and win more!`;
      
      await ctx.replySmart(successMessage, { 
        parse_mode: 'HTML'
      });
    } else {
      // Calculate time until next claim
      const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      const hoursLeft = Math.ceil((nextClaim.getTime() - now.getTime()) / (60 * 60 * 1000));
      
      const waitMessage = `⏰ <b>Free Coins Not Available</b>\n\n` +
        `❌ You've already claimed your daily coins today.\n\n` +
        `⏳ <b>Next Claim:</b> Available in ${hoursLeft} hours\n\n` +
        `💰 <b>Current Balance:</b> ${userData.coins} coins\n\n` +
        `💡 <b>Tip:</b> Play poker to earn more coins!`;
      
      await ctx.replySmart(waitMessage, { 
        parse_mode: 'HTML'
      });
    }
    
  } catch (error) {
    console.error('Freecoin action error:', error);
    
    // Fallback message
    await ctx.replySmart('❌ Failed to claim free coins. Please try again later.');
  }
}

export default handleFreeCoin; 