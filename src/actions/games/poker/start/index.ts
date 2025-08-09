import { HandlerContext, createHandler } from '@/modules/core/handler';
import { isValidUserId } from '@/utils/typeGuards';
// Use ctx.poker.generateMainMenuKeyboard() instead

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
    const message = ctx.t('poker.start.welcome');
    
    // Generate dynamic keyboard using the new button system
    const keyboard = ctx.poker.generateMainMenuKeyboard();
    // Append back button to games.start
    const backButton = [{ text: ctx.t('poker.room.buttons.back'), callback_data: ctx.keyboard.buildCallbackData('games.start') }];
    keyboard.inline_keyboard.push(backButton);
    
    // Use replySmart to handle message editing/sending
    await ctx.replySmart(message, { 
      parse_mode: 'HTML',
      reply_markup: keyboard 
    });
    
  } catch (error) {
    ctx.log.error('Poker start action error', { error: error instanceof Error ? error.message : String(error) });
    
    // Fallback message
    await ctx.replySmart(ctx.t('poker.start.error.generic'));
  }
}

export default createHandler(handlePokerStart); 