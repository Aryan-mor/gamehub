import { HandlerContext } from '@/modules/core/handler';
import { isValidUserId } from '@/utils/typeGuards';

/**
 * Handle help action
 * Show help information
 */
async function handleHelp(context: HandlerContext): Promise<void> {
  const { user, ctx } = context;
  
  // Validate user ID
  if (!isValidUserId(user.id)) {
    throw new Error('Invalid user ID');
  }
  
  try {
    // Import required services
    const { createOptimizedKeyboard } = await import('@/modules/core/interfaceHelpers');
    
    const helpText = `<b>GameHub - Trivia Game</b>\n\n` +
      `<b>Available Commands:</b>\n\n` +
      `/start - Start the bot\n` +
      `/trivia - Start a new trivia game\n` +
      `/startgame - Start a new game\n` +
      `/freecoin - Claim your daily free coins\n` +
      `/help - Show this help message\n` +
      `/balance - Show your coin balance\n\n` +
      `<b>How to Play Trivia:</b>\n` +
      `• 2 players compete in 6 rounds\n` +
      `• Each round has 3 questions from one category\n` +
      `• Players take turns choosing categories\n` +
      `• Fast-paced with 10-second time limits\n` +
      `• Win: +20 coins, Draw: +10 coins each\n\n` +
      `<b>Categories:</b>\n` +
      `🌍 Geography, 📚 Literature, ⚽ Sports,\n` +
      `🎬 Entertainment, 🔬 Science, 🎨 Art & Culture,\n` +
      `🍔 Food & Drink, 🌍 History, 🎵 Music, 💻 Technology`;
    
    const buttons = [
      { text: '📋 Commands', callbackData: { action: 'help' } },
    ];
    
    const keyboard = createOptimizedKeyboard(buttons, true);
    
    // Send help message
    if (ctx.reply) {
      await ctx.reply(helpText, { 
        parse_mode: 'HTML',
        reply_markup: keyboard 
      });
    }
    
  } catch (error) {
    console.error('Help action error:', error);
    
    // Fallback message
    if (ctx.reply) {
      await ctx.reply('❓ Help information is temporarily unavailable. Use /start to begin.');
    }
  }
}

export default handleHelp; 