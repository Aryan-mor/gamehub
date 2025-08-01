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
    
    const helpText = `<b>GameHub - Poker Game</b>\n\n` +
      `<b>Available Commands:</b>\n\n` +
      `/start - Start the bot\n` +
      `/poker - Start a new poker game\n` +
      `/startgame - Start a new game\n` +
      `/freecoin - Claim your daily free coins\n` +
      `/help - Show this help message\n` +
      `/balance - Show your coin balance\n\n` +
      `<b>How to Play Poker:</b>\n` +
      `• Join or create poker rooms\n` +
      `• Play Texas Hold'em with friends\n` +
      `• Use /poker to start a new game\n` +
      `• Bet, raise, call, or fold\n` +
      `• Win coins by having the best hand\n\n` +
      `<b>Poker Actions:</b>\n` +
      `🃏 Create Room, 🎯 Join Room, 💰 Bet,\n` +
      `📞 Call, 🚀 Raise, 🛑 Fold, 🚪 Leave`;
    
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