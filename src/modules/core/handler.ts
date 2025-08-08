import { UserId } from '@/utils/types';
import { GameHubContext } from '@/plugins';
import { logFunctionStart, logFunctionEnd, logError } from './logger';

export interface HandlerContext {
  ctx: GameHubContext; // Use GameHubContext for all plugin features
  user: {
    id: UserId;
    username: string;
  };
  requestId?: string;
}

export type BaseHandler = (context: HandlerContext, query: Record<string, string>) => Promise<void> | void;

/**
 * Create a handler with error handling and logging
 */
export function createHandler(handler: BaseHandler): BaseHandler {
  return async (context: HandlerContext, query: Record<string, string>) => {
    const fn = 'createHandlerWrapper';
    const requestId = context.requestId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    logFunctionStart(fn, { userId: context.user.id, query, requestId });
    try {
      await handler(context, query);
      logFunctionEnd(fn, { success: true }, { userId: context.user.id, requestId });
    } catch (error) {
      logError(fn, error as Error, { userId: context.user.id, requestId });
      
      // Send error message to user if possible
      if (context.ctx && context.ctx.replySmart) {
        await context.ctx.replySmart(context.ctx.t('bot.error.generic'));
      }
    }
  };
}

/**
 * Validate required query parameters
 */
export function validateQuery(query: Record<string, string>, requiredParams: string[]): void {
  const missing = requiredParams.filter(param => !query[param]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
} 