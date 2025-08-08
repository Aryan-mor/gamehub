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

// Import all handlers for self-registration
import './start';
import './back';
import './room/create';
import './room/create/form';
import './room/start';
import './room/fold';
import './room/ready';
import './room/notready';
import './room/leave';
import './room/join';
import './room/list';
import './room/check';
import './room/call';
import './room/raise';
import './room/allin';
import './room/playagain';
import './room/newgame';
import './room/gameEnd';
import './room/history';
import './room/spectate';
import './room/share';
import './stats';
import './help';

// Removed duplicate default export

 