import { Bot } from 'grammy';
import { logFunctionStart, logFunctionEnd, logError } from '../../core/logger';
import { extractUserInfo, sendMessage, answerCallbackQuery, parseCallbackData } from '../../core/telegramHelpers';
import { createOptimizedKeyboard, updateOrSendMessage } from '../../core/interfaceHelpers';
import {
  createTriviaGame,
  joinTriviaGame,
  selectCategory,
  answerQuestion,
  getCurrentQuestionForPlayer,
  answerQuestionForPlayer,
  checkCategoryCompletion,
  QUESTIONS_PER_CATEGORY,
  TOTAL_ROUNDS
} from './service';
import { getGame } from '../../core/gameService';
import { TRIVIA_CATEGORIES } from './types';

export const registerTriviaHandlers = (bot: Bot) => {
  // Handle /trivia command
  bot.command('trivia', async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      logFunctionStart('triviaCommand', { userId: userInfo.userId });
      
      await handleStartTrivia(bot, userInfo);
      
      logFunctionEnd('triviaCommand', {}, { userId: userInfo.userId });
    } catch (error) {
      logError('triviaCommand', error as Error, {});
      await sendMessage(bot, ctx.chat.id, '❌ Error starting trivia game. Please try again.');
    }
  });

  // Handle trivia callback queries
  bot.callbackQuery(/trivia_/, async (ctx) => {
    try {
      const userInfo = extractUserInfo(ctx);
      const data: any = parseCallbackData(ctx.callbackQuery.data || '');

      if ((data.action && typeof data.action === 'string' && data.action.startsWith('trivia_')) || (data.a && typeof data.a === 'string')) {
        const action = data.action || data.a;
        logFunctionStart('triviaCallback', { userId: userInfo.userId, action });
        
        switch (action) {
          case 'trivia_start':
          case 'ts':
            await handleStartTrivia(bot, userInfo);
            break;
          case 'trivia_join':
          case 'tj':
            if (data.gameId && typeof data.gameId === 'string') {
              await handleJoinTrivia(bot, userInfo, data.gameId, ctx.callbackQuery.id);
            } else if (data.g && typeof data.g === 'string') {
              await handleJoinTrivia(bot, userInfo, data.g, ctx.callbackQuery.id);
            }
            break;
          case 'trivia_category':
          case 'tc':
            if (data.gameId && data.category && typeof data.gameId === 'string' && typeof data.category === 'string') {
              await handleSelectCategory(bot, userInfo, data.gameId, data.category);
            } else if (data.g && data.c && typeof data.g === 'string' && typeof data.c === 'string') {
              await handleSelectCategory(bot, userInfo, data.g, data.c);
            }
            break;
          case 'trivia_answer':
          case 'ta':
            if (data.gameId && data.answer && typeof data.gameId === 'string' && typeof data.answer === 'string') {
              await handleAnswerQuestion(bot, userInfo, data.gameId, data.answer);
            } else if (data.g && data.ans && typeof data.g === 'string' && typeof data.ans === 'string') {
              await handleAnswerQuestion(bot, userInfo, data.g, data.ans);
            }
            break;
          case 'trivia_play_again':
          case 'tpa':
            await handlePlayAgain(bot, userInfo);
            break;
          default:
            if (ctx.callbackQuery.id) {
              await answerCallbackQuery(bot, ctx.callbackQuery.id, 'Unknown trivia action');
            }
        }
        
        logFunctionEnd('triviaCallback', {}, { userId: userInfo.userId, action: action as string });
      }
    } catch (error) {
      logError('triviaCallback', error as Error, {});
      if (ctx.callbackQuery.id) {
        await answerCallbackQuery(bot, ctx.callbackQuery.id, '❌ Error processing trivia action');
      }
    }
  });
};

const handleStartTrivia = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  try {
    const game = await createTriviaGame(userInfo.userId);
    
    const message = `🧠 <b>New Trivia Game</b>\n\n` +
      `Waiting for another player to join...\n\n` +
      `Game ID: <code>${game.id}</code>`;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🎮 Join Game', callback_data: JSON.stringify({ a: 'tj', g: game.id }) },
          { text: '🔗 Share Game', switch_inline_query: `trivia_${game.id}` }
        ]
      ]
    };

    await updateOrSendMessage(bot, userInfo.chatId, message, keyboard, userInfo.userId, 'trivia_waiting');
    
    logFunctionEnd('handleStartTrivia', { gameId: game.id }, { userId: userInfo.userId });
  } catch (error) {
    logError('handleStartTrivia', error as Error, { userId: userInfo.userId });
    throw error;
  }
};

const handleJoinTrivia = async (bot: Bot, userInfo: { userId: string; chatId: number }, gameId: string, callbackQueryId: string) => {
  try {
    const game = await joinTriviaGame(gameId, userInfo.userId);
    await answerCallbackQuery(bot, callbackQueryId);

    if (game.status === 'playing') {
      // Game is ready to start
      await handleGameStarted(bot, game);
    } else {
      // Still waiting for players
      const message = `🧠 <b>Trivia Game</b>\n\n` +
        `Player joined! Waiting for more players...\n\n` +
        `Game ID: <code>${game.id}</code>`;

      const buttons = [
        { text: '🎮 Join Game', callbackData: { a: 'tj', g: game.id } }
      ];

      const keyboard = createOptimizedKeyboard(buttons, true);

      await updateOrSendMessage(bot, userInfo.chatId, message, keyboard, userInfo.userId, 'trivia_waiting');
    }

    logFunctionEnd('handleJoinTrivia', { gameId }, { userId: userInfo.userId });
  } catch (error) {
    if (error instanceof Error && error.message === 'Player already in game') {
      await answerCallbackQuery(bot, callbackQueryId, 'You are already in this game.');
    } else {
      logError('handleJoinTrivia', error as Error, { userId: userInfo.userId, gameId });
      throw error;
    }
  }
};

const handleGameStarted = async (bot: Bot, game: any) => {
  try {
    const currentPlayer = game.players[game.data.currentPlayerIndex];
    const message = `🎯 <b>Trivia Game Started!</b>\n\n` +
      `Round ${game.data.currentRound}/6\n\n` +
      `It's <b>${currentPlayer.name}</b>'s turn to select a category.`;
    
    const categoryButtons = TRIVIA_CATEGORIES.map(category => {
      // Create shorter category codes
      const categoryMap: { [key: string]: string } = {
        '🌍 Geography': 'geo',
        '📚 Literature': 'lit',
        '⚽ Sports': 'spt',
        '🎬 Entertainment': 'ent',
        '🔬 Science': 'sci',
        '🎨 Art & Culture': 'art',
        '🍔 Food & Drink': 'fod',
        '🌍 History': 'his',
        '🎵 Music': 'mus',
        '💻 Technology': 'tec'
      };
      
      return {
        text: category,
        callbackData: { a: 'tc', g: game.id, c: categoryMap[category] || category }
      };
    });
    
    const keyboard = createOptimizedKeyboard(categoryButtons, true);
    
    // Send to both players
    for (const player of game.players) {
      await updateOrSendMessage(bot, parseInt(player.id), message, keyboard, player.id, 'trivia_playing');
    }
    
    logFunctionEnd('handleGameStarted', { gameId: game.id });
  } catch (error) {
    logError('handleGameStarted', error as Error, { gameId: game.id });
    throw error;
  }
};

const handleSelectCategory = async (bot: Bot, userInfo: { userId: string; chatId: number }, gameId: string, categoryCode: string) => {
  try {
    // Convert short category codes back to full category names
    const categoryMap: { [key: string]: string } = {
      'geo': '🌍 Geography',
      'lit': '📚 Literature',
      'spt': '⚽ Sports',
      'ent': '🎬 Entertainment',
      'sci': '🔬 Science',
      'art': '🎨 Art & Culture',
      'fod': '🍔 Food & Drink',
      'his': '🌍 History',
      'mus': '🎵 Music',
      'tec': '💻 Technology'
    };
    
    const fullCategory = categoryMap[categoryCode] || categoryCode;
    const game = await selectCategory(gameId, userInfo.userId, fullCategory);
    
    // Send the first question to both players independently
    for (const player of game.players) {
      await handleShowQuestionForPlayer(bot, game, player.id);
    }
    
    logFunctionEnd('handleSelectCategory', { gameId, category: fullCategory }, { userId: userInfo.userId });
  } catch (error) {
    logError('handleSelectCategory', error as Error, { userId: userInfo.userId, gameId, category: categoryCode });
    throw error;
  }
};

const handleShowQuestionForPlayer = async (bot: Bot, game: any, playerId: string) => {
  try {
    logFunctionStart('handleShowQuestionForPlayer', { 
      gameId: game.id, 
      playerId,
      hasCategoryQuestions: !!game.data.categoryQuestions?.length
    });
    
    const playerProgress = game.data.playerQuestionProgress[playerId];
    if (!playerProgress || playerProgress.isFinished) {
      logFunctionEnd('handleShowQuestionForPlayer', { gameId: game.id, playerId, result: 'player_finished' });
      return;
    }
    
    const question = game.data.categoryQuestions[playerProgress.currentQuestionIndex];
    if (!question) {
      throw new Error('No current question found for player');
    }
    
    logFunctionStart('handleShowQuestionForPlayer_build_message', { 
      gameId: game.id, 
      playerId,
      questionId: question.id,
      questionText: question.question?.substring(0, 50) + '...',
      optionsCount: question.options?.length,
      questionNumber: playerProgress.currentQuestionIndex + 1
    });
    
    const message = `❓ <b>Question ${playerProgress.currentQuestionIndex + 1}/5</b>\n\n` +
      `<b>${question.question}</b>\n\n` +
      `Category: ${question.category}\n` +
      `⏱ Answer at your own pace`;
    
    const answerButtons = question.options.map((option: string, index: number) => ({
      text: `${String.fromCharCode(65 + index)}) ${option}`,
      callbackData: { a: 'ta', g: game.id, ans: String.fromCharCode(65 + index) }
    }));
    
    logFunctionStart('handleShowQuestionForPlayer_create_keyboard', { 
      gameId: game.id, 
      playerId,
      buttonsCount: answerButtons.length,
      buttonTexts: answerButtons.map((b: any) => b.text)
    });
    
    const keyboard = createOptimizedKeyboard(answerButtons, true);
    
    logFunctionStart('handleShowQuestionForPlayer_send_to_player', { 
      gameId: game.id, 
      playerId
    });
    
    await updateOrSendMessage(bot, parseInt(playerId), message, keyboard, playerId, 'trivia_question');
    
    logFunctionEnd('handleShowQuestionForPlayer_send_to_player', { gameId: game.id, playerId });
    logFunctionEnd('handleShowQuestionForPlayer_build_message', { gameId: game.id, playerId });
    logFunctionEnd('handleShowQuestionForPlayer_create_keyboard', { gameId: game.id, playerId });
    logFunctionEnd('handleShowQuestionForPlayer', { gameId: game.id, playerId, questionId: question.id });
  } catch (error) {
    logError('handleShowQuestionForPlayer', error as Error, { gameId: game.id, playerId });
    throw error;
  }
};

const handleShowQuestion = async (bot: Bot, game: any) => {
  try {
    logFunctionStart('handleShowQuestion', { 
      gameId: game.id, 
      playerCount: game.players.length,
      hasCurrentQuestion: !!game.data.currentQuestion
    });
    
    const question = game.data.currentQuestion;
    if (!question) {
      throw new Error('No current question found');
    }
    
    logFunctionStart('handleShowQuestion_build_message', { 
      gameId: game.id, 
      questionId: question.id,
      questionText: question.question?.substring(0, 50) + '...',
      optionsCount: question.options?.length
    });
    
    const questionNumber = (game.data.questionsAnsweredInCurrentCategory || 0) + 1;
    const message = `❓ <b>Question ${questionNumber}/5</b>\n\n` +
      `<b>${question.question}</b>\n\n` +
      `Category: ${question.category}\n` +
      `⏱ Time limit: 10 seconds`;
    
    const answerButtons = question.options.map((option: string, index: number) => ({
      text: `${String.fromCharCode(65 + index)}) ${option}`,
      callbackData: { a: 'ta', g: game.id, ans: String.fromCharCode(65 + index) }
    }));
    
    logFunctionStart('handleShowQuestion_create_keyboard', { 
      gameId: game.id, 
      buttonsCount: answerButtons.length,
      buttonTexts: answerButtons.map((b: any) => b.text)
    });
    
    const keyboard = createOptimizedKeyboard(answerButtons, true);
    
    logFunctionStart('handleShowQuestion_send_to_players', { 
      gameId: game.id, 
      players: game.players.map((p: any) => ({ id: p.id, name: p.name }))
    });
    
    // Send to both players
    for (const player of game.players) {
      logFunctionStart('handleShowQuestion_send_to_player', { 
        gameId: game.id, 
        playerId: player.id, 
        playerName: player.name 
      });
      await updateOrSendMessage(bot, parseInt(player.id), message, keyboard, player.id, 'trivia_question');
      logFunctionEnd('handleShowQuestion_send_to_player', { 
        gameId: game.id, 
        playerId: player.id 
      });
    }
    
    logFunctionEnd('handleShowQuestion_send_to_players', { gameId: game.id });
    logFunctionEnd('handleShowQuestion_build_message', { gameId: game.id });
    logFunctionEnd('handleShowQuestion_create_keyboard', { gameId: game.id });
    logFunctionEnd('handleShowQuestion', { gameId: game.id, questionId: question.id });
  } catch (error) {
    logError('handleShowQuestion', error as Error, { gameId: game.id });
    throw error;
  }
};

const handleAnswerQuestion = async (bot: Bot, userInfo: { userId: string; chatId: number }, gameId: string, answerCode: string) => {
  try {
    logFunctionStart('handleAnswerQuestion', { userId: userInfo.userId, gameId, answerCode });

    // Get current game state
    const game = await getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    
    // Check if category is complete and waiting for next round
    if (game.data.roundStatus === 'category_complete') {
      // Show category selection for next player
      const nextPlayer = game.players[game.data.currentPlayerIndex as number];
      const message = `📊 Category complete! Next: <b>${nextPlayer.name}</b> selects category`;
      
      const categoryButtons = TRIVIA_CATEGORIES.map(category => {
        // Map full category names to short codes
        const categoryMap: { [key: string]: string } = {
          '🌍 Geography': 'geo',
          '📚 Literature': 'lit',
          '⚽ Sports': 'spt',
          '🎬 Entertainment': 'ent',
          '🔬 Science': 'sci',
          '🎨 Art & Culture': 'art',
          '🍔 Food & Drink': 'fod',
          '🌍 History': 'his',
          '🎵 Music': 'mus',
          '💻 Technology': 'tec'
        };
        
        return {
          text: category,
          callbackData: { a: 'tc', g: game.id, c: categoryMap[category] || category }
        };
      });
      
      const keyboard = createOptimizedKeyboard(categoryButtons, true);
      
      await updateOrSendMessage(bot, userInfo.chatId, message, keyboard, userInfo.userId, 'trivia_round_result');
      return;
    }
    
    // Get current question for this player
    const currentQuestion = await getCurrentQuestionForPlayer(gameId, userInfo.userId);
    if (!currentQuestion) {
      throw new Error('No current question found for player');
    }
    
    // Convert answer code (A, B, C, D) to actual answer
    const answerIndex = answerCode.charCodeAt(0) - 65; // Convert A=0, B=1, C=2, D=3
    const actualAnswer = currentQuestion.options[answerIndex];
    
    if (!actualAnswer) {
      throw new Error('Invalid answer code');
    }
    
    logFunctionStart('handleAnswerQuestion_call_answerQuestionForPlayer', { userId: userInfo.userId, gameId, actualAnswer });
    const result = await answerQuestionForPlayer(gameId, userInfo.userId, actualAnswer);
    logFunctionEnd('handleAnswerQuestion_call_answerQuestionForPlayer', { userId: userInfo.userId, gameId, actualAnswer, result });

    // Show result to player
    const status = result.isCorrect ? '✅' : '❌';
    let message = `${status} You answered: <b>${actualAnswer}</b>\n` +
      `Correct answer: <b>${currentQuestion.correctAnswer}</b>\n\n`;
    
    if (result.isFinished) {
      message += `🎉 <b>Category complete!</b>\n` +
        `You finished all 5 questions.\n\n` +
        `Waiting for other player to finish...`;
      
      await updateOrSendMessage(bot, userInfo.chatId, message, undefined, userInfo.userId, 'trivia_waiting_answer');
      
      // Check if both players finished
      const completionResult = await checkCategoryCompletion(gameId);
      if (completionResult.isComplete) {
        if (completionResult.shouldProceedToNextRound) {
          // Show round results to both players
          const updatedGame = await getGame(gameId);
          if (updatedGame) {
            await handleShowRoundResult(bot, updatedGame);
          }
        } else {
          // Game is complete
          const updatedGame = await getGame(gameId);
          if (updatedGame) {
            await handleGameFinished(bot, updatedGame);
          }
        }
      }
    } else {
      // Show next question
      message += `📝 <b>Next question:</b>`;
      await updateOrSendMessage(bot, userInfo.chatId, message, undefined, userInfo.userId, 'trivia_waiting_answer');
      
      // Send next question after a short delay
      setTimeout(async () => {
        try {
          const updatedGame = await getGame(gameId);
          if (updatedGame) {
            await handleShowQuestionForPlayer(bot, updatedGame, userInfo.userId);
          }
        } catch (error) {
          logError('handleAnswerQuestion_show_next_question', error as Error, { gameId, userId: userInfo.userId });
        }
      }, 1000);
    }

    logFunctionEnd('handleAnswerQuestion', { gameId, answer: actualAnswer, isCorrect: result.isCorrect, isFinished: result.isFinished }, { userId: userInfo.userId });
  } catch (error) {
    logError('handleAnswerQuestion', error as Error, { userId: userInfo.userId, gameId, answerCode });
    throw error;
  }
};

const handleShowRoundResult = async (bot: Bot, game: any) => {
  try {
    const currentCategory = game.data.selectedCategories[game.data.currentCategoryIndex];
    const playerProgress = game.data.playerQuestionProgress || {};
    
    let message = `📊 <b>Category Complete: ${currentCategory}</b>\n\n`;
    message += `All 5 questions completed!\n\n`;
    
    // Show results for each player
    for (const player of game.players) {
      const progress = playerProgress[player.id];
      message += `<b>${player.name}</b>:\n`;
      
      if (progress && progress.answers) {
        let correctAnswers = 0;
        for (let i = 0; i < QUESTIONS_PER_CATEGORY; i++) {
          const answer = progress.answers[i];
          if (answer) {
            const status = answer.isCorrect ? '✅' : '❌';
            const question = game.data.categoryQuestions[i];
            message += `  ${status} Q${i + 1}: ${answer.answer}\n`;
            if (answer.isCorrect) correctAnswers++;
          }
        }
        message += `  Total: ${correctAnswers}/5 correct\n`;
      }
      
      message += `  Score: ${game.data.scores[player.id] || 0} points\n\n`;
    }
    
    // Check if game is finished (6 rounds = 3 categories per player)
    if (game.data.currentRound >= 6) {
      await handleGameFinished(bot, game);
    } else {
      // Continue to next round
      const nextPlayer = game.players[game.data.currentPlayerIndex];
      message += `Next: <b>${nextPlayer.name}</b> selects category`;
      
      const categoryButtons = TRIVIA_CATEGORIES.map(category => {
        // Map full category names to short codes
        const categoryMap: { [key: string]: string } = {
          '🌍 Geography': 'geo',
          '📚 Literature': 'lit',
          '⚽ Sports': 'spt',
          '🎬 Entertainment': 'ent',
          '🔬 Science': 'sci',
          '🎨 Art & Culture': 'art',
          '🍔 Food & Drink': 'fod',
          '🌍 History': 'his',
          '🎵 Music': 'mus',
          '💻 Technology': 'tec'
        };
        
        return {
          text: category,
          callbackData: { a: 'tc', g: game.id, c: categoryMap[category] || category }
        };
      });
      
      const keyboard = createOptimizedKeyboard(categoryButtons, true);
      
      // Send to both players
      for (const player of game.players) {
        await updateOrSendMessage(bot, parseInt(player.id), message, keyboard, player.id, 'trivia_round_result');
      }
    }
    
    logFunctionEnd('handleShowRoundResult', { gameId: game.id });
  } catch (error) {
    logError('handleShowRoundResult', error as Error, { gameId: game.id });
    throw error;
  }
};

const handleGameFinished = async (bot: Bot, game: any) => {
  try {
    const scores = game.data.scores as Record<string, number>;
    const playerScores = Object.values(scores);
    
    let message = `🏆 <b>Game Finished!</b>\n\n`;
    
    for (let i = 0; i < game.players.length; i++) {
      const player = game.players[i];
      const score = scores[player.id] || 0;
      message += `${player.name}: <b>${score} points</b>\n`;
    }
    
    message += '\n';
    
    if (playerScores[0] > playerScores[1]) {
      const winner = game.players[0];
      message += `🏆 <b>${winner.name} wins!</b>\n`;
      message += `+20 Coins`;
    } else if (playerScores[1] > playerScores[0]) {
      const winner = game.players[1];
      message += `🏆 <b>${winner.name} wins!</b>\n`;
      message += `+20 Coins`;
    } else {
      message += `🤝 <b>It's a draw!</b>\n`;
      message += `+10 Coins each`;
    }
    
    const buttons = [
      { text: '🔄 Play Again', callbackData: { a: 'tpa' } }
    ];
    
    const keyboard = createOptimizedKeyboard(buttons, true);
    
    // Send to both players
    for (const player of game.players) {
      await updateOrSendMessage(bot, parseInt(player.id), message, keyboard, player.id, 'trivia_finished');
    }
    
    logFunctionEnd('handleGameFinished', { gameId: game.id });
  } catch (error) {
    logError('handleGameFinished', error as Error, { gameId: game.id });
    throw error;
  }
};

const handlePlayAgain = async (bot: Bot, userInfo: { userId: string; chatId: number }) => {
  try {
    await handleStartTrivia(bot, userInfo);
    
    logFunctionEnd('handlePlayAgain', {}, { userId: userInfo.userId });
  } catch (error) {
    logError('handlePlayAgain', error as Error, { userId: userInfo.userId });
    throw error;
  }
}; 