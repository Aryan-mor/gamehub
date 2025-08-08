import { registerModule } from './modules/core/smart-router';

/**
 * Initialize all route handlers
 * This should be called when the application starts
 */
export function initializeRoutes(): void {
  // Register module prefix; poker submodule will self-register
  registerModule('games', async () => { /* no-op for new stories */ });
  
  // Use application logger where available (omitted here)
}

/**
 * Main entry point for handling messages
 */
import { HandlerContext } from './modules/core/handler';

export async function handleMessage(messageKey: string, context: HandlerContext): Promise<void> {
  try {
    const { dispatch } = await import('./modules/core/smart-router');
    await dispatch(messageKey, context);
  } catch {
    // Use centralized logger (omitted here)
    if (context.ctx && context.ctx.replySmart) {
      await context.ctx.replySmart(context.ctx.t('bot.error.generic'));
    }
  }
} 