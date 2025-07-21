import { Bot } from 'grammy';
import { logFunctionStart, logFunctionEnd, logError } from '../../core/logger';
import { extractUserInfo, sendMessage, createInlineKeyboard, parseCallbackData, answerCallbackQuery } from '../../core/telegramHelpers';
import { startDiceGame, handleDiceTurn } from './index';

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
        const match = callbackData.match(/^dice_play_again_(same|new_guess)_(.+)_(.+)(?:_(.+))?$/);
        if (!match) {
          await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
          return;
        }
        
        const type = match[1];
        const gameId = match[2];
        const stake = parseInt(match[3]);
        const guess = match[4] ? parseInt(match[4]) : null;
        
        const result = await startDiceGame(userInfo.userId, stake);
        
        if (!result.success) {
          await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
          return;
        }
        
        if (!result.gameId) {
          await sendMessage(bot, userInfo.chatId, `❌ Failed to create game`);
          return;
        }
        
        if (type === 'same' && guess !== null) {
          // Same stake & guess - automatically use the same guess
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
        } else {
          // New guess - show guess selection keyboard
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
        }
      }
      
      logFunctionEnd('dicePlayAgainCallback', { success: true }, { userId: userInfo.userId });
    } catch (error) {
      logError('dicePlayAgainCallback', error as Error, {});
      await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Failed to start new game');
    }
  });
  
  logFunctionEnd('registerDiceHandlers', {}, {});
}; 