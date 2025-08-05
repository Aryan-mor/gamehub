import pino from 'pino';
import { Context } from 'grammy';
import { LogContext } from './types';

const debug = process.env.DEBUG === 'true';

export const logger = pino({
  enabled: debug || process.env.LOG_LEVEL !== 'silent',
  level: process.env.LOG_LEVEL || (debug ? 'debug' : 'info'),
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      messageFormat: '{msg} {req.method} {req.url} {responseTime}',
    },
  },
});

export const createLogger = (context: LogContext = {}): pino.Logger => {
  return logger.child(context);
};

export const logFunctionStart = (
  functionName: string,
  context: LogContext = {}
): pino.Logger => {
  const log = createLogger(context);
  log.debug({ functionName }, `🔍 ${functionName} called`);
  return log;
};

export const logFunctionEnd = (
  functionName: string,
  result: unknown,
  context: LogContext = {}
): pino.Logger => {
  const log = createLogger(context);
  log.debug({ functionName, result }, `✅ ${functionName} returned`);
  return log;
};

export const logError = (
  functionName: string,
  error: Error,
  context: LogContext = {}
): pino.Logger => {
  const log = createLogger(context);
  log.error({ functionName, error: error.message, stack: error.stack }, `❌ ${functionName} error`);
  return log;
};

// Enhanced logging for Telegram bot context
export const logTelegramUpdate = (
  updateType: string,
  context: LogContext = {}
): pino.Logger => {
  const log = createLogger(context);
  log.debug({ updateType }, `📱 Telegram update: ${updateType}`);
  return log;
};

// Logging middleware for bot
export const loggingMiddleware = async (ctx: Context, next: () => Promise<void>): Promise<void> => {
  const startTime = Date.now();
  const userId = ctx.from?.id?.toString();
  const chatId = ctx.chat?.id?.toString();
  const messageType = ctx.message ? 'message' : ctx.update.callback_query ? 'callback_query' : 'other';
  
  logTelegramUpdate(messageType, { userId, chatId });
  
  try {
    await next();
    const duration = Date.now() - startTime;
    logger.debug({ userId, chatId, duration }, `✅ Request completed in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    logError('botMiddleware', error as Error, { userId, chatId, duration });
    throw error;
  }
};

export default logger; 