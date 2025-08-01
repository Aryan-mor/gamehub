import { registerModule } from './modules/core/smart-router';
import { handleGamesMessage } from './actions/games';

/**
 * Initialize all route handlers
 * This should be called when the application starts
 */
export function initializeRoutes(): void {
  // Register the main games module handler
  registerModule('games', handleGamesMessage);
  
  console.log('✅ Smart Router initialized successfully');
  console.log('📡 Available routes:');
  console.log('  • games.start - Show available games');
  console.log('  • games.list - List all games with status');
  console.log('  • games.poker.start - Poker game options');
  console.log('  • games.poker.help - Poker help');
  console.log('  • games.poker.room.* - Auto-discovered room actions');
  console.log('    - games.poker.room.create');
  console.log('    - games.poker.room.join');
  console.log('    - games.poker.room.leave');
  console.log('    - games.poker.room.call');
  console.log('    - games.poker.room.fold');
  console.log('    - games.poker.room.raise');
  console.log('  • Any new action will be auto-discovered!');
}

/**
 * Main entry point for handling messages
 */
export async function handleMessage(messageKey: string, context: any): Promise<void> {
  try {
    const { dispatch } = await import('./modules/core/smart-router');
    await dispatch(messageKey, context);
  } catch (error) {
    console.error('Message handling error:', error);
    
    if (context.ctx && context.ctx.reply) {
      await context.ctx.reply('Sorry, there was an error processing your request.');
    }
  }
} 