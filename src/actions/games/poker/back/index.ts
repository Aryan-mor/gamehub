import { HandlerContext, createHandler } from '@/modules/core/handler';

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
    
    const keyboard = ctx.poker.generateMainMenuKeyboard();
    
    await ctx.replySmart(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
  } catch (error) {
    ctx.log.error('Back navigation error', { error: error instanceof Error ? error.message : String(error) });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await ctx.replySmart(ctx.t('poker.navigation.error', { error: errorMessage }));
  }
}

export default createHandler(handleBack);


