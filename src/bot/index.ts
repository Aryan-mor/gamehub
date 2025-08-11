import 'dotenv/config';
import { Bot } from 'grammy';
import { GameHubContext, initializeCorePlugins, getPluginMiddlewareChain } from '@/plugins';
import { logFunctionStart, logFunctionEnd, logError, logger } from '@/modules/core/logger';
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

// Ultra-early logging: log all incoming updates before any other middleware
bot.use(async (ctx, next) => {
  const updateType = ctx.update.message
    ? 'message'
    : ctx.update.callback_query
      ? 'callback_query'
      : (ctx.update as { inline_query?: unknown }).inline_query
        ? 'inline_query'
        : (ctx.update as { chosen_inline_result?: unknown }).chosen_inline_result
          ? 'chosen_inline_result'
          : 'other';

  logger.info(
    {
      updateId: ctx.update.update_id,
      type: updateType,
      from: ctx.from
        ? {
            id: ctx.from.id,
            first_name: ctx.from.first_name,
            last_name: ctx.from.last_name,
            username: ctx.from.username,
            language_code: ctx.from.language_code,
          }
        : undefined,
      chat: ctx.chat ? { id: ctx.chat.id, type: ctx.chat.type } : undefined,
      text: ctx.message?.text,
      data: ctx.callbackQuery?.data,
    },
    '🔔 Incoming Telegram update'
  );

  await next();
});

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
    // DB healthcheck early in startup to fail-fast if DB is not reachable
    try {
      const { checkSupabaseConnectivity } = await import('@/lib/supabase');
      await checkSupabaseConnectivity(2500);
    } catch (dbErr) {
      logError('startup.db.healthcheck', dbErr as Error, {});
      throw new Error('Database is not reachable. Please ensure Supabase is running and env vars are set.');
    }
    const { i18nPluginInstance } = await import('@/plugins/i18n');
    await i18nPluginInstance.initialize();
    logFunctionEnd('i18nInitialized', {}, {});

    await import('@/actions/games/poker');
    logFunctionEnd('pokerHandlersRegistered', {}, {});

    await bot.api.setMyCommands([{ command: 'start', description: 'Start the bot' }]);
    logFunctionEnd('botCommandsSet', {}, {});

    // Ensure we skip any backlog of updates
    logFunctionStart('dropPendingUpdates', {});
    await bot.api.deleteWebhook({ drop_pending_updates: true });
    logFunctionEnd('dropPendingUpdates', {}, {});

    logFunctionEnd('botRunning', {}, {});
    logFunctionEnd('startBot', {}, {});
    await bot.start({ drop_pending_updates: true });
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


