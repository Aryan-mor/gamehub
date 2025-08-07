import pino from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

export const logFunctionStart = (functionName: string, params?: Record<string, unknown>): void => {
  logger.info({ function: functionName, action: 'start', params });
};

export const logFunctionEnd = (functionName: string, result?: Record<string, unknown>, context?: Record<string, unknown>): void => {
  logger.info({ function: functionName, action: 'end', result, context });
};

export const logError = (functionName: string, error: Error, context?: Record<string, unknown>): void => {
  logger.error({ function: functionName, action: 'error', error: error.message, stack: error.stack, context });
}; 