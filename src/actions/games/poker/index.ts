import { HandlerContext } from '@/modules/core/handler';

/**
 * Handle Poker game messages
 * Routes to specific poker modules based on the message path
 */
export async function handlePokerMessage(messageKey: string, context: HandlerContext): Promise<void> {
  try {
    // Parse the message key to extract module type
    const parts = messageKey.split('.');
    
    if (parts.length < 3) {
      throw new Error('Invalid poker message format');
    }
    
    const moduleType = parts[2]; // games.poker.room.call -> room
    
    // Route to specific poker module
    switch (moduleType) {
      case 'room':
        // Let the auto-discovery router handle room actions
        // It will automatically find and load the appropriate handler
        // For now, just pass through to the next level
        break;
      case 'start':
        await handlePokerStart(context);
        break;
      case 'help':
        await handlePokerHelp(context);
        break;
      default:
        throw new Error(`Unknown poker module: ${moduleType}`);
    }
  } catch (error) {
    console.error('Poker message handling error:', error);
    
    if (context.ctx && context.ctx.reply) {
      await context.ctx.reply('Sorry, there was an error processing your Poker request.');
    }
  }
}

/**
 * Handle poker.start - Show poker game options
 */
async function handlePokerStart(context: HandlerContext): Promise<void> {
  const message = `🎰 **Poker Game**\n\n` +
    `Welcome to Texas Hold'em Poker!\n\n` +
    `**Available Actions:**\n` +
    `🏠 Create Room: \`games.poker.room.create?name=RoomName\`\n` +
    `🚪 Join Room: \`games.poker.room.join?roomId=room_123\`\n` +
    `📋 List Rooms: \`games.poker.room.list\`\n\n` +
    `**Game Actions:**\n` +
    `📞 Call: \`games.poker.room.call?roomId=room_123\`\n` +
    `🃏 Fold: \`games.poker.room.fold?roomId=room_123\`\n` +
    `💰 Raise: \`games.poker.room.raise?roomId=room_123&amount=50\`\n\n` +
    `❓ Help: \`games.poker.help\``;
  
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(message, { parse_mode: 'Markdown' });
  }
}

/**
 * Handle poker.help - Show poker help
 */
async function handlePokerHelp(context: HandlerContext): Promise<void> {
  const message = `🎰 **Poker Help**\n\n` +
    `**Texas Hold'em Rules:**\n` +
    `• Each player gets 2 cards\n` +
    `• 5 community cards are dealt\n` +
    `• Best 5-card hand wins\n\n` +
    `**Betting Actions:**\n` +
    `• Call: Match current bet\n` +
    `• Fold: Give up hand\n` +
    `• Raise: Increase bet\n\n` +
    `**Commands:**\n` +
    `• Start: \`games.poker.start\`\n` +
    `• Help: \`games.poker.help\``;
  
  if (context.ctx && context.ctx.reply) {
    await context.ctx.reply(message, { parse_mode: 'Markdown' });
  }
} 