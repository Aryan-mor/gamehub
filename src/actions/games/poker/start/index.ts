import { HandlerContext } from '@/modules/core/handler';
import { isValidUserId } from '@/utils/typeGuards';

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
    // Import required services
    const { createOptimizedKeyboard } = await import('@/modules/core/interfaceHelpers');
    
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
    
    // Create poker action buttons
    const buttons = [
      { text: '🏠 Create Room', callbackData: { action: 'games.poker.room.create' } },
      { text: '🚪 Join Room', callbackData: { action: 'games.poker.room.join' } },
      { text: '📋 List Rooms', callbackData: { action: 'games.poker.room.list' } },
      { text: '❓ Poker Help', callbackData: { action: 'games.poker.help' } },
      { text: '🔙 Back to Menu', callbackData: { action: 'back' } },
    ];
    
    const keyboard = createOptimizedKeyboard(buttons, true);
    
    // Send poker start message
    if (ctx.reply) {
      await ctx.reply(message, { 
        parse_mode: 'HTML',
        reply_markup: keyboard 
      });
    }
    
  } catch (error) {
    console.error('Poker start action error:', error);
    
    // Fallback message
    if (ctx.reply) {
      await ctx.reply('❌ Failed to start poker game. Please try again later.');
    }
  }
}

export default handlePokerStart; 