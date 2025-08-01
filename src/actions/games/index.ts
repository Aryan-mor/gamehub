import { HandlerContext } from '@/modules/core/handler';
import { handlePokerMessage } from './poker';

/**
 * Main games handler
 * Routes to specific games based on the message path
 */
export async function handleGamesMessage(messageKey: string, context: HandlerContext): Promise<void> {
  try {
    // Parse the message key to extract game type
    const parts = messageKey.split('.');
    
    if (parts.length < 2) {
      throw new Error('Invalid games message format');
    }
    
    const gameType = parts[1]; // games.poker.room.call -> poker
    
    // Route to specific game handler
    switch (gameType) {
      case 'poker':
        await handlePokerMessage(messageKey, context);
        break;
      case 'start':
        await handleGamesStart(context);
        break;
      case 'list':
        await handleGamesList(context);
        break;
      default:
        throw new Error(`Unknown game type: ${gameType}`);
    }
  } catch (error) {
    console.error('Games message handling error:', error);
    
    if (context.ctx && context.ctx.reply) {
      await context.ctx.reply('Sorry, there was an error processing your games request.');
    }
  }
}

/**
 * Handle games.start - Show available games
 */
async function handleGamesStart(context: HandlerContext): Promise<void> {
  const availableGames = [
    { id: 'poker', name: 'Poker', description: 'Texas Hold\'em Poker', status: 'active' },
    { id: 'dice', name: 'Dice', description: 'Dice rolling game', status: 'archived' },
    { id: 'blackjack', name: 'Blackjack', description: 'Card game', status: 'archived' },
    { id: 'basketball', name: 'Basketball', description: 'Basketball game', status: 'archived' },
    { id: 'bowling', name: 'Bowling', description: 'Bowling game', status: 'archived' },
    { id: 'football', name: 'Football', description: 'Football game', status: 'archived' },
    { id: 'trivia', name: 'Trivia', description: 'Trivia questions', status: 'archived' }
  ];
  
  const activeGames = availableGames.filter(game => game.status === 'active');
  
  let message = '🎮 **Available Games**\n\n';
  
  activeGames.forEach(game => {
    message += `🎯 **${game.name}**\n`;
    message += `📝 ${game.description}\n`;
    message += `🔗 Use: \`games.${game.id}.start\`\n\n`;
  });
  
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(message, { parse_mode: 'Markdown' });
  }
}

/**
 * Handle games.list - List all games with status
 */
async function handleGamesList(context: HandlerContext): Promise<void> {
  const allGames = [
    { id: 'poker', name: 'Poker', description: 'Texas Hold\'em Poker', status: 'active' },
    { id: 'dice', name: 'Dice', description: 'Dice rolling game', status: 'archived' },
    { id: 'blackjack', name: 'Blackjack', description: 'Card game', status: 'archived' },
    { id: 'basketball', name: 'Basketball', description: 'Basketball game', status: 'archived' },
    { id: 'bowling', name: 'Bowling', description: 'Bowling game', status: 'archived' },
    { id: 'football', name: 'Football', description: 'Football game', status: 'archived' },
    { id: 'trivia', name: 'Trivia', description: 'Trivia questions', status: 'archived' }
  ];
  
  let message = '🎮 **All Games**\n\n';
  
  allGames.forEach(game => {
    const statusEmoji = game.status === 'active' ? '🟢' : '🔴';
    message += `${statusEmoji} **${game.name}** (${game.status})\n`;
    message += `📝 ${game.description}\n\n`;
  });
  
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(message, { parse_mode: 'Markdown' });
  }
} 