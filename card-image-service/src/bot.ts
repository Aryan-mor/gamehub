import { Bot } from 'grammy';
import { loadConfig } from './config';
import { logger } from './logger';
import { initializeI18n, i18nMiddleware, I18nContext } from './i18n';

async function startBot(): Promise<void> {
  try {
    const config = loadConfig();
    const bot = new Bot<I18nContext>(config.botToken);

    // Initialize i18n
    await initializeI18n();

    // Add i18n middleware
    bot.use(i18nMiddleware());

    // Simple health check command
    bot.command('start', (ctx) => {
      ctx.reply(`${ctx.t('🎴 Card Image Service Bot')}\n\n${ctx.t('This bot is used for generating and sending card images.')}`);
    });

    // Status command
    bot.command('status', (ctx) => {
      ctx.reply(ctx.t('✅ Card Image Service is running'));
    });

    // Cache stats command
    bot.command('cache', async (ctx) => {
      try {
        const { getCacheStats } = await import('./generateAndSendCard');
        const stats = getCacheStats();
        ctx.reply(`${ctx.t('📊 Cache Statistics')}:\n\n${ctx.t('Total entries')}: ${stats.totalEntries}\n${ctx.t('Expired entries')}: ${stats.expiredEntries}`);
      } catch (error) {
        logger.error('Error getting cache stats', error as Error);
        ctx.reply(ctx.t('❌ Error getting cache stats'));
      }
    });

    // Clear cache command
    bot.command('clearcache', async (ctx) => {
      try {
        const { clearCache } = await import('./generateAndSendCard');
        clearCache();
        ctx.reply(ctx.t('🗑️ Cache cleared successfully'));
      } catch (error) {
        logger.error('Error clearing cache', error as Error);
        ctx.reply(ctx.t('❌ Error clearing cache'));
      }
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