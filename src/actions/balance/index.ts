import { HandlerContext } from '@/modules/core/handler';
import { isValidUserId } from '@/utils/typeGuards';

// Export the action key for consistency and debugging
export const key = 'balance';

/**
 * Handle balance action
 * Show user's coin balance
 */
async function handleBalance(context: HandlerContext): Promise<void> {
  const { user, ctx } = context;
  
  // Validate user ID
  if (!isValidUserId(user.id)) {
    throw new Error('Invalid user ID');
  }
  
  try {
    // Import required services
    const { getUser } = await import('@/modules/core/userService');
    
    // Get user data
    const userData = await getUser(user.id);
    
    // Create display name from first_name + last_name for privacy
    let displayName = 'Unknown';
    if (ctx.from?.first_name) {
      displayName = ctx.from.first_name;
      if (ctx.from.last_name) {
        displayName += ` ${ctx.from.last_name}`;
      }
    } else if (user.username) {
      displayName = user.username;
    }
    
    const balanceMessage = `${ctx.t('💰 <b>Your Coin Balance</b>')}\n\n` +
      `${ctx.t('👤 <b>User</b>')}: ${displayName}\n` +
      `${ctx.t('🪙 <b>Coins</b>')}: ${userData.coins} ${ctx.t('coins')}\n\n` +
      `${ctx.t('💡 <b>Tips</b>')}:\n` +
      `• ${ctx.t('Use /freecoin to claim daily coins')}\n` +
      `• ${ctx.t('Win more coins by playing poker')}\n` +
      `• ${ctx.t('Stake coins to increase your winnings')}`;
    
    await ctx.replySmart(balanceMessage, { 
      parse_mode: 'HTML'
    });
    
  } catch (error) {
    console.error('Balance action error:', error);
    
    // Fallback message
    await ctx.replySmart(ctx.t('❌ Failed to fetch balance. Please try again later.'));
  }
}

export default handleBalance; 