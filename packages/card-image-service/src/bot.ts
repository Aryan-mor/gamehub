import { Bot } from 'grammy';
import { loadConfig } from './config';
import { logger } from './logger';

async function startBot(): Promise<void> {
  try {
    const config = loadConfig();
    const bot = new Bot(config.botToken);

    // Simple health check command
    bot.command('start', (ctx) => {
      ctx.reply('🎴 Card Image Service Bot\n\n✅ Bot is active and ready to generate card images');
    });

    logger.info('Starting Card Image Service Bot...');
    await bot.start();
    logger.info('Card Image Service Bot started successfully');

  } catch (error) {
    logger.error('Failed to start bot', error as Error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the bot
startBot().catch((error) => {
  logger.error('Failed to start bot', error);
  process.exit(1);
}); 