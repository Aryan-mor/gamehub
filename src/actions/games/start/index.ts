import { HandlerContext } from '@/modules/core/handler';
import { isValidUserId } from '@/utils/typeGuards';

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
    
    // Create game selection buttons
    const buttons = [
      { text: '🃏 Poker Game', callbackData: { action: 'games.poker.start' } },
    ];
    
    const keyboard = createOptimizedKeyboard(buttons, true);
    
    // Send game selection message
    if (ctx.reply) {
      await ctx.reply(
        '🎮 <b>GameHub - Poker Focus</b>\n\n🃏 Challenge your friends in competitive poker games!\n\nJoin rooms, play Texas Hold\'em, and compete for coins.',
        { 
          parse_mode: 'HTML',
          reply_markup: keyboard 
        }
      );
    }
    
  } catch (error) {
    console.error('StartGame action error:', error);
    
    // Fallback message
    if (ctx.reply) {
      await ctx.reply('🎮 Game selection is currently available for Poker only.');
    }
  }
}

export default handleStartGame; 