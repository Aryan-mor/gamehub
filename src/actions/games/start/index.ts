import { HandlerContext } from '@/modules/core/handler';
import { UserId } from '@/utils/types';
import { isValidUserId } from '@/utils/typeGuards';

/**
 * Handle startgame action
 * Show game selection menu
 */
async function handleStartGame(context: HandlerContext, query: Record<string, string>): Promise<void> {
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
      { text: '🧠 Trivia Game', callbackData: { action: 'games.trivia.start' } },
    ];
    
    const keyboard = createOptimizedKeyboard(buttons, true);
    
    // Send game selection message
    if (ctx.reply) {
      await ctx.reply(
        '🎮 <b>GameHub - Trivia Focus</b>\n\n🧠 Challenge your friends in a competitive 2-player trivia game!\n\n6 rounds, 3 questions per round. Test your knowledge across 10 categories.',
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
      await ctx.reply('🎮 Game selection is currently available for Trivia only.');
    }
  }
}

export default handleStartGame; 