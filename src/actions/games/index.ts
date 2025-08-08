import { HandlerContext } from '@/modules/core/handler';

// Export the action key for consistency and debugging
export const key = 'games';

/**
 * Handle games module messages
 * Routes to specific game modules based on the message path
 */
export async function handleGamesMessage(messageKey: string, context: HandlerContext): Promise<void> {
  try {
    // Parse the message key to extract game type
    const parts = messageKey.split('.');
    
    if (parts.length < 2) {
      throw new Error('Invalid games message format');
    }
    
    // Let auto-discovery router handle all game actions
    // It will automatically find and load the appropriate handler
    // For games.poker.*, games.dice.*, etc.
    // No need to handle specific actions here as auto-discovery will take care of it
  } catch (error) {
    if (context.ctx && context.ctx.log) {
      context.ctx.log.error('handleGamesMessage', { error: error instanceof Error ? error.message : String(error) });
    }
    if (context.ctx && context.ctx.replySmart) {
      await context.ctx.replySmart(context.ctx.t('bot.error.generic'));
    }
  }
} 