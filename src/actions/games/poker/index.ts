import { HandlerContext } from '@/modules/core/handler';
import { dispatch as smartDispatch, registerModule } from '@/modules/core/smart-router';
import { logFunctionStart, logFunctionEnd, logError } from '@/modules/core/logger';

// Register poker module so smart-router can delegate nested routes here if needed
registerModule('games.poker', async (messageKey: string, context: HandlerContext) => {
  try {
    logFunctionStart('pokerModule', { messageKey, userId: context.user.id });
    await smartDispatch(messageKey, context);
    logFunctionEnd('pokerModule', {}, { messageKey });
  } catch (error) {
    logError('pokerModule', error as Error, { messageKey });
    throw error;
  }
});

export default {};


/**
 * Poker game module handler
 * Routes poker-related messages to appropriate handlers
 */
// No default handler; smart router dispatches to concrete actions.

// Import only the new story handlers we still use
import './start';

// Removed duplicate default export

 