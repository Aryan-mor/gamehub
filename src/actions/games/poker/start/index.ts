import { HandlerContext } from '@/modules/core/handler';
import { isValidUserId } from '@/utils/typeGuards';
import { generateMainMenuKeyboard } from '../buttonHelpers';
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from '../compact-codes';

// Export the action key for consistency and debugging
export const key = 'games.poker.start';

/**
 * Handle poker.start action
 * Show poker game options and room management
 */
async function handlePokerStart(context: HandlerContext): Promise<void> {
  const { user, ctx } = context;
  
  // Validate user ID
  if (!isValidUserId(user.id)) {
    throw new Error('Invalid user ID');
  }
  
  try {
    const message = `🎰 <b>Poker Game Hub</b>\n\n` +
      `Welcome to Texas Hold'em Poker!\n\n` +
      `🃏 <b>Available Actions:</b>\n` +
      `• Create a new poker room\n` +
      `• Join existing rooms\n` +
      `• View active games\n\n` +
      `💰 <b>How to Play:</b>\n` +
      `• Each player gets 2 cards\n` +
      `• 5 community cards are dealt\n` +
      `• Best 5-card hand wins\n\n` +
      `🎯 Choose an action below:`;
    
    // Generate dynamic keyboard using the new button system
    const keyboard = generateMainMenuKeyboard();
    
    // Use replySmart to handle message editing/sending
    await ctx.replySmart(message, { 
      parse_mode: 'HTML',
      reply_markup: keyboard 
    });
    
  } catch (error) {
    console.error('Poker start action error:', error);
    
    // Fallback message
    await ctx.replySmart('❌ Failed to start poker game. Please try again later.');
  }
}

// Self-register with compact router
register(POKER_ACTIONS.START, handlePokerStart, 'Start Poker Game');

export default handlePokerStart; 