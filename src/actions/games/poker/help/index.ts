import { HandlerContext, createHandler } from '@/modules/core/handler';
import { isValidUserId } from '@/utils/typeGuards';

// Export the action key for consistency and debugging
export const key = 'games.poker.help';

/**
 * Handle poker help action
 * Show poker-specific help information
 */
async function handlePokerHelp(context: HandlerContext): Promise<void> {
  const { user, ctx } = context;
  
  // Validate user ID
  if (!isValidUserId(user.id)) {
    throw new Error('Invalid user ID');
  }
  
  try {
    // Import required services
    const { createOptimizedKeyboard } = await import('@/modules/core/interfaceHelpers');
    
    // Import poker start key for consistency
    const { key: pokerStartKey } = await import('../start');
    
    const helpMessage = ctx.t('poker.help.message');
    
    const buttons = [
      { text: ctx.t('poker.help.startPoker'), callbackData: { action: pokerStartKey } },
    ];
    
    const keyboard = createOptimizedKeyboard(buttons);
    
    await ctx.replySmart(helpMessage, { 
      parse_mode: 'HTML',
      reply_markup: keyboard 
    });
    
  } catch (error) {
    ctx.log.error('Poker help action error', { error: error instanceof Error ? error.message : String(error) });
    
    await ctx.replySmart(ctx.t('poker.help.error'));
  }
}

export default createHandler(handlePokerHelp); 