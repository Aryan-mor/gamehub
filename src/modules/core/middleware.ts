import { HandlerContext } from './handler';

/**
 * Middleware type definition
 */
export type Middleware = (ctx: HandlerContext, query: Record<string, string>, next: () => Promise<void>) => Promise<void>;

/**
 * Wraps a handler with middleware functions
 * Middlewares are executed in the order provided, and if any middleware throws,
 * the execution stops and the error is propagated
 */
export function wrapWithMiddlewares(
  handler: (ctx: HandlerContext, query: Record<string, string>) => Promise<void>,
  middlewares: Middleware[]
): (ctx: HandlerContext, query: Record<string, string>) => Promise<void> {
  return async (ctx: HandlerContext, query: Record<string, string>): Promise<void> => {
    // Create a chain of middleware functions
    let current = async (): Promise<void> => {
      await handler(ctx, query);
    };

    // Build the chain from right to left
    for (let i = middlewares.length - 1; i >= 0; i--) {
      const middleware = middlewares[i];
      const next = current;
      current = async (): Promise<void> => {
        await middleware(ctx, query, next);
      };
    }

    // Execute the middleware chain
    await current();
  };
}

/**
 * Utility to create middleware that validates a condition
 */
export function createValidationMiddleware(
  validator: (ctx: HandlerContext, query: Record<string, string>) => Promise<boolean>,
  errorMessage: string
): Middleware {
  return async (ctx: HandlerContext, query: Record<string, string>, next: () => Promise<void>): Promise<void> => {
    const isValid = await validator(ctx, query);
    if (!isValid) {
      throw new Error(errorMessage);
    }
    await next();
  };
} 