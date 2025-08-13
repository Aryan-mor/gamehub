"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const config_1 = require("./config");
const logger_1 = require("./logger");
async function startBot() {
    try {
        const config = (0, config_1.loadConfig)();
        const bot = new grammy_1.Bot(config.botToken);
        bot.command('start', (ctx) => {
            ctx.reply('🎴 Card Image Service Bot\n\n✅ Bot is active and ready to generate card images');
        });
        logger_1.logger.info('Starting Card Image Service Bot...');
        await bot.start();
        logger_1.logger.info('Card Image Service Bot started successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to start bot', error);
        process.exit(1);
    }
}
process.on('SIGINT', () => {
    logger_1.logger.info('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    logger_1.logger.info('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});
startBot().catch((error) => {
    logger_1.logger.error('Failed to start bot', error);
    process.exit(1);
});
//# sourceMappingURL=bot.js.map