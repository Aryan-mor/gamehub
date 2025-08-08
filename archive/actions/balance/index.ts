import { HandlerContext, createHandler } from '@/modules/core/handler';
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
    
    const balanceMessage = `${ctx.t('bot.balance.title')}\n\n` +
      `${ctx.t('bot.balance.user')}: ${displayName}\n` +
      `${ctx.t('bot.balance.coins')}: ${userData.coins} ${ctx.t('coins')}\n\n` +
      `${ctx.t('bot.balance.tips.title')}:\n` +
      `• ${ctx.t('bot.balance.tips.freecoin')}\n` +
      `• ${ctx.t('bot.balance.tips.playPoker')}\n` +
      `• ${ctx.t('bot.balance.tips.stake')}`;
    
    await ctx.replySmart(balanceMessage, { 
      parse_mode: 'HTML'
    });
    
  } catch (error) {
    ctx.log.error('Balance action error', { error: error instanceof Error ? error.message : String(error) });
    
    // Fallback message
    await ctx.replySmart(ctx.t('bot.balance.error'));
  }
}

export default createHandler(handleBalance); 