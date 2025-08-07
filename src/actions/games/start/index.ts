import { HandlerContext } from '@/modules/core/handler';
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
      { text: ctx.t('bot.games.poker.title'), callbackData: { action: pokerStartKey } },
    ];
    
    const keyboard = createOptimizedKeyboard(buttons, true);
    
    const message = ctx.t('bot.games.start.message');
    
    // Use replySmart to handle message editing/sending
    await ctx.replySmart(message, { 
      parse_mode: 'HTML',
      reply_markup: keyboard 
    });
    
  } catch (error) {
    console.error('StartGame action error:', error);
    
    // Fallback message
    await ctx.replySmart(ctx.t('bot.games.start.fallback'));
  }
}

export default handleStartGame; 