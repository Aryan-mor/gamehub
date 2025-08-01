import { HandlerContext } from '@/modules/core/handler';

/**
 * Handle Poker game messages
 * Routes to specific poker modules based on the message path
 */
export async function handlePokerMessage(messageKey: string, context: HandlerContext): Promise<void> {
  try {
    // Parse the message key to extract module type
    const parts = messageKey.split('.');
    
    if (parts.length < 3) {
      throw new Error('Invalid poker message format');
    }
    
    // Let auto-discovery router handle all poker actions
    // It will automatically find and load the appropriate handler
    // For games.poker.start, games.poker.help, games.poker.room.*, etc.
    // No need to handle specific actions here as auto-discovery will take care of it
  } catch (error) {
    console.error('Poker message handling error:', error);
    
    if (context.ctx && context.ctx.reply) {
      await context.ctx.reply('Sorry, there was an error processing your Poker request.');
    }
  }
}

 