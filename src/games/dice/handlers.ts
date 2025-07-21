import { Bot } from 'grammy';
import { logFunctionStart, logFunctionEnd, logError } from '../../core/logger';
import { extractUserInfo, sendMessage, createInlineKeyboard, parseCallbackData, answerCallbackQuery } from '../../core/telegramHelpers';
import { startDiceGame, handleDiceTurn } from './index';
import { getGame } from '../../core/gameService';

export const registerDiceHandlers = (bot: Bot): void => {
  logFunctionStart('registerDiceHandlers', {});
  
  // Handle /dice command
  bot.command('dice', async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      logFunctionStart('diceCommand', { userId: userInfo.userId });
      
      const stakeKeyboard = createInlineKeyboard([
        { text: '2 Coins', callbackData: { action: 'dice_stake', stake: 2 } },
        { text: '5 Coins', callbackData: { action: 'dice_stake', stake: 5 } },
        { text: '10 Coins', callbackData: { action: 'dice_stake', stake: 10 } },
        { text: '20 Coins', callbackData: { action: 'dice_stake', stake: 20 } },
      ]);
      
      await sendMessage(bot, userInfo.chatId, 
        '🎲 Dice Guess Game\n\nChoose your stake amount:',
        { replyMarkup: stakeKeyboard }
      );
      
      logFunctionEnd('diceCommand', {}, { userId: userInfo.userId });
    } catch (error) {
      logError('diceCommand', error as Error, {});
      await ctx.reply('❌ Failed to start dice game.');
    }
  });
  
  // Handle dice stake selection
  bot.callbackQuery(/.*"action":"dice_stake".*/, async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      const data = parseCallbackData(ctx.callbackQuery.data);
      const stake = data.stake as number;
      
      logFunctionStart('diceStakeCallback', { userId: userInfo.userId, stake });
      
      await answerCallbackQuery(bot, ctx.callbackQuery.id);
      
      const result = await startDiceGame(userInfo.userId, stake);
      
      if (!result.success) {
        await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
        logFunctionEnd('diceStakeCallback', { success: false }, { userId: userInfo.userId, stake });
        return;
      }
      
      const guessKeyboard = createInlineKeyboard([
        { text: '1', callbackData: { action: 'dice_guess', g: result.gameId, n: 1 } },
        { text: '2', callbackData: { action: 'dice_guess', g: result.gameId, n: 2 } },
        { text: '3', callbackData: { action: 'dice_guess', g: result.gameId, n: 3 } },
        { text: '4', callbackData: { action: 'dice_guess', g: result.gameId, n: 4 } },
        { text: '5', callbackData: { action: 'dice_guess', g: result.gameId, n: 5 } },
        { text: '6', callbackData: { action: 'dice_guess', g: result.gameId, n: 6 } },
      ]);
      
      await sendMessage(bot, userInfo.chatId,
        `🎲 Dice Game Started!\n\n💰 Stake: ${stake} Coins\n\nGuess the dice number (1-6):`,
        { replyMarkup: guessKeyboard }
      );
      
      logFunctionEnd('diceStakeCallback', { success: true }, { userId: userInfo.userId, stake });
    } catch (error) {
      logError('diceStakeCallback', error as Error, {});
      await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Failed to start game');
    }
  });
  
  // Handle dice guess
  bot.callbackQuery(/.*"action":"dice_guess".*/, async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      const data = parseCallbackData(ctx.callbackQuery.data);
      const gameId = data.g as string;
      const guess = data.n as number;
      
      logFunctionStart('diceGuessCallback', { userId: userInfo.userId, gameId, guess });
      
      await answerCallbackQuery(bot, ctx.callbackQuery.id);
      
      const result = await handleDiceTurn(gameId, guess);
      
      if (!result.success) {
        await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
        logFunctionEnd('diceGuessCallback', { success: false }, { userId: userInfo.userId, gameId, guess });
        return;
      }
      
      const diceResult = result.result!;
      const emoji = diceResult.isWon ? '🎉' : '😔';
      const message = diceResult.isWon
        ? `${emoji} <b>You Won!</b>\n\n🎲 Your guess: ${diceResult.playerGuess}\n🎲 Dice result: ${diceResult.diceResult}\n💰 Winnings: +${diceResult.coinsWon} Coins`
        : `${emoji} <b>You Lost!</b>\n\n🎲 Your guess: ${diceResult.playerGuess}\n🎲 Dice result: ${diceResult.diceResult}\n💰 Lost: ${diceResult.coinsLost} Coins`;
      
      // Create play again keyboard
      const playAgainKeyboard = {
        inline_keyboard: [
          [{ text: '🔄 Same Stake & Guess', callback_data: `dice_play_again_same_${gameId}_${diceResult.coinsLost || diceResult.coinsWon}_${guess}` }],
          [{ text: '🎲 New Guess', callback_data: `dice_play_again_new_guess_${gameId}_${diceResult.coinsLost || diceResult.coinsWon}` }],
          [{ text: '🔄 Start Over', callback_data: 'dice_play_again_restart' }]
        ]
      };
      
      await sendMessage(bot, userInfo.chatId, message, { 
        parseMode: 'HTML',
        replyMarkup: playAgainKeyboard
      });
      
      logFunctionEnd('diceGuessCallback', { success: true }, { userId: userInfo.userId, gameId, guess });
    } catch (error) {
      logError('diceGuessCallback', error as Error, {});
      await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Failed to process guess');
    }
  });
  
  // Handle dice play again
  bot.callbackQuery(/^dice_play_again_.*/, async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      const callbackData = ctx.callbackQuery.data || '';
      
      console.log('🔍 DEBUG - ENTRY: dicePlayAgainCallback called');
      console.log('🔍 DEBUG - Raw callback data:', callbackData);
      console.log('🔍 DEBUG - Callback data type:', typeof callbackData);
      console.log('🔍 DEBUG - Callback data length:', callbackData.length);
      
      logFunctionStart('dicePlayAgainCallback', { userId: userInfo.userId, callbackData });
      
      await answerCallbackQuery(bot, ctx.callbackQuery.id);
      
      if (callbackData === 'dice_play_again_restart') {
        // Start over - show stake selection
        const stakeKeyboard = createInlineKeyboard([
          { text: '2 Coins', callbackData: { action: 'dice_stake', stake: 2 } },
          { text: '5 Coins', callbackData: { action: 'dice_stake', stake: 5 } },
          { text: '10 Coins', callbackData: { action: 'dice_stake', stake: 10 } },
          { text: '20 Coins', callbackData: { action: 'dice_stake', stake: 20 } },
        ]);
        
        await sendMessage(bot, userInfo.chatId, 
          '🎲 Dice Guess Game\n\nChoose your stake amount:',
          { replyMarkup: stakeKeyboard }
        );
      } else {
        // Parse callback data for same stake or new guess
        console.log('🔍 DEBUG - About to parse callback data:', callbackData);
        console.log('🔍 DEBUG - Callback data length:', callbackData.length);
        console.log('🔍 DEBUG - Callback data type:', typeof callbackData);
        
        // Manual parsing instead of regex
        const parts = callbackData.split('_');
        console.log('🔍 DEBUG - Split parts:', parts);
        
        if (parts.length < 6) {
          console.log('🔍 DEBUG - Not enough parts, showing error');
          await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
          return;
        }
        
        const type = parts[3]; // 'same' or 'new'
        
        // For "new_guess" type, the format is: dice_play_again_new_guess_dice_1753127455178_0vzhumatr_25
        // For "same" type, the format is: dice_play_again_same_dice_1753127455178_0vzhumatr_25
        if (type === 'new') {
          // New guess format: dice_play_again_new_guess_dice_1753128274742_3gkuevnd0_2
          // parts: ['dice', 'play', 'again', 'new', 'guess', 'dice', '1753128274742', '3gkuevnd0', '2']
          const gameId = `${parts[5]}_${parts[6]}_${parts[7]}`; // 'dice_1753128274742_3gkuevnd0'
          const stake = parseInt(parts[parts.length - 1]); // '2' -> 2
          const guess = null; // No guess for new_guess
          
          console.log('🔍 DEBUG - Manual parsed values:', { type, gameId, stake, guess });
          
          // For new guess, we need to get the original stake from the game
          const originalGame = await getGame(gameId);
          if (!originalGame) {
            await sendMessage(bot, userInfo.chatId, '❌ Original game not found');
            return;
          }
          
          const actualStake = originalGame.stake;
          console.log('🔍 DEBUG - Using original stake:', actualStake);
          
          const result = await startDiceGame(userInfo.userId, actualStake);
          
          if (!result.success) {
            await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
            return;
          }
          
          if (!result.gameId) {
            await sendMessage(bot, userInfo.chatId, `❌ Failed to create game`);
            return;
          }
          
          // Show guess selection keyboard
          console.log('🔍 DEBUG - Taking NEW GUESS path');
          const guessKeyboard = createInlineKeyboard([
            { text: '1', callbackData: { action: 'dice_guess', g: result.gameId, n: 1 } },
            { text: '2', callbackData: { action: 'dice_guess', g: result.gameId, n: 2 } },
            { text: '3', callbackData: { action: 'dice_guess', g: result.gameId, n: 3 } },
            { text: '4', callbackData: { action: 'dice_guess', g: result.gameId, n: 4 } },
            { text: '5', callbackData: { action: 'dice_guess', g: result.gameId, n: 5 } },
            { text: '6', callbackData: { action: 'dice_guess', g: result.gameId, n: 6 } },
          ]);
          
          await sendMessage(bot, userInfo.chatId,
            `🎲 Dice Game Started!\n\n💰 Stake: ${actualStake} Coins\n\nGuess the dice number (1-6):`,
            { replyMarkup: guessKeyboard }
          );
        } else if (type === 'same') {
          // Same stake & guess format: dice_play_again_same_dice_1753128274742_3gkuevnd0_2_2
          // parts: ['dice', 'play', 'again', 'same', 'dice', '1753128274742', '3gkuevnd0', '2', '2']
          const gameId = `${parts[4]}_${parts[5]}_${parts[6]}`; // 'dice_1753128274742_3gkuevnd0'
          const stake = parseInt(parts[parts.length - 2]); // '2' -> 2
          const guess = parseInt(parts[parts.length - 1]); // '2' -> 2
          
          console.log('🔍 DEBUG - Manual parsed values:', { type, gameId, stake, guess });
          
          // For same stake, we need to get the original stake from the game
          const originalGame = await getGame(gameId);
          if (!originalGame) {
            await sendMessage(bot, userInfo.chatId, '❌ Original game not found');
            return;
          }
          
          const actualStake = originalGame.stake;
          console.log('🔍 DEBUG - Using original stake:', actualStake);
          
          const result = await startDiceGame(userInfo.userId, actualStake);
          
          if (!result.success) {
            await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
            return;
          }
          
          if (!result.gameId) {
            await sendMessage(bot, userInfo.chatId, `❌ Failed to create game`);
            return;
          }
          
          // Same stake & guess - automatically use the same guess
          console.log('🔍 DEBUG - Taking SAME path with guess:', guess);
          const turnResult = await handleDiceTurn(result.gameId, guess);
          
          if (!turnResult.success) {
            await sendMessage(bot, userInfo.chatId, `❌ ${turnResult.error}`);
            return;
          }
          
          const diceResult = turnResult.result!;
          const emoji = diceResult.isWon ? '🎉' : '😔';
          const message = diceResult.isWon
            ? `${emoji} <b>You Won!</b>\n\n🎲 Your guess: ${diceResult.playerGuess}\n🎲 Dice result: ${diceResult.diceResult}\n💰 Winnings: +${diceResult.coinsWon} Coins`
            : `${emoji} <b>You Lost!</b>\n\n🎲 Your guess: ${diceResult.playerGuess}\n🎲 Dice result: ${diceResult.diceResult}\n💰 Lost: ${diceResult.coinsLost} Coins`;
          
          // Create play again keyboard for the new result
          const playAgainKeyboard = {
            inline_keyboard: [
              [{ text: '🔄 Same Stake & Guess', callback_data: `dice_play_again_same_${result.gameId}_${diceResult.coinsLost || diceResult.coinsWon}_${guess}` }],
              [{ text: '🎲 New Guess', callback_data: `dice_play_again_new_guess_${result.gameId}_${diceResult.coinsLost || diceResult.coinsWon}` }],
              [{ text: '🔄 Start Over', callback_data: 'dice_play_again_restart' }]
            ]
          };
          
          await sendMessage(bot, userInfo.chatId, message, { 
            parseMode: 'HTML',
            replyMarkup: playAgainKeyboard
          });
        }
        
        return; // Exit early since we handled both cases
      }
      
      logFunctionEnd('dicePlayAgainCallback', { success: true }, { userId: userInfo.userId });
    } catch (error) {
      logError('dicePlayAgainCallback', error as Error, {});
      await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Failed to start new game');
    }
  });
  
  logFunctionEnd('registerDiceHandlers', {}, {});
}; 