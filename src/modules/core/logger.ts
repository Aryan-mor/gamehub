import pino from 'pino';
import { LogContext } from './types';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

export const createLogger = (context: LogContext = {}) => {
  return logger.child(context);
};

export const logFunctionStart = (
  functionName: string,
  context: LogContext = {}
) => {
  const log = createLogger(context);
  log.info({ functionName }, 'Function started');
  return log;
};

export const logFunctionEnd = (
  functionName: string,
  result: unknown,
  context: LogContext = {}
) => {
  const log = createLogger(context);
  log.info({ functionName, result }, 'Function completed');
  return log;
};

export const logError = (
  functionName: string,
  error: Error,
  context: LogContext = {}
) => {
  const log = createLogger(context);
  log.error({ functionName, error: error.message, stack: error.stack }, 'Function error');
  return log;
};

export default logger; 