import { Bot } from 'grammy';
import { logFunctionStart, logFunctionEnd, logError } from '../../../modules/core/logger';
import { extractUserInfo, sendMessage, answerCallbackQuery } from '../../../modules/core/telegramHelpers';
import { startBowlingGame, handleBowlingTurn } from './index';

export const registerBowlingHandlers = (bot: Bot): void => {
  logFunctionStart('registerBowlingHandlers', {});
  
  // Handle /bowling command
  bot.command('bowling', async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      logFunctionStart('bowlingCommand', { userId: userInfo.userId });
      
      const stakeKeyboard = {
        inline_keyboard: [
          [{ text: '2 Coins', callback_data: 'bowling_stake_2' }],
          [{ text: '5 Coins', callback_data: 'bowling_stake_5' }],
          [{ text: '10 Coins', callback_data: 'bowling_stake_10' }],
          [{ text: '20 Coins', callback_data: 'bowling_stake_20' }]
        ]
      };
      
      await sendMessage(bot, userInfo.chatId, 
        '🎳 Bowling Game\n\nKnock down pins with your dice roll!\n\nChoose your stake amount:',
        { replyMarkup: stakeKeyboard }
      );
      
      logFunctionEnd('bowlingCommand', {}, { userId: userInfo.userId });
    } catch (error) {
      logError('bowlingCommand', error as Error, {});
      await ctx.reply('❌ Failed to start bowling game.');
    }
  });
  
  // Handle bowling stake selection
  bot.callbackQuery(/^bowling_stake_.*/, async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      const callbackData = ctx.callbackQuery.data || '';
      // Parse: bowling_stake_STAKE
      const match = callbackData.match(/^bowling_stake_(\d+)$/);
      if (!match) {
        await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
        return;
      }
      
      const stake = parseInt(match[1]) as 2 | 5 | 10 | 20;
      
      logFunctionStart('bowlingStakeCallback', { userId: userInfo.userId, stake });
      
      await answerCallbackQuery(bot, ctx.callbackQuery.id);
      
      const result = await startBowlingGame(userInfo.userId, stake);
      
      if (!result.success) {
        await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
        logFunctionEnd('bowlingStakeCallback', { success: false }, { userId: userInfo.userId, stake });
        return;
      }
      
      const rollKeyboard = {
        inline_keyboard: [
          [{ text: '🎳 Roll Dice', callback_data: `bowling_roll_${result.gameId}` }]
        ]
      };
      
      await sendMessage(bot, userInfo.chatId,
        `🎳 Bowling Game Started!\n\n💰 Stake: ${stake} Coins\n\nReady to roll!`,
        { replyMarkup: rollKeyboard }
      );
      
      logFunctionEnd('bowlingStakeCallback', { success: true }, { userId: userInfo.userId, stake });
    } catch (error) {
      logError('bowlingStakeCallback', error as Error, {});
      await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Failed to start game');
    }
  });
  
  // Handle bowling roll
  bot.callbackQuery(/^bowling_roll_.*/, async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      const callbackData = ctx.callbackQuery.data || '';
      // Parse: bowling_roll_GAMEID
      const match = callbackData.match(/^bowling_roll_(.+)$/);
      if (!match) {
        await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
        return;
      }
      
      const gameId = match[1];
      
      logFunctionStart('bowlingRollCallback', { userId: userInfo.userId, gameId });
      
      await answerCallbackQuery(bot, ctx.callbackQuery.id);
      
      const result = await handleBowlingTurn(gameId);
      
      if (!result.success) {
        await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
        logFunctionEnd('bowlingRollCallback', { success: false }, { userId: userInfo.userId, gameId });
        return;
      }
      
      const bowlingResult = result.result!;
      const emoji = bowlingResult.isWon ? '🎳' : '😔';
      const pinsHit = bowlingResult.diceResult;
      
      const message = `${emoji} <b>${bowlingResult.outcome}</b>\n\n` +
        `🎳 You knocked down ${pinsHit} pins!\n\n` +
        `${bowlingResult.isWon ? `💰 Winnings: +${bowlingResult.coinsWon} Coins` : `💰 Lost: ${bowlingResult.coinsLost} Coins`}`;
      
      // Create play again keyboard
      const playAgainKeyboard = {
        inline_keyboard: [
          [{ text: '🔄 Same Stake', callback_data: `bowling_play_again_same_${gameId}_${bowlingResult.coinsLost || bowlingResult.coinsWon}` }],
          [{ text: '🎳 New Game', callback_data: `bowling_play_again_new_${gameId}_${bowlingResult.coinsLost || bowlingResult.coinsWon}` }],
          [{ text: '🔄 Start Over', callback_data: 'bowling_play_again_restart' }]
        ]
      };
      
      await sendMessage(bot, userInfo.chatId, message, { 
        parseMode: 'HTML',
        replyMarkup: playAgainKeyboard
      });
      
      logFunctionEnd('bowlingRollCallback', { success: true }, { userId: userInfo.userId, gameId });
    } catch (error) {
      logError('bowlingRollCallback', error as Error, {});
      await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Failed to process roll');
    }
  });
  
  // Handle bowling play again
  bot.callbackQuery(/^bowling_play_again_.*/, async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      const callbackData = ctx.callbackQuery.data || '';
      
      logFunctionStart('bowlingPlayAgainCallback', { userId: userInfo.userId, callbackData });
      
      await answerCallbackQuery(bot, ctx.callbackQuery.id);
      
      if (callbackData === 'bowling_play_again_restart') {
        // Start over - show stake selection
        const stakeKeyboard = {
          inline_keyboard: [
            [{ text: '2 Coins', callback_data: 'bowling_stake_2' }],
            [{ text: '5 Coins', callback_data: 'bowling_stake_5' }],
            [{ text: '10 Coins', callback_data: 'bowling_stake_10' }],
            [{ text: '20 Coins', callback_data: 'bowling_stake_20' }]
          ]
        };
        
        await sendMessage(bot, userInfo.chatId, 
          '🎳 Bowling Game\n\nKnock down pins with your dice roll!\n\nChoose your stake amount:',
          { replyMarkup: stakeKeyboard }
        );
      } else {
        // Parse callback data for same stake or new game
        const match = callbackData.match(/^bowling_play_again_(same|new)_(.+)_(.+)$/);
        if (!match) {
          await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Invalid callback data');
          return;
        }
        
        const stake = parseInt(match[3]);
        
        const result = await startBowlingGame(userInfo.userId, stake as 2 | 5 | 10 | 20);
        
        if (!result.success) {
          await sendMessage(bot, userInfo.chatId, `❌ ${result.error}`);
          return;
        }
        
        const rollKeyboard = {
          inline_keyboard: [
            [{ text: '🎳 Roll Dice', callback_data: `bowling_roll_${result.gameId}` }]
          ]
        };
        
        await sendMessage(bot, userInfo.chatId,
          `🎳 Bowling Game Started!\n\n💰 Stake: ${stake} Coins\n\nReady to roll!`,
          { replyMarkup: rollKeyboard }
        );
      }
      
      logFunctionEnd('bowlingPlayAgainCallback', { success: true }, { userId: userInfo.userId });
    } catch (error) {
      logError('bowlingPlayAgainCallback', error as Error, {});
      await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Failed to start new game');
    }
  });
  
  logFunctionEnd('registerBowlingHandlers', {}, {});
}; 