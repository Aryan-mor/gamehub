import { Context } from 'grammy';
import pino from 'pino';
import { GameHubContext, GameHubPlugin, ContextBuilder } from './context';
import { logFunctionStart, logFunctionEnd, logError, logger } from '../modules/core/logger';

/**
 * Logging Plugin
 * Provides enhanced logging functionality for the bot
 */
export class LoggingPlugin implements GameHubPlugin {
  name = 'logging';
  version = '1.0.0';

  buildContext: ContextBuilder = (ctx: Context): Partial<GameHubContext> => {
    const userId = ctx.from?.id?.toString();
    const chatId = ctx.chat?.id?.toString();
    
    return {
      log: {
        debug: (message: string, context?: Record<string, unknown>) => {
          logger.debug({ userId, chatId, ...context }, message);
        },
        info: (message: string, context?: Record<string, unknown>) => {
          logger.info({ userId, chatId, ...context }, message);
        },
        warn: (message: string, context?: Record<string, unknown>) => {
          logger.warn({ userId, chatId, ...context }, message);
        },
        error: (message: string, context?: Record<string, unknown>) => {
          logger.error({ userId, chatId, ...context }, message);
        }
      }
    };
  };

  middleware = async (ctx: GameHubContext, next: () => Promise<void>): Promise<void> => {
    const startTime = Date.now();
    const userId = ctx.from?.id?.toString();
    const chatId = ctx.chat?.id?.toString();
    const messageType = ctx.message ? 'message' : ctx.update.callback_query ? 'callback_query' : 'other';
    
    ctx.log.debug(`📱 Telegram update: ${messageType}`, { messageType });
    
    try {
      await next();
      const duration = Date.now() - startTime;
      ctx.log.debug(`✅ Request completed in ${duration}ms`, { duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      ctx.log.error(`❌ Request failed after ${duration}ms`, { 
        duration, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  };
}

// Export plugin instance
export const loggingPluginInstance = new LoggingPlugin();

// Legacy function for backward compatibility
export function loggingMiddleware(): (ctx: GameHubContext, next: () => Promise<void>) => Promise<void> {
  return loggingPluginInstance.middleware;
}

// Export logger for direct access
export { logger }; 