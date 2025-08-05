import { HandlerContext } from '@/modules/core/handler';
import { tryEditMessageText } from '@/modules/core/telegramHelpers';
import { generateMainMenuKeyboard } from './buttonHelpers';
import { register } from '@/modules/core/compact-router';
import { POKER_ACTIONS } from './compact-codes';

/**
 * Handle back navigation to main menu
 */
async function handleBack(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  
  try {
    const message = `🎮 <b>Poker Game Menu</b>\n\n` +
      `Welcome to the Poker Game!\n\n` +
      `🎯 <b>What would you like to do?</b>\n` +
      `• Create a new poker room\n` +
      `• Join an existing room\n` +
      `• View your statistics\n` +
      `• Get help with poker rules\n\n` +
      `🎮 <b>Choose an option:</b>`;
    
    const keyboard = generateMainMenuKeyboard();
    
    await tryEditMessageText(ctx, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Back navigation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await tryEditMessageText(ctx, `❌ Navigation error: ${errorMessage}`);
  }
}

// Self-register with compact router
register(POKER_ACTIONS.BACK, handleBack, 'Go Back');
register(POKER_ACTIONS.BACK_TO_MENU, handleBack, 'Back to Menu');

export default handleBack; 