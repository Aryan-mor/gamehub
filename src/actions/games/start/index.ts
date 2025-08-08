import { HandlerContext, createHandler } from '@/modules/core/handler';
import { isValidUserId } from '@/utils/typeGuards';

// Export the action key for consistency and debugging
export const key = 'games.start';

/**
 * Handle startgame action
 * Show game selection menu
 */
async function handleStartGame(context: HandlerContext): Promise<void> {
  const { user, ctx } = context;
  
  // Validate user ID
  if (!isValidUserId(user.id)) {
    throw new Error('Invalid user ID');
  }
  
  try {
    // Import required services
    const { createOptimizedKeyboard } = await import('@/modules/core/interfaceHelpers');
    
    // Import poker start key for consistency
    const { key: pokerStartKey } = await import('../poker/start');
    
    // Create game selection buttons
    const buttons = [
      { text: ctx.t('bot.games.poker'), callbackData: { action: pokerStartKey } },
    ];
    
    const keyboard = createOptimizedKeyboard(buttons);
    
    const message = ctx.t('bot.games.intro.pokerFocus');
    
    // Use replySmart to handle message editing/sending
    await ctx.replySmart(message, { 
      parse_mode: 'HTML',
      reply_markup: keyboard 
    });
    
  } catch (error) {
    ctx.log?.error?.('StartGame action error', { error: error instanceof Error ? error.message : String(error) });
    
    // Fallback message
    await ctx.replySmart(ctx.t('bot.games.onlyPoker'));
  }
}

export default createHandler(handleStartGame); 