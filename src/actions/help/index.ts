import { HandlerContext } from '@/modules/core/handler';
import { isValidUserId } from '@/utils/typeGuards';

// Export the action key for consistency and debugging
export const key = 'help';

/**
 * Handle /help command
 * Show help information and available commands
 */
async function handleHelp(context: HandlerContext): Promise<void> {
  const { user, ctx } = context;
  
  // Validate user ID
  if (!isValidUserId(user.id)) {
    throw new Error('Invalid user ID');
  }
  
  try {
        const helpMessage = `${ctx.t('bot.help.title')}\n\n` +
      `📋 <b>Available Commands:</b>\n` +
      `• ${ctx.t('bot.help.commands.start')}\n` +
      `• ${ctx.t('bot.help.commands.help')}\n` +
      `• ${ctx.t('bot.help.commands.poker')}\n\n` +
      `🎯 <b>How to Play Poker:</b>\n` +
      `1. Create or join a poker room\n` +
      `2. Wait for other players to join\n` +
      `3. Start the game when ready\n` +
      `4. Use Call, Fold, Raise, or Check actions\n` +
      `5. Best 5-card hand wins the pot!\n\n` +
      `💰 <b>Coin System:</b>\n` +
      `• Earn coins by winning games\n` +
      `• Claim 20 free coins daily with /freecoin\n` +
      `• Use coins to stake in games\n\n` +
      `❓ <b>Need More Help?</b>\n` +
      `Contact support or check the game rules.`;

    await ctx.replySmart(helpMessage, { 
      parse_mode: 'HTML'
    });
    
  } catch (error) {
    console.error('Help command error:', error);
    
    // Fallback message
    await ctx.replySmart(ctx.t('bot.common.error'));
  }
}

export default handleHelp; 