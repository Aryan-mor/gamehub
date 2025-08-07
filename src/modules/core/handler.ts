import { UserId } from '@/utils/types';
import { GameHubContext } from '@/plugins';

export interface HandlerContext {
  ctx: GameHubContext; // Use GameHubContext for all plugin features
  user: {
    id: UserId;
    username: string;
  };
}

export type BaseHandler = (context: HandlerContext, query: Record<string, string>) => Promise<void> | void;

/**
 * Create a handler with error handling and logging
 */
export function createHandler(handler: BaseHandler): BaseHandler {
  return async (context: HandlerContext, query: Record<string, string>) => {
    try {
      await handler(context, query);
    } catch (error) {
      console.error(`Handler error:`, error);
      
      // Send error message to user if possible
      if (context.ctx && context.ctx.reply) {
        await context.ctx.reply('An error occurred while processing your request.');
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