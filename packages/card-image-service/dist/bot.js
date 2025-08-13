"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const config_1 = require("./config");
const logger_1 = require("./logger");
const i18n_1 = require("./i18n");
async function startBot() {
    try {
        const config = (0, config_1.loadConfig)();
        const bot = new grammy_1.Bot(config.botToken);
        await (0, i18n_1.initializeI18n)();
        bot.use((0, i18n_1.i18nMiddleware)());
        bot.command('start', (ctx) => {
            ctx.reply(`${ctx.t('bot.start.title')}\n\n${ctx.t('bot.start.description')}`);
        });
        bot.command('status', (ctx) => {
            ctx.reply(ctx.t('bot.status.running'));
        });
        bot.command('cache', async (ctx) => {
            try {
                const { getCacheStats } = await Promise.resolve().then(() => __importStar(require('./generateAndSendCard')));
                const stats = getCacheStats();
                ctx.reply(`${ctx.t('bot.cache.stats.title')}:\n\n${ctx.t('bot.cache.stats.totalEntries')}: ${stats.totalEntries}\n${ctx.t('bot.cache.stats.expiredEntries')}: ${stats.expiredEntries}`);
            }
            catch (error) {
                logger_1.logger.error('Error getting cache stats', error);
                ctx.reply(ctx.t('bot.cache.error.stats'));
            }
        });
        bot.command('clearcache', async (ctx) => {
            try {
                const { clearCache } = await Promise.resolve().then(() => __importStar(require('./generateAndSendCard')));
                clearCache();
                ctx.reply(ctx.t('bot.cache.cleared'));
            }
            catch (error) {
                logger_1.logger.error('Error clearing cache', error);
                ctx.reply(ctx.t('bot.cache.error.clear'));
            }
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