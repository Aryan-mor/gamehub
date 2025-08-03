import { HandlerContext } from '@/modules/core/handler';
import { isValidUserId } from '@/utils/typeGuards';

// Export the action key for consistency and debugging
export const key = 'games.poker.help';

/**
 * Handle poker help action
 * Show poker-specific help information
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
    
    // Import poker start key for consistency
    const { key: pokerStartKey } = await import('../start');
    
    const helpMessage = `🎰 <b>Poker Game Help</b>\n\n` +
      `🃏 <b>Texas Hold'em Poker Rules:</b>\n\n` +
      `📋 <b>Game Setup:</b>\n` +
      `• Each player gets 2 hole cards\n` +
      `• 5 community cards are dealt face up\n` +
      `• Best 5-card hand wins the pot\n\n` +
      `🎯 <b>Betting Rounds:</b>\n` +
      `1. Pre-flop: After hole cards\n` +
      `2. Flop: First 3 community cards\n` +
      `3. Turn: 4th community card\n` +
      `4. River: 5th community card\n\n` +
      `🃏 <b>Actions:</b>\n` +
      `• Call: Match current bet\n` +
      `• Raise: Increase the bet\n` +
      `• Fold: Give up hand\n` +
      `• Check: Pass without betting (if no bet)\n` +
      `• All-in: Bet all remaining chips\n\n` +
      `💰 <b>Hand Rankings:</b>\n` +
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
      `🎮 <b>Ready to Play?</b>\n` +
      `Click the button below to start a poker game!`;
    
    const buttons = [
      { text: '🎰 Start Poker', callbackData: { action: pokerStartKey } },
    ];
    
    const keyboard = createOptimizedKeyboard(buttons, true);
    
    if (ctx.reply) {
      await ctx.reply(helpMessage, { 
        parse_mode: 'HTML',
        reply_markup: keyboard 
      });
    }
    
  } catch (error) {
    console.error('Poker help action error:', error);
    
    // Fallback message
    if (ctx.reply) {
      await ctx.reply('❌ Failed to show poker help. Please try again later.');
    }
  }
}

export default handlePokerHelp; 