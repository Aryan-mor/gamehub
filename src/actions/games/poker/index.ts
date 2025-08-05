

/**
 * Poker game module handler
 * Routes poker-related messages to appropriate handlers
 */
async function handlePokerMessage(messageKey: string): Promise<void> {
  // This is now handled by the compact router
  // The individual handlers register themselves
  throw new Error(`Poker message routing is now handled by compact router: ${messageKey}`);
}

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

export default handlePokerMessage;

 