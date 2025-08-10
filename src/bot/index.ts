import 'dotenv/config';
import { Bot } from 'grammy';
import { GameHubContext, initializeCorePlugins, getPluginMiddlewareChain } from '@/plugins';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';
import { initializeRoutes } from '@/main-router';
import { registerLogging } from './middleware/logging';
import { registerCallbackDispatcher } from './middleware/callback';
import { registerInlineHandler } from './middleware/inline';
import { registerStartCommand } from './commands/start';
import { registerActiveRoomRedirect } from './middleware/active-room';

const token = process.env.TELEGRAM_BOT_TOKEN;
const botUsername = process.env.TELEGRAM_BOT_USERNAME;

if (!token) throw new Error('TELEGRAM_BOT_TOKEN is required');
if (!botUsername) throw new Error('TELEGRAM_BOT_USERNAME is required');
if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) throw new Error('Invalid TELEGRAM_BOT_TOKEN format');

export const bot = new Bot<GameHubContext>(token);

initializeCorePlugins();
bot.use(getPluginMiddlewareChain());

// Middlewares
registerLogging(bot);
registerActiveRoomRedirect(bot);
registerCallbackDispatcher(bot);
registerInlineHandler(bot);

// Commands
registerStartCommand(bot);

// Routes (module prefixes)
initializeRoutes();

bot.catch((err) => {
  logError('botError', err.error as Error, {});
});

export async function startBot(): Promise<void> {
  logFunctionStart('startBot', {});
  try {
    logFunctionStart('botStartup', {});
    const { i18nPluginInstance } = await import('@/plugins/i18n');
    await i18nPluginInstance.initialize();
    logFunctionEnd('i18nInitialized', {}, {});

    await import('@/actions/games/poker');
    logFunctionEnd('pokerHandlersRegistered', {}, {});

    await bot.api.setMyCommands([{ command: 'start', description: 'Start the bot' }]);
    logFunctionEnd('botCommandsSet', {}, {});

    logFunctionEnd('botRunning', {}, {});
    logFunctionEnd('startBot', {}, {});
    await bot.start();
  } catch (error) {
    logError('startBot', error as Error, {});
    logError('botStartFailure', error as Error, {});
    process.exit(1);
  }
}

let isShuttingDown = false;
function gracefulShutdown(signal: string): void {
  if (isShuttingDown) {
    logFunctionStart('forceShutdown', { signal });
    process.exit(1);
  }
  isShuttingDown = true;
  logFunctionStart('gracefulShutdown', { signal });
  process.exit(0);
}

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

startBot();


