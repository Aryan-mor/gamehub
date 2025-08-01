import { HandlerContext } from '@/modules/core/handler';
import { isValidUserId } from '@/utils/typeGuards';

/**
 * Handle poker.help action
 * Show detailed poker rules and commands
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
    
    const helpText = `🎰 <b>Poker Help & Rules</b>\n\n` +
      `🃏 <b>Texas Hold'em Rules:</b>\n` +
      `• Each player receives 2 private cards\n` +
      `• 5 community cards are dealt face-up\n` +
      `• Players use best 5-card combination\n` +
      `• Highest hand wins the pot\n\n` +
      `💰 <b>Betting Actions:</b>\n` +
      `• <b>Call:</b> Match current bet\n` +
      `• <b>Fold:</b> Give up hand and exit\n` +
      `• <b>Raise:</b> Increase current bet\n` +
      `• <b>Check:</b> Pass without betting (if no bet)\n\n` +
      `🏆 <b>Hand Rankings (highest to lowest):</b>\n` +
      `1. Royal Flush: A-K-Q-J-10 same suit\n` +
      `2. Straight Flush: 5 consecutive same suit\n` +
      `3. Four of a Kind: 4 cards same rank\n` +
      `4. Full House: 3 of kind + 2 of kind\n` +
      `5. Flush: 5 cards same suit\n` +
      `6. Straight: 5 consecutive cards\n` +
      `7. Three of a Kind: 3 cards same rank\n` +
      `8. Two Pair: 2 pairs\n` +
      `9. One Pair: 2 cards same rank\n` +
      `10. High Card: Highest card wins\n\n` +
      `🎮 <b>Commands:</b>\n` +
      `/poker - Start poker game\n` +
      `/start - Main menu\n` +
      `/help - General help\n` +
      `/balance - Check coins`;
    
    const buttons = [
      { text: '🎰 Start Poker', callbackData: { action: 'games.poker.start' } },
      { text: '🔙 Back to Menu', callbackData: { action: 'back' } },
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
    console.error('Poker help action error:', error);
    
    // Fallback message
    if (ctx.reply) {
      await ctx.reply('❓ Poker help is temporarily unavailable. Use /start to begin.');
    }
  }
}

export default handlePokerHelp; 