import 'dotenv/config';
import { Bot } from 'grammy';
// Legacy functions moved to plugins - use ctx.telegram instead
import { extractUserInfo } from './plugins/user';

// Archived games are no longer imported - using new auto-discovery router system
import { HandlerContext } from './modules/core/handler';
import { UserId } from './utils/types';
import { logFunctionStart, logFunctionEnd, logError } from './modules/core/logger';
// import { api } from './lib/api';
import { Context } from 'grammy';
import { GameHubContext, initializeCorePlugins, getPluginMiddlewareChain } from './plugins';
// telegramHelpers removed; relying on ctx.api and replySmart

/**
 * GameHub Telegram Bot
 * 
 * Signal Handling:
 * - SIGINT (Ctrl+C): Graceful shutdown
 * - SIGTERM: Graceful shutdown
 * - Exits immediately to prevent double signal issues
 */
// Focus on poker game
// import { registerDiceHandlers } from './games/dice';
// import { registerBasketballHandlers } from './games/basketball';
// import { registerFootballHandlers } from './games/football';
// import { registerBlackjackHandlers } from './games/blackjack';
// import { registerBowlingHandlers } from './games/bowling';

const token = process.env.TELEGRAM_BOT_TOKEN;
const botUsername = process.env.TELEGRAM_BOT_USERNAME;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

if (!botUsername) {
  throw new Error('TELEGRAM_BOT_USERNAME is required');
}

// Validate token format
if (!token.match(/^\d+:[A-Za-z0-9_-]+$/)) {
  throw new Error(
    'Invalid TELEGRAM_BOT_TOKEN format. Expected format: <bot_id>:<bot_token>'
  );
}

export const bot = new Bot<GameHubContext>(token);

// Initialize and register all core plugins
initializeCorePlugins();

// Add the complete plugin middleware chain
bot.use(getPluginMiddlewareChain());

// Add active game redirect middleware (early in the chain)
bot.use(async (ctx, next) => {
  try {
    // Import and run active game redirect middleware
    const { activeGameRedirect } = await import('./actions/games/poker/room/_middleware/active_game_redirect');
    await activeGameRedirect(ctx);
    
    // If the message was handled by active game redirect, don't continue
    if ((ctx as Context & { handled?: boolean }).handled) {
      ctx.log?.info?.('Message handled by active game redirect');
      return;
    }
    
    await next();
  } catch (error) {
    ctx.log?.error?.('Error in active game redirect middleware', { error: error instanceof Error ? error.message : String(error) });
    await next(); // Continue with normal processing
  }
});

// Game handlers are now auto-discovered through the smart router system

// Removed legacy compact router room-join conflict callbacks; handled via smart-router buttons

// Simple callback logging (without interfering with handlers)
bot.use(async (ctx, next) => {
  // Log ALL incoming updates for debugging
  ctx.log?.debug?.('Incoming update', {
    type: ctx.update.message ? 'message' : ctx.update.callback_query ? 'callback_query' : 'other',
    userId: ctx.from?.id,
    username: ctx.from?.username,
    chatId: ctx.chat?.id,
  });
  
  if (ctx.callbackQuery) {
    ctx.log?.debug?.('Callback data', { data: ctx.callbackQuery.data || 'No data' });
  }
  
  if (ctx.message?.text) {
    ctx.log?.debug?.('Message text', { text: ctx.message.text });
  }
  
  if (ctx.message?.from) {
    ctx.log?.debug?.('Message from', { firstName: ctx.message.from.first_name, lastName: ctx.message.from.last_name, username: ctx.message.from.username });
  }
  
  await next();
});
// Focus on poker game
// registerDiceHandlers(bot);
// registerBasketballHandlers(bot);
// registerFootballHandlers(bot);
// registerBlackjackHandlers(bot);
// registerBowlingHandlers(bot);



// Helper function to handle room join
async function handleRoomJoin(ctx: GameHubContext, userInfo: { userId: string; username?: string }, roomId: string, format: string): Promise<void> {
  ctx.log?.info?.('Processing room join', {
    via: format.toUpperCase(),
    roomId,
    userId: userInfo.userId,
    username: userInfo.username,
    chatId: ctx.chat?.id,
    messageText: ctx.message?.text,
    startPayload: ctx.message?.text?.split(' ')[1],
  });
  
  // Import and call the join handler directly
  const handleJoin = (await import('./actions/games/poker/room/join')).default;
  
  const context: HandlerContext = {
    ctx,
    user: {
      id: userInfo.userId as UserId,
      username: userInfo.username || 'Unknown'
    }
  };
  
  // Call join handler with direct link flag
  try {
    ctx.log?.info?.('Calling handleJoin', { roomId });
    await handleJoin(context, { roomId, isDirectLink: 'true' });
    ctx.log?.info?.('Successfully called handleJoin', { roomId });
  } catch (error) {
    ctx.log?.error?.('Error calling handleJoin', { roomId, error: error instanceof Error ? error.message : String(error) });
    // Don't send error message here - handleJoin will handle it
  }
}

// Handle /start command using auto-discovery router
bot.command('start', async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    const startPayload = ctx.message?.text?.split(' ')[1]; // Get payload after /start
    
    ctx.log?.info?.('START command received', { userId: userInfo.userId, username: userInfo.username, text: ctx.message?.text, startPayload });
    
    logFunctionStart('startCommand', { userId: userInfo.userId, startPayload });
    
    // Check if this is a room join request (new format: gpj-)
    if (startPayload && startPayload.startsWith('gpj-')) {
      const roomId = startPayload.substring(4); // Remove 'gpj-' prefix (4 characters)
      ctx.log?.info?.('Detected room join via start', { roomId, startPayload });
      await handleRoomJoin(ctx, userInfo, roomId, 'gpj');
      logFunctionEnd('startCommand', {}, { userId: userInfo.userId, action: 'roomJoin' });
      return;
    }
    
    // Check if this is a room join request (new format: gprs_)
    if (startPayload && startPayload.startsWith('gprs_')) {
      const roomId = startPayload.substring(5); // Remove 'gprs_' prefix (5 characters)
      ctx.log?.info?.('Detected room join via start', { roomId, startPayload });
      await handleRoomJoin(ctx, userInfo, roomId, 'gprs');
      logFunctionEnd('startCommand', {}, { userId: userInfo.userId, action: 'roomJoin' });
      return;
    }
    
    // Check if this is a room join request (legacy format: jgpr_room_)
    if (startPayload && startPayload.startsWith('jgpr_room_')) {
      const roomId = startPayload.substring(5); // Remove 'jgpr_' prefix to get the full room ID
      ctx.log?.info?.('Detected room join via start (legacy room_)', { roomId, startPayload });
      await handleRoomJoin(ctx, userInfo, roomId, 'jgpr_room');
      logFunctionEnd('startCommand', {}, { userId: userInfo.userId, action: 'roomJoin' });
      return;
    }
    
    // Check if this is a room join request (legacy format: jgpr_)
    if (startPayload && startPayload.startsWith('jgpr_') && !startPayload.startsWith('jgpr_room_')) {
      // Legacy format without room_ prefix
      const roomId = startPayload.substring(5); // Remove 'jgpr_' prefix (5 characters)
      ctx.log?.info?.('Detected room join via start (legacy jgpr_)', { roomId, startPayload, userId: userInfo.userId, username: userInfo.username });
      await handleRoomJoin(ctx, userInfo, roomId, 'jgpr');
      logFunctionEnd('startCommand', {}, { userId: userInfo.userId, action: 'roomJoin' });
      return;
    }
    
    // Check if this is a room join request (legacy format: room_)
    if (startPayload && startPayload.startsWith('room_')) {
      const roomId = startPayload.substring(5); // Remove 'room_' prefix
      ctx.log?.info?.('Detected room join via start (legacy room_)', { roomId });
      await handleRoomJoin(ctx, userInfo, roomId, 'room');
      logFunctionEnd('startCommand', {}, { userId: userInfo.userId, action: 'roomJoin' });
      return;
    }
    
    // Use auto-discovery router for regular start action
    const { dispatch } = await import('./modules/core/smart-router');
    
    const context: HandlerContext = {
      ctx,
      user: {
        id: userInfo.userId as UserId,
        username: userInfo.username || 'Unknown'
      }
    };
    
    await dispatch('start', context);
    
    logFunctionEnd('startCommand', {}, { userId: userInfo.userId, action: 'regular' });
  } catch (error) {
    logError('startCommand', error as Error, {});
    await ctx.replySmart(ctx.t('bot.start.welcome'));
  }
});



// Only /start is active; other commands are handled via inline buttons



// balance command disabled

// freecoin command disabled

// poker command disabled

// Inline query flow disabled — only buttons and /start



// /games disabled — use buttons in UI

// Handle share_room callback queries (legacy, non-JSON)
bot.callbackQuery(/^share_room_.*/, async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    const callbackData = ctx.callbackQuery.data || '';
    
    ctx.log?.info?.('share_room received', { userId: userInfo.userId, callbackData, chatId: ctx.chat?.id, raw: ctx.callbackQuery.data });
    
    logFunctionStart('share_room', { 
      userId: userInfo.userId, 
      callbackData,
      context: 'share_room'
    });
    
    await ctx.api.answerCallbackQuery(ctx.callbackQuery.id);
    
    // Extract roomId from callback data
    const roomId = callbackData.replace('share_room_', '');
    
    ctx.log?.debug?.('Parsed room id from share_room', { roomId });
    
    if (!roomId) {
      throw new Error('Room ID not found in callback data');
    }
    
    // Import and call the share handler directly
    const handleShare = (await import('./actions/games/poker/room/share')).default;
    
    const context: HandlerContext = {
      ctx,
      user: {
        id: userInfo.userId as UserId,
        username: userInfo.username || 'Unknown'
      }
    };
    
    ctx.log?.info?.('Calling share handler', { roomId });
    await handleShare(context, { roomId });
    ctx.log?.info?.('Share handler completed', { roomId });
    
    logFunctionEnd('share_room', {}, { 
      userId: userInfo.userId, 
      roomId,
      context: 'share_room'
    });
  } catch (error) {
    ctx.log?.error?.('share_room error', { error: error instanceof Error ? error.message : String(error) });
    logError('share_room', error as Error, {});
    await ctx.api.answerCallbackQuery(ctx.callbackQuery.id, { text: ctx.t('bot.error.generic') });
  }
});

// Generic JSON-based callback dispatcher
function parseActionAndParams(raw: string): { action?: string; params: Record<string, string> } {
  // Try JSON first
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    if (obj && typeof obj === 'object' && typeof obj.action === 'string') {
      const { action, ...rest } = obj as Record<string, unknown> & { action: string };
      const params: Record<string, string> = {};
      for (const [k, v] of Object.entries(rest)) params[k] = String(v);
      return { action, params };
    }
  } catch {
    // ignore
  }
  // Support querystring style: action?x=y
  if (raw.includes('?')) {
    const [action, qs] = raw.split('?');
    const usp = new URLSearchParams(qs);
    const params: Record<string, string> = {};
    for (const [k, v] of usp.entries()) params[k] = v;
    return { action, params };
  }
  // Raw action string
  if (raw) return { action: raw, params: {} };
  return { action: undefined, params: {} };
}

bot.on('callback_query:data', async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    const raw = ctx.callbackQuery.data || '';
    const { action, params } = parseActionAndParams(raw);

    // Ignore legacy non-JSON share_room_ here; handled by its dedicated handler
    if (!action || raw.startsWith('share_room_')) {
      await ctx.api.answerCallbackQuery(ctx.callbackQuery.id);
      return;
    }

    logFunctionStart('callback_dispatch', {
      userId: userInfo.userId,
      action,
      params
    });

    await ctx.api.answerCallbackQuery(ctx.callbackQuery.id);

    const { dispatch } = await import('./modules/core/smart-router');

    const context: HandlerContext = {
      ctx,
      user: {
        id: userInfo.userId as UserId,
        username: userInfo.username || 'Unknown'
      }
    };

    // Attach parsed params for handlers that read _query
    (context as HandlerContext & { _query?: Record<string, string> })._query = params;

    await dispatch(action, context);

    logFunctionEnd('callback_dispatch', {}, { userId: userInfo.userId, action });
  } catch (error) {
    logError('callback_dispatch', error as Error, {});
    await ctx.api.answerCallbackQuery(ctx.callbackQuery.id, { text: ctx.t('❌ An error occurred. Please try again.') });
  }
});

// Removed compact router handler; all callbacks should be smart-router JSON

// Focus on poker game
// bot.callbackQuery(/.*"action":"newgame".*/, async (ctx) => {
//   try {
//     const userInfo = extractUserInfo(ctx);
//     const data = parseCallbackData(ctx.callbackQuery.data || '');
//     
//     logFunctionStart('menu_newgame', { 
//       userId: userInfo.userId, 
//       action: 'newgame',
//       context: 'main_menu',
//       gameType: data.gameType || 'none'
//     });
//     
//     await answerCallbackQuery(bot, ctx.callbackQuery.id);
//     await handleNewGame(bot, userInfo, data);
//     
//     logFunctionEnd('menu_newgame', {}, { 
//       userId: userInfo.userId, 
//       action: 'newgame',
//       context: 'main_menu'
//     });
//   } catch (error) {
//     logError('menu_newgame', error as Error, {});
//     await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
//   }
// });

// Specific handlers for help/balance/freecoin are no longer needed; generic dispatcher handles them

// Helper functions for callback handlers
// Focus on poker game
// const triggerDiceGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
//   logFunctionStart('triggerDiceGame', { 
//     userId: userInfo.userId, 
//     context: 'dice_game',
//     step: 'stake_selection'
//   });
//   
//           const buttons = [
//           { text: '2 Coins', callbackData: { action: 'dice_stake', stake: 2 } },
//           { text: '5 Coins', callbackData: { action: 'dice_stake', stake: 5 } },
//           { text: '10 Coins', callbackData: { action: 'dice_stake', stake: 10 } },
//           { text: '20 Coins', callbackData: { action: 'dice_stake', stake: 20 } },
//         ];
//         const stakeKeyboard = createOptimizedKeyboard(buttons, true);
//   
//   await updateGameMessage(bot, userInfo.chatId, 
//     '🎲 <b>Dice Game</b>\n\nGuess the dice number!\n\nChoose your stake amount:',
//     stakeKeyboard, userInfo.userId, 'dice', 'stake_selection'
//   );
//   
//   logFunctionEnd('triggerDiceGame', { success: true }, { 
//     userId: userInfo.userId, 
//     context: 'dice_game',
//     step: 'stake_selection'
//   });
// };

// const triggerBasketballGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
//   logFunctionStart('triggerBasketballGame', { 
//     userId: userInfo.userId, 
//     context: 'basketball_game',
//     step: 'stake_selection'
//   });
//   
//           const buttons = [
//           { text: '2 Coins', callbackData: { action: 'basketball_stake', stake: 2 } },
//           { text: '5 Coins', callbackData: { action: 'basketball_stake', stake: 5 } },
//           { text: '10 Coins', callbackData: { action: 'basketball_stake', stake: 10 } },
//           { text: '20 Coins', callbackData: { action: 'basketball_stake', stake: 20 } },
//         ];
//         const stakeKeyboard = createOptimizedKeyboard(buttons, true);
//   
//   await updateGameMessage(bot, userInfo.chatId, 
//     '🏀 <b>Basketball Game</b>\n\nGuess if you will score or miss!\n\nChoose your stake amount:',
//     stakeKeyboard, userInfo.userId, 'basketball', 'stake_selection'
//   );
//   
//   logFunctionEnd('triggerBasketballGame', { success: true }, { 
//     userId: userInfo.userId, 
//     context: 'basketball_game',
//     step: 'stake_selection'
//   });
// };

// const triggerFootballGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
//           const buttons = [
//           { text: '2 Coins', callbackData: { action: 'football_stake', stake: 2 } },
//           { text: '5 Coins', callbackData: { action: 'football_stake', stake: 5 } },
//           { text: '10 Coins', callbackData: { action: 'football_stake', stake: 10 } },
//           { text: '20 Coins', callbackData: { action: 'football_stake', stake: 20 } },
//         ];
//         const stakeKeyboard = createOptimizedKeyboard(buttons, true);
//   
//   await updateGameMessage(bot, userInfo.chatId, 
//     '⚽️ <b>Football Game</b>\n\nPredict the ball direction!\n\nChoose your stake amount:',
//     stakeKeyboard, userInfo.userId, 'football', 'stake_selection'
//   );
// };

// const triggerBlackjackGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
//   const buttons = [
//     { text: '2 Coins', callbackData: { action: 'blackjack_stake', stake: 2 } },
//     { text: '5 Coins', callbackData: { action: 'blackjack_stake', stake: 5 } },
//     { text: '10 Coins', callbackData: { action: 'blackjack_stake', stake: 10 } },
//     { text: '20 Coins', callbackData: { action: 'blackjack_stake', stake: 20 } },
//     { text: '30 Coins', callbackData: { action: 'blackjack_stake', stake: 30 } },
//     { text: '50 Coins', callbackData: { action: 'blackjack_stake', stake: 50 } },
//   ];
//   const stakeKeyboard = createOptimizedKeyboard(buttons, true);
//   
//   await updateGameMessage(bot, userInfo.chatId, 
//     '🃏 <b>Blackjack Game</b>\n\nBeat the dealer to 21!\n\nChoose your stake amount:',
//     stakeKeyboard, userInfo.userId, 'blackjack', 'stake_selection'
//   );
// };

// const triggerBowlingGame = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
//   const buttons = [
//     { text: '2 Coins', callbackData: { action: 'bowling_stake', stake: 2 } },
//     { text: '5 Coins', callbackData: { action: 'bowling_stake', stake: 5 } },
//     { text: '10 Coins', callbackData: { action: 'bowling_stake', stake: 10 } },
//     { text: '20 Coins', callbackData: { action: 'bowling_stake', stake: 20 } },
//   ];
//   const stakeKeyboard = createOptimizedKeyboard(buttons, true);
//   
//   await updateGameMessage(bot, userInfo.chatId, 
//     '🎳 <b>Bowling Game</b>\n\nRoll the dice to knock down pins!\n\nChoose your stake amount:',
//     stakeKeyboard, userInfo.userId, 'bowling', 'stake_selection'
//   );
// };

// Focus on poker game
// const handleNewGame = async (bot: Bot, userInfo: { userId: string; chatId: number }, data: any) => {
//   const gameType = data.gameType;
//   
//   logFunctionStart('handleNewGame', { 
//     userId: userInfo.userId, 
//     gameType: gameType || 'unknown',
//     context: 'game_selection'
//   });
//   
//   if (!gameType) {
//     await sendMessage(bot, userInfo.chatId, '❌ Invalid game selection.');
//     logFunctionEnd('handleNewGame', { success: false, error: 'No game type' }, { 
//       userId: userInfo.userId, 
//       gameType: 'none',
//       context: 'game_selection'
//     });
//     return;
//   }
//   
//   // Directly trigger the game's stake selection
//   switch (gameType) {
//     case 'dice':
//       await triggerDiceGame(bot, userInfo);
//       break;
//     case 'basketball':
//       await triggerBasketballGame(bot, userInfo);
//       break;
//     case 'football':
//       await triggerFootballGame(bot, userInfo);
//       break;
//     case 'blackjack':
//       await triggerBlackjackGame(bot, userInfo);
//       break;
//     case 'bowling':
//       await triggerBowlingGame(bot, userInfo);
//       break;
//     default:
//       await sendMessage(bot, userInfo.chatId, '❌ Unknown game type.');
//       logFunctionEnd('handleNewGame', { success: false, error: 'Unknown game type' }, { 
//         userId: userInfo.userId, 
//         gameType,
//         context: 'game_selection'
//       });
//       return;
//   }
//   
//   logFunctionEnd('handleNewGame', { success: true }, { 
//     userId: userInfo.userId, 
//     gameType,
//     context: 'game_selection'
//     });
// };

// handleStartGame is now auto-discovered from actions/startgame/index.ts

// handleFreeCoin is now auto-discovered from actions/freecoin/index.ts

// handleHelp and handleBalance are now auto-discovered from actions/help/index.ts and actions/balance/index.ts

// formatTimeRemaining is now moved to the freecoin action handler

// Error handler
bot.catch((err) => {
  logError('botError', err.error as Error, {});
  // Avoid console: rely on core logger
});

// Start the bot
const startBot = async (): Promise<void> => {
  logFunctionStart('startBot', {});
  
  try {
    logFunctionStart('botStartup', {});
    
    // Initialize i18n plugin
    const { i18nPluginInstance } = await import('./plugins/i18n');
    await i18nPluginInstance.initialize();
    logFunctionEnd('i18nInitialized', {}, {});
    
    // MessageUpdater removed: SmartReply handles edit-or-reply behavior
    
    // Initialize poker handlers (self-registering)
    await import('./actions/games/poker');
    
    logFunctionEnd('pokerHandlersRegistered', {}, {});
    
    // Set bot commands
    await bot.api.setMyCommands([
      { command: 'start', description: 'Start the bot' },
    ]);
    
    logFunctionEnd('botCommandsSet', {}, {});
    
    // Start polling - this will run until the bot is stopped
    logFunctionEnd('botRunning', {}, {});
    logFunctionEnd('startBot', {}, {});
    
    await bot.start();
  } catch (error) {
    logError('startBot', error as Error, {});
    logError('botStartFailure', error as Error, {});
    process.exit(1);
  }
};

// Handle graceful shutdown
let isShuttingDown = false;

const gracefulShutdown = (signal: string): void => {
  if (isShuttingDown) {
    logFunctionStart('forceShutdown', { signal });
    process.exit(1);
  }
  
  isShuttingDown = true;
  logFunctionStart('gracefulShutdown', { signal });
  process.exit(0);
};

// Helper function to generate invite links
export function generateInviteLink(roomId: string): string {
  return `https://t.me/${botUsername}?start=jgpr_${roomId}`;
}

// Handle shutdown signals
process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start the bot
startBot(); 

// Text message handler for form inputs
bot.on('message', async (ctx) => {
  try {
    // Only handle text messages
    if (!ctx.message?.text) {
      return;
    }
    
    const userInfo = extractUserInfo(ctx);
    const text = ctx.message.text;
    
    // Check if user is in room creation form
    const { isUserInRoomCreationForm, handleRoomNameInput } = await import('./actions/games/poker/room/create/textHandler');

    if (isUserInRoomCreationForm(ctx, userInfo.userId.toString())) {
      const handled = await handleRoomNameInput({
        ctx,
        user: {
          id: userInfo.userId as UserId,
          username: userInfo.username || 'Unknown'
        }
      }, text);
      
      if (handled) {
        return; // Message was handled by form
      }
    }
    
    // If not handled by form, ignore the message (commands are handled separately)
    
  } catch (error) {
    logError('messageHandler', error as Error, {});
    // Don't reply to avoid spam - just log the error
  }
});

// Inline query sharing disabled — user flow is via buttons only