import 'dotenv/config';
import { Bot } from 'grammy';
import { InlineQueryResult } from 'grammy/types';
import { logFunctionStart, logFunctionEnd, logError } from './modules/core/logger';
import { extractUserInfo, sendMessage, answerCallbackQuery, parseCallbackData } from './modules/core/telegramHelpers';
import { getActiveGamesForUser } from './modules/core/gameService';
import { 
  createOptimizedKeyboard, 
  updateOrSendMessage
} from './modules/core/interfaceHelpers';
import { setMessageUpdater } from './modules/core/messageUpdater';
// Archived games are no longer imported - using new auto-discovery router system
import { HandlerContext } from './modules/core/handler';
import { UserId } from './utils/types';

/**
 * GameHub Telegram Bot
 * 
 * Signal Handling:
 * - SIGINT (Ctrl+C): Graceful shutdown
 * - SIGTERM: Graceful shutdown
 * - Exits immediately to prevent double signal issues
 */
// Temporarily disabled other games to focus on trivia
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

const bot = new Bot(token);

// Add logging middleware
bot.use(async (ctx, next) => {
  logFunctionStart('botMiddleware', {
    userId: ctx.from?.id?.toString(),
    chatId: ctx.chat?.id?.toString(),
    messageType: ctx.message ? 'message' : 'callback_query'
  });
  
  try {
    await next();
    logFunctionEnd('botMiddleware', {}, {
      userId: ctx.from?.id?.toString(),
      chatId: ctx.chat?.id?.toString()
    });
  } catch (error) {
    logError('botMiddleware', error as Error, {
      userId: ctx.from?.id?.toString(),
      chatId: ctx.chat?.id?.toString()
    });
    throw error;
  }
});

// Add active game redirect middleware (early in the chain)
bot.use(async (ctx, next) => {
  try {
    // Import and run active game redirect middleware
    const { activeGameRedirect } = await import('./actions/games/poker/room/_middleware/active_game_redirect');
    await activeGameRedirect(ctx);
    
    // If the message was handled by active game redirect, don't continue
    if ((ctx as any).handled) {
      console.log(`🎮 MESSAGE HANDLED BY ACTIVE GAME REDIRECT`);
      return;
    }
    
    await next();
  } catch (error) {
    console.error('Error in active game redirect middleware:', error);
    await next(); // Continue with normal processing
  }
});

// Game handlers are now auto-discovered through the smart router system

// Simple callback logging (without interfering with handlers)
bot.use(async (ctx, next) => {
  // Log ALL incoming updates for debugging
  console.log(`🔍 INCOMING UPDATE:`);
  console.log(`  Update type: ${ctx.update.message ? 'message' : ctx.update.callback_query ? 'callback_query' : 'other'}`);
  console.log(`  User ID: ${ctx.from?.id}`);
  console.log(`  Username: ${ctx.from?.username}`);
  console.log(`  Chat ID: ${ctx.chat?.id}`);
  
  if (ctx.callbackQuery) {
    console.log(`🔘 Callback data: ${ctx.callbackQuery.data || 'No data'}`);
  }
  
  if (ctx.message?.text) {
    console.log(`📨 Message text: ${ctx.message.text}`);
  }
  
  if (ctx.message?.from) {
    console.log(`👤 Message from: ${ctx.message.from.first_name} ${ctx.message.from.last_name || ''} (@${ctx.message.from.username || 'no username'})`);
  }
  
  console.log(`---`);
  
  await next();
});
// Temporarily disabled other games to focus on trivia
// registerDiceHandlers(bot);
// registerBasketballHandlers(bot);
// registerFootballHandlers(bot);
// registerBlackjackHandlers(bot);
// registerBowlingHandlers(bot);



// Helper function to handle room join
async function handleRoomJoin(ctx: any, userInfo: any, roomId: string, format: string) {
  console.log(`🎯 PROCESSING ROOM JOIN VIA ${format.toUpperCase()}:`);
  console.log(`  Room ID: ${roomId}`);
  console.log(`  User ID: ${userInfo.userId}`);
  console.log(`  Username: ${userInfo.username}`);
  console.log(`  Chat ID: ${ctx.chat?.id}`);
  console.log(`  Message Type: ${ctx.message?.text}`);
  console.log(`  Full Context:`, {
    chatId: ctx.chat?.id,
    userId: ctx.from?.id,
    messageText: ctx.message?.text,
    startPayload: ctx.message?.text?.split(' ')[1]
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
    console.log(`📞 Calling handleJoin for room ${roomId}...`);
    await handleJoin(context, { roomId, isDirectLink: 'true' });
    console.log(`✅ Successfully called handleJoin for room ${roomId}`);
  } catch (error) {
    console.error(`❌ Error calling handleJoin for room ${roomId}:`, error);
    await ctx.reply('❌ خطا در ورود به روم. لطفاً دوباره تلاش کنید.');
  }
}

// Handle /start command using auto-discovery router
bot.command('start', async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    const startPayload = ctx.message?.text?.split(' ')[1]; // Get payload after /start
    
    console.log(`🔍 START COMMAND RECEIVED:`);
    console.log(`  User ID: ${userInfo.userId}`);
    console.log(`  Username: ${userInfo.username}`);
    console.log(`  Full message: ${ctx.message?.text}`);
    console.log(`  Start payload: ${startPayload}`);
    
    logFunctionStart('startCommand', { userId: userInfo.userId, startPayload });
    
    // Check if this is a room join request (new format: gprs_)
    if (startPayload && startPayload.startsWith('gprs_')) {
      const roomId = startPayload.substring(5); // Remove 'gprs_' prefix (5 characters)
      console.log(`🎯 DETECTED ROOM JOIN REQUEST VIA START: ${roomId}`);
      console.log(`🎯 ORIGINAL PAYLOAD: ${startPayload}`);
      console.log(`🎯 EXTRACTED ROOM ID: ${roomId}`);
      await handleRoomJoin(ctx, userInfo, roomId, 'gprs');
      logFunctionEnd('startCommand', {}, { userId: userInfo.userId, action: 'roomJoin' });
      return;
    }
    
    // Check if this is a room join request (legacy format: jgpr_room_)
    if (startPayload && startPayload.startsWith('jgpr_room_')) {
      const roomId = startPayload.substring(5); // Remove 'jgpr_' prefix to get the full room ID
      console.log(`🎯 DETECTED ROOM JOIN REQUEST VIA START: ${roomId}`);
      console.log(`🎯 ORIGINAL PAYLOAD: ${startPayload}`);
      console.log(`🎯 EXTRACTED ROOM ID: ${roomId}`);
      await handleRoomJoin(ctx, userInfo, roomId, 'jgpr_room');
      logFunctionEnd('startCommand', {}, { userId: userInfo.userId, action: 'roomJoin' });
      return;
    }
    
    // Check if this is a room join request (legacy format: jgpr_)
    if (startPayload && startPayload.startsWith('jgpr_') && !startPayload.startsWith('jgpr_room_')) {
      // Legacy format without room_ prefix
      const roomId = startPayload.substring(5); // Remove 'jgpr_' prefix (5 characters)
      console.log(`🎯 DETECTED ROOM JOIN REQUEST VIA START: ${roomId}`);
      console.log(`🎯 ORIGINAL PAYLOAD: ${startPayload}`);
      console.log(`🎯 EXTRACTED ROOM ID: ${roomId}`);
      console.log(`🎯 USER INFO:`, { userId: userInfo.userId, username: userInfo.username });
      await handleRoomJoin(ctx, userInfo, roomId, 'jgpr');
      logFunctionEnd('startCommand', {}, { userId: userInfo.userId, action: 'roomJoin' });
      return;
    }
    
    // Check if this is a room join request (legacy format: room_)
    if (startPayload && startPayload.startsWith('room_')) {
      const roomId = startPayload.substring(5); // Remove 'room_' prefix
      console.log(`🎯 DETECTED ROOM JOIN REQUEST VIA START: ${roomId}`);
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
    await ctx.reply('🎮 Welcome to GameHub!\n\nUse /help to see available commands.');
  }
});



// Handle /help command
bot.command('help', async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('helpCommand', { userId: userInfo.userId });
    
    // Use auto-discovery router for help action
    const { dispatch } = await import('./modules/core/smart-router');
    
    const context: HandlerContext = {
      ctx,
      user: {
        id: userInfo.userId as UserId,
        username: userInfo.username || 'Unknown'
      }
    };
    
    await dispatch('help', context);
    
    logFunctionEnd('helpCommand', {}, { userId: userInfo.userId });
  } catch (error) {
    logError('helpCommand', error as Error, {});
    await ctx.reply('❌ Failed to show help.');
  }
});



// Handle /balance command
bot.command('balance', async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('balanceCommand', { userId: userInfo.userId });
    
    // Use auto-discovery router for balance action
    const { dispatch } = await import('./modules/core/smart-router');
    
    const context: HandlerContext = {
      ctx,
      user: {
        id: userInfo.userId as UserId,
        username: userInfo.username || 'Unknown'
      }
    };
    
    await dispatch('balance', context);
    
    logFunctionEnd('balanceCommand', {}, { userId: userInfo.userId });
  } catch (error) {
    logError('balanceCommand', error as Error, {});
    await ctx.reply('❌ Failed to get balance.');
  }
});

// Handle /freecoin command
bot.command('freecoin', async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('freecoinCommand', { userId: userInfo.userId });
    
    // Use auto-discovery router for freecoin action
    const { dispatch } = await import('./modules/core/smart-router');
    
    const context: HandlerContext = {
      ctx,
      user: {
        id: userInfo.userId as UserId,
        username: userInfo.username || 'Unknown'
      }
    };
    
    await dispatch('financial.freecoin', context);
    
    logFunctionEnd('freecoinCommand', {}, { userId: userInfo.userId });
  } catch (error) {
    logError('freecoinCommand', error as Error, {});
    await ctx.reply('❌ Failed to claim free coins.');
  }
});

// Handle /poker command
bot.command('poker', async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('pokerCommand', { userId: userInfo.userId });
    
    // Use auto-discovery router for poker action
    const { dispatch } = await import('./modules/core/smart-router');
    
    const context: HandlerContext = {
      ctx,
      user: {
        id: userInfo.userId as UserId,
        username: userInfo.username || 'Unknown'
      }
    };
    
    await dispatch('games.poker.start', context);
    
    logFunctionEnd('pokerCommand', {}, { userId: userInfo.userId });
  } catch (error) {
    logError('pokerCommand', error as Error, {});
    await ctx.reply('❌ Failed to start poker game.');
  }
});



// Handle /games command
bot.command('games', async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('gamesCommand', { userId: userInfo.userId });
    
    const activeGames = await getActiveGamesForUser(userInfo.userId);
    
    if (activeGames.length === 0) {
      await sendMessage(bot, userInfo.chatId, '📋 You have no unfinished games.');
      logFunctionEnd('gamesCommand', {}, { userId: userInfo.userId });
      return;
    }
    
    let message = `📋 Your unfinished games (${activeGames.length}):\n\n`;
    
    for (const game of activeGames) {
      const status = game.status === 'waiting' ? '⏳ Waiting' : '🎮 Playing';
      const stake = game.stake || 0;
      const creatorName = game.players[0]?.name || 'Unknown';
      const joinerName = game.players[1]?.name || 'None';
      
      message += `🎮 Game: \`${game.id}\`\n`;
      message += `📊 Status: ${status}\n`;
      message += `💰 Stake: ${stake} Coins\n`;
      message += `👤 Creator: ${creatorName}\n`;
      message += `👥 Joiner: ${joinerName}\n\n`;
    }
    
    await sendMessage(bot, userInfo.chatId, message, { parseMode: 'Markdown' });
    
    logFunctionEnd('gamesCommand', {}, { userId: userInfo.userId });
  } catch (error) {
    logError('gamesCommand', error as Error, {});
    await ctx.reply('❌ Failed to fetch your games.');
  }
});

// Handle back button
bot.callbackQuery(/.*"action":"back".*/, async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('menu_back', { 
      userId: userInfo.userId, 
      action: 'back'
    });
    
    await answerCallbackQuery(bot, ctx.callbackQuery.id);
    
    // Import keys from actions for consistency
    const { key: gamesStartKey } = await import('./actions/games/start');
    const { key: freecoinKey } = await import('./actions/financial/freecoin');
    const { key: balanceKey } = await import('./actions/balance');
    const { key: helpKey } = await import('./actions/help');
    
    // Return to main menu
    const welcome = `🃏 <b>Welcome to GameHub - Poker Edition!</b>\n\n🎯 Challenge your friends in competitive poker games!\n\n💰 Earn and claim daily Coins with /freecoin!\n\n🎯 Choose an action below:`;
    
    // Create buttons
    const buttons = [
      { text: '🃏 Start Poker', callbackData: { action: gamesStartKey } },
      { text: '🪙 Free Coin', callbackData: { action: freecoinKey } },
      { text: '💰 Balance', callbackData: { action: balanceKey } },
      { text: '❓ Help', callbackData: { action: helpKey } },
    ];
    
    const keyboard = createOptimizedKeyboard(buttons);
    
    await updateOrSendMessage(bot, userInfo.chatId, welcome, keyboard, userInfo.userId, 'main_menu');
    
    logFunctionEnd('menu_back', {}, { userId: userInfo.userId });
  } catch (error) {
    logError('menu_back', error as Error, {});
    await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
  }
});

// Handle main menu callback queries with specific patterns
bot.callbackQuery(/.*"action":"games\.start".*/, async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('menu_startgame', { 
      userId: userInfo.userId, 
      action: 'startgame',
      context: 'main_menu'
    });
    
    await answerCallbackQuery(bot, ctx.callbackQuery.id);
    
    // Use auto-discovery router for startgame action
    const { dispatch } = await import('./modules/core/smart-router');
    
    const context: HandlerContext = {
      ctx,
      user: {
        id: userInfo.userId as UserId,
        username: userInfo.username || 'Unknown'
      }
    };
    
    await dispatch('games.start', context);
    
    logFunctionEnd('menu_startgame', {}, { 
      userId: userInfo.userId, 
      action: 'startgame',
      context: 'main_menu'
    });
  } catch (error) {
    logError('menu_startgame', error as Error, {});
    await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
  }
});

// Handle poker start callback query
bot.callbackQuery(/.*"action":"games\.poker\.start".*/, async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('menu_poker_start', { 
      userId: userInfo.userId, 
      action: 'poker_start',
      context: 'game_selection'
    });
    
    await answerCallbackQuery(bot, ctx.callbackQuery.id);
    
    // Use auto-discovery router for poker start action
    const { dispatch } = await import('./modules/core/smart-router');
    
    const context: HandlerContext = {
      ctx,
      user: {
        id: userInfo.userId as UserId,
        username: userInfo.username || 'Unknown'
      }
    };
    
    await dispatch('games.poker.start', context);
    
    logFunctionEnd('menu_poker_start', {}, { 
      userId: userInfo.userId, 
      action: 'poker_start',
      context: 'game_selection'
    });
  } catch (error) {
    logError('menu_poker_start', error as Error, {});
    await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
  }
});

// Handle poker room actions callback query (legacy format)
bot.callbackQuery(/.*"action":"games\.poker\.room\..*/, async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    const data = parseCallbackData(ctx.callbackQuery.data || '');
    const action = data.action;
    
    logFunctionStart('poker_room_action', { 
      userId: userInfo.userId, 
      action: action,
      context: 'poker_room',
      roomId: data.roomId || 'none'
    });
    
    await answerCallbackQuery(bot, ctx.callbackQuery.id);
    
    // Use auto-discovery router for poker room actions
    const { dispatch } = await import('./modules/core/smart-router');
    
    const context: HandlerContext = {
      ctx,
      user: {
        id: userInfo.userId as UserId,
        username: userInfo.username || 'Unknown'
      }
    };
    
    // Extract query parameters from callback data
    const query: Record<string, string> = {};
    if (data.roomId) query.roomId = data.roomId;
    if (data.amount) query.amount = data.amount;
    if (data.userId) query.userId = data.userId;
    
    // Add query to context
    (context as any).query = query;
    
    await dispatch(action, context);
    
    logFunctionEnd('poker_room_action', {}, { 
      userId: userInfo.userId, 
      action: action,
      context: 'poker_room'
    });
  } catch (error) {
    logError('poker_room_action', error as Error, {});
    await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
  }
});

// Handle compact poker actions (new format)
bot.callbackQuery(/^[a-z0-9]{2,5}(\?.*)?$/, async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    const callbackData = ctx.callbackQuery.data || '';
    
    logFunctionStart('poker_compact_action', { 
      userId: userInfo.userId, 
      callbackData,
      context: 'poker_compact'
    });
    
    await answerCallbackQuery(bot, ctx.callbackQuery.id);
    
    // Use compact router for poker actions
    const { dispatch, parseCallbackData } = await import('./modules/core/compact-router');
    
    const context: HandlerContext = {
      ctx,
      user: {
        id: userInfo.userId as UserId,
        username: userInfo.username || 'Unknown'
      }
    };
    
    // Parse compact callback data
    const { code, params } = parseCallbackData(callbackData);
    
    console.log(`Parsed callback data: code=${code}, params=`, params);
    
    // Add params to context
    (context as any).query = params;
    
    await dispatch(code, context, params);
    
    logFunctionEnd('poker_compact_action', {}, { 
      userId: userInfo.userId, 
      code,
      context: 'poker_compact'
    });
  } catch (error) {
    logError('poker_compact_action', error as Error, {});
    await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
  }
});

// Temporarily disabled to focus on trivia
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

bot.callbackQuery(/.*"action":"financial\.freecoin".*/, async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('menu_freecoin', { 
      userId: userInfo.userId, 
      action: 'freecoin',
      context: 'main_menu'
    });
    
    await answerCallbackQuery(bot, ctx.callbackQuery.id);
    
    // Use auto-discovery router for freecoin action
    const { dispatch } = await import('./modules/core/smart-router');
    
    const context: HandlerContext = {
      ctx,
      user: {
        id: userInfo.userId as UserId,
        username: userInfo.username || 'Unknown'
      }
    };
    
    await dispatch('financial.freecoin', context);
    
    logFunctionEnd('menu_freecoin', {}, { 
      userId: userInfo.userId, 
      action: 'freecoin',
      context: 'main_menu'
    });
  } catch (error) {
    logError('menu_freecoin', error as Error, {});
    await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
  }
});

bot.callbackQuery(/.*"action":"help".*/, async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('menu_help', { 
      userId: userInfo.userId, 
      action: 'help',
      context: 'main_menu'
    });
    
    await answerCallbackQuery(bot, ctx.callbackQuery.id);
    
    // Use auto-discovery router for help action
    const { dispatch } = await import('./modules/core/smart-router');
    
    const context: HandlerContext = {
      ctx,
      user: {
        id: userInfo.userId as UserId,
        username: userInfo.username || 'Unknown'
      }
    };
    
    await dispatch('help', context);
    
    logFunctionEnd('menu_help', {}, { 
      userId: userInfo.userId, 
      action: 'help',
      context: 'main_menu'
    });
  } catch (error) {
    logError('menu_help', error as Error, {});
    await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
  }
});

bot.callbackQuery(/.*"action":"balance".*/, async (ctx) => {
  try {
    const userInfo = extractUserInfo(ctx);
    logFunctionStart('menu_balance', { 
      userId: userInfo.userId, 
      action: 'balance',
      context: 'main_menu'
    });
    
    await answerCallbackQuery(bot, ctx.callbackQuery.id);
    
    // Use auto-discovery router for balance action
    const { dispatch } = await import('./modules/core/smart-router');
    
    const context: HandlerContext = {
      ctx,
      user: {
        id: userInfo.userId as UserId,
        username: userInfo.username || 'Unknown'
      }
    };
    
    await dispatch('balance', context);
    
    logFunctionEnd('menu_balance', {}, { 
      userId: userInfo.userId, 
      action: 'balance',
      context: 'main_menu'
    });
  } catch (error) {
    logError('menu_balance', error as Error, {});
    await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Processing failed');
  }
});

// Helper functions for callback handlers
// Temporarily disabled game trigger functions to focus on trivia
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

// Temporarily disabled to focus on trivia
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
  console.error('Bot error:', err.error);
});

// Start the bot
const startBot = async (): Promise<void> => {
  logFunctionStart('startBot', {});
  
  try {
    console.log('🚀 Starting GameHub bot...');
    
    // Initialize MessageUpdater
    setMessageUpdater(bot);
    console.log('✅ MessageUpdater initialized');
    
    // Initialize poker handlers (self-registering)
    await import('./actions/games/poker');
    
    console.log('✅ Poker handlers self-registered with compact router');
    
    // Set bot commands
    await bot.api.setMyCommands([
      { command: 'start', description: 'Start the bot' },
      { command: 'startgame', description: 'Start a new game' },
      { command: 'freecoin', description: 'Claim your daily free coins' },
      { command: 'help', description: 'Show help information' },
      { command: 'newgame', description: 'Create a new game' },
      { command: 'games', description: 'Show your unfinished games' },
      { command: 'stats', description: 'Show your game statistics' },
      { command: 'balance', description: 'Show your coin balance' },
      { command: 'dice', description: 'Play dice game' },
      { command: 'basketball', description: 'Play basketball game' },
      { command: 'football', description: 'Play football game' },
      { command: 'blackjack', description: 'Play blackjack game' },
      { command: 'bowling', description: 'Play bowling game' },
    ]);
    
    console.log('✅ Bot commands set successfully');
    
    // Start polling - this will run until the bot is stopped
    console.log('🎮 GameHub bot is running!');
    logFunctionEnd('startBot', {}, {});
    
    await bot.start();
  } catch (error) {
    logError('startBot', error as Error, {});
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
let isShuttingDown = false;

const gracefulShutdown = (signal: string): void => {
  if (isShuttingDown) {
    console.log(`🛑 Force shutting down due to ${signal}...`);
    process.exit(1);
  }
  
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
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
    
    if (isUserInRoomCreationForm(userInfo.userId.toString())) {
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

// Inline query handler for sharing games
bot.on('inline_query', async (ctx) => {
  const query = ctx.inlineQuery.query;
  
  // Handle trivia game sharing
  if (query.startsWith('trivia_')) {
    const gameId = query.substring(7); // Remove "trivia_" prefix to get full game ID
    if (gameId) {
      const results: InlineQueryResult[] = [
        {
          type: 'article',
          id: `share_${gameId}`,
          title: '🧠 Share Trivia Game',
          input_message_content: {
            message_text: `🧠 <b>Trivia Challenge!</b>\n\nI've started a new trivia game. Click below to join and test your knowledge!`,
            parse_mode: 'HTML',
          },
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Join Game', callback_data: JSON.stringify({ action: 'trivia_join', gameId }) }]
            ]
          }
        }
      ];
      await ctx.answerInlineQuery(results, { cache_time: 0 });
    }
  }
  
  // Handle poker room sharing
  if (query.startsWith('join_room_')) {
    const roomId = query.substring(10); // Remove "join_room_" prefix
    if (roomId) {
      const results: InlineQueryResult[] = [
        {
          type: 'article',
          id: `share_poker_${roomId}`,
          title: '🎮 Join Poker Room',
          input_message_content: {
            message_text: `🎮 <b>Join Poker Game!</b>\n\nClick below to join this exciting poker room!`,
            parse_mode: 'HTML',
          },
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Join Room', url: `https://t.me/${botUsername}?start=jgpr_${roomId}` }]
            ]
          }
        }
      ];
      await ctx.answerInlineQuery(results, { cache_time: 0 });
    }
  }
}); 