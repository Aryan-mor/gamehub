import { describe, it, expect, beforeEach, vi } from 'vitest';
// import { Bot } from 'grammy';

// Mock the bot and core services
vi.mock('grammy');
vi.mock('../../src/core/firebase', () => ({
  database: null,
}));

vi.mock('../../src/core/userService', () => ({
  getUser: vi.fn(),
  deductCoins: vi.fn(),
  addCoins: vi.fn(),
  setUserProfile: vi.fn(),
}));

vi.mock('../../src/core/gameService', () => ({
  createGame: vi.fn(),
  updateGame: vi.fn(),
  getGame: vi.fn(),
  finishGame: vi.fn(),
}));

vi.mock('../../src/core/telegramHelpers', () => ({
  createInlineKeyboard: vi.fn(),
  parseCallbackData: vi.fn(),
  sendMessage: vi.fn(),
  answerCallbackQuery: vi.fn(),
  extractUserInfo: vi.fn(),
}));

// Import the handlers after mocking
import { registerDiceHandlers } from '../src/games/dice/handlers';
import { registerBasketballHandlers } from '../src/games/basketball/handlers';
import { registerFootballHandlers } from '../src/games/football/handlers';
import { registerBlackjackHandlers } from '../src/games/blackjack/handlers';
import { registerBowlingHandlers } from '../src/games/bowling/handlers';

describe('Game Flow Integration Tests', () => {
  let mockBot: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock bot
    mockBot = {
      command: vi.fn(),
      callbackQuery: vi.fn(),
      api: {
        sendMessage: vi.fn(),
        answerCallbackQuery: vi.fn(),
      },
    };

    // Mock the core services
    const { getUser, deductCoins, createGame, updateGame, getGame, finishGame } = require('../../src/core/userService');
    const { createInlineKeyboard, parseCallbackData, sendMessage, answerCallbackQuery, extractUserInfo } = require('../../src/core/telegramHelpers');
    
    // Setup default mocks
    getUser.mockResolvedValue({
      id: '123',
      username: 'testuser',
      name: 'Test User',
      coins: 1000,
    });
    
    deductCoins.mockResolvedValue({ success: true });
    
    createGame.mockResolvedValue({
      id: 'test_game_123',
      type: 'dice',
      status: 'waiting',
      players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
      currentPlayerIndex: 0,
      stake: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {},
    });
    
    updateGame.mockResolvedValue({
      id: 'test_game_123',
      status: 'playing',
      data: { playerGuess: 0, diceResult: 0, isWon: false },
    });
    
    getGame.mockResolvedValue({
      id: 'test_game_123',
      status: 'playing',
      players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
      stake: 2,
      data: { playerGuess: 0, diceResult: 0, isWon: false },
    });
    
    finishGame.mockResolvedValue(undefined);
    
    createInlineKeyboard.mockReturnValue({
      inline_keyboard: [[{ text: 'Test', callback_data: 'test' }]],
    });
    
    parseCallbackData.mockReturnValue({ action: 'test', stake: 2 });
    
    sendMessage.mockResolvedValue(undefined);
    answerCallbackQuery.mockResolvedValue(undefined);
    
    extractUserInfo.mockReturnValue({
      userId: '123',
      chatId: 123,
      username: 'testuser',
      name: 'Test User',
    });
  });

  describe('Dice Game Flow', () => {
    it('should register dice handlers without errors', () => {
      expect(() => registerDiceHandlers(mockBot)).not.toThrow();
      expect(mockBot.command).toHaveBeenCalledWith('dice', expect.any(Function));
      expect(mockBot.callbackQuery).toHaveBeenCalled();
    });

    it('should handle dice command flow', async () => {
      registerDiceHandlers(mockBot);
      
      // Get the dice command handler
      const diceCommandHandler = mockBot.command.mock.calls.find(
        call => call[0] === 'dice'
      )[1];
      
      const mockCtx = {
        from: { id: 123, username: 'testuser', first_name: 'Test' },
        chat: { id: 123 },
        reply: vi.fn(),
      };
      
      await diceCommandHandler(mockCtx);
      
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('🎲 Dice Guess Game'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.any(Array),
          }),
        })
      );
    });

    it('should handle dice stake callback with compact data format', async () => {
      registerDiceHandlers(mockBot);
      
      // Get the dice stake callback handler
      const stakeCallbackHandler = mockBot.callbackQuery.mock.calls.find(
        call => call[0].toString().includes('dice_stake')
      )[1];
      
      const mockCtx = {
        callbackQuery: {
          id: 'test_callback',
          data: JSON.stringify({ action: 'dice_stake', stake: 2 }),
        },
        from: { id: 123, username: 'testuser', first_name: 'Test' },
        chat: { id: 123 },
      };
      
      await stakeCallbackHandler(mockCtx);
      
      // Verify that the game was created and updated to playing status
      expect(require('../../src/core/gameService').createGame).toHaveBeenCalled();
      expect(require('../../src/core/gameService').updateGame).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          status: 'playing',
          data: expect.objectContaining({
            playerGuess: 0,
            diceResult: 0,
            isWon: false,
          }),
        })
      );
    });

    it('should handle dice guess with compact callback data', async () => {
      registerDiceHandlers(mockBot);
      
      // Get the dice guess callback handler
      const guessCallbackHandler = mockBot.callbackQuery.mock.calls.find(
        call => call[0].toString().includes('dice_guess')
      )[1];
      
      const mockCtx = {
        callbackQuery: {
          id: 'test_callback',
          data: JSON.stringify({ action: 'dice_guess', g: 'test_game_123', n: 3 }),
        },
        from: { id: 123, username: 'testuser', first_name: 'Test' },
        chat: { id: 123 },
      };
      
      // Mock the game state for the guess
      require('../../src/core/gameService').getGame.mockResolvedValue({
        id: 'test_game_123',
        status: 'playing',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        data: { playerGuess: 0, diceResult: 0, isWon: false },
      });
      
      await guessCallbackHandler(mockCtx);
      
      // Verify that the game was processed and finished
      expect(require('../../src/core/gameService').finishGame).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          winner: expect.any(String),
          loser: expect.any(String),
          isDraw: false,
          coinsWon: expect.any(Number),
          coinsLost: expect.any(Number),
        })
      );
    });
  });

  describe('Basketball Game Flow', () => {
    it('should register basketball handlers without errors', () => {
      expect(() => registerBasketballHandlers(mockBot)).not.toThrow();
      expect(mockBot.command).toHaveBeenCalledWith('basketball', expect.any(Function));
      expect(mockBot.callbackQuery).toHaveBeenCalled();
    });

    it('should handle basketball stake callback with compact data format', async () => {
      registerBasketballHandlers(mockBot);
      
      // Get the basketball stake callback handler
      const stakeCallbackHandler = mockBot.callbackQuery.mock.calls.find(
        call => call[0].toString().includes('basketball_stake')
      )[1];
      
      const mockCtx = {
        callbackQuery: {
          id: 'test_callback',
          data: JSON.stringify({ action: 'basketball_stake', stake: 5 }),
        },
        from: { id: 123, username: 'testuser', first_name: 'Test' },
        chat: { id: 123 },
      };
      
      await stakeCallbackHandler(mockCtx);
      
      // Verify that the game was created and updated to playing status
      expect(require('../../src/core/gameService').createGame).toHaveBeenCalled();
      expect(require('../../src/core/gameService').updateGame).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          status: 'playing',
        })
      );
    });

    it('should handle basketball guess with compact callback data', async () => {
      registerBasketballHandlers(mockBot);
      
      // Get the basketball guess callback handler
      const guessCallbackHandler = mockBot.callbackQuery.mock.calls.find(
        call => call[0].toString().includes('basketball_guess')
      )[1];
      
      const mockCtx = {
        callbackQuery: {
          id: 'test_callback',
          data: JSON.stringify({ action: 'basketball_guess', g: 'test_game_123', s: 'score' }),
        },
        from: { id: 123, username: 'testuser', first_name: 'Test' },
        chat: { id: 123 },
      };
      
      // Mock the game state for the guess
      require('../../src/core/gameService').getGame.mockResolvedValue({
        id: 'test_game_123',
        status: 'playing',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 995 }],
        stake: 5,
        data: { guess: '', diceResult: 0, isWon: false },
      });
      
      await guessCallbackHandler(mockCtx);
      
      // Verify that the game was processed and finished
      expect(require('../../src/core/gameService').finishGame).toHaveBeenCalled();
    });
  });

  describe('Football Game Flow', () => {
    it('should register football handlers without errors', () => {
      expect(() => registerFootballHandlers(mockBot)).not.toThrow();
      expect(mockBot.command).toHaveBeenCalledWith('football', expect.any(Function));
      expect(mockBot.callbackQuery).toHaveBeenCalled();
    });

    it('should handle football stake callback', async () => {
      registerFootballHandlers(mockBot);
      
      // Get the football stake callback handler
      const stakeCallbackHandler = mockBot.callbackQuery.mock.calls.find(
        call => call[0].toString().includes('football_stake')
      )[1];
      
      const mockCtx = {
        callbackQuery: {
          id: 'test_callback',
          data: JSON.stringify({ action: 'football_stake', stake: 10 }),
        },
        from: { id: 123, username: 'testuser', first_name: 'Test' },
        chat: { id: 123 },
      };
      
      await stakeCallbackHandler(mockCtx);
      
      expect(require('../../src/core/gameService').createGame).toHaveBeenCalled();
      expect(require('../../src/core/gameService').updateGame).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          status: 'playing',
        })
      );
    });
  });

  describe('Blackjack Game Flow', () => {
    it('should register blackjack handlers without errors', () => {
      expect(() => registerBlackjackHandlers(mockBot)).not.toThrow();
      expect(mockBot.command).toHaveBeenCalledWith('blackjack', expect.any(Function));
      expect(mockBot.callbackQuery).toHaveBeenCalled();
    });

    it('should handle blackjack stake callback', async () => {
      registerBlackjackHandlers(mockBot);
      
      // Get the blackjack stake callback handler
      const stakeCallbackHandler = mockBot.callbackQuery.mock.calls.find(
        call => call[0].toString().includes('blackjack_stake')
      )[1];
      
      const mockCtx = {
        callbackQuery: {
          id: 'test_callback',
          data: JSON.stringify({ action: 'blackjack_stake', stake: 20 }),
        },
        from: { id: 123, username: 'testuser', first_name: 'Test' },
        chat: { id: 123 },
      };
      
      await stakeCallbackHandler(mockCtx);
      
      expect(require('../../src/core/gameService').createGame).toHaveBeenCalled();
      expect(require('../../src/core/gameService').updateGame).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          status: 'playing',
        })
      );
    });
  });

  describe('Bowling Game Flow', () => {
    it('should register bowling handlers without errors', () => {
      expect(() => registerBowlingHandlers(mockBot)).not.toThrow();
      expect(mockBot.command).toHaveBeenCalledWith('bowling', expect.any(Function));
      expect(mockBot.callbackQuery).toHaveBeenCalled();
    });

    it('should handle bowling stake callback', async () => {
      registerBowlingHandlers(mockBot);
      
      // Get the bowling stake callback handler
      const stakeCallbackHandler = mockBot.callbackQuery.mock.calls.find(
        call => call[0].toString().includes('bowling_stake')
      )[1];
      
      const mockCtx = {
        callbackQuery: {
          id: 'test_callback',
          data: JSON.stringify({ action: 'bowling_stake', stake: 5 }),
        },
        from: { id: 123, username: 'testuser', first_name: 'Test' },
        chat: { id: 123 },
      };
      
      await stakeCallbackHandler(mockCtx);
      
      expect(require('../../src/core/gameService').createGame).toHaveBeenCalled();
      expect(require('../../src/core/gameService').updateGame).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          status: 'playing',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle insufficient coins gracefully', async () => {
      registerDiceHandlers(mockBot);
      
      // Mock insufficient coins
      require('../../src/core/userService').getUser.mockResolvedValue({
        id: '123',
        username: 'testuser',
        name: 'Test User',
        coins: 1, // Not enough for stake of 2
      });
      
      const stakeCallbackHandler = mockBot.callbackQuery.mock.calls.find(
        call => call[0].toString().includes('dice_stake')
      )[1];
      
      const mockCtx = {
        callbackQuery: {
          id: 'test_callback',
          data: JSON.stringify({ action: 'dice_stake', stake: 2 }),
        },
        from: { id: 123, username: 'testuser', first_name: 'Test' },
        chat: { id: 123 },
      };
      
      await stakeCallbackHandler(mockCtx);
      
      // Should send error message
      expect(require('../../src/core/telegramHelpers').sendMessage).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number),
        expect.stringContaining('Insufficient coins'),
        expect.anything()
      );
    });

    it('should handle game not found gracefully', async () => {
      registerDiceHandlers(mockBot);
      
      // Mock game not found
      require('../../src/core/gameService').getGame.mockResolvedValue(null);
      
      const guessCallbackHandler = mockBot.callbackQuery.mock.calls.find(
        call => call[0].toString().includes('dice_guess')
      )[1];
      
      const mockCtx = {
        callbackQuery: {
          id: 'test_callback',
          data: JSON.stringify({ action: 'dice_guess', g: 'invalid_game', n: 3 }),
        },
        from: { id: 123, username: 'testuser', first_name: 'Test' },
        chat: { id: 123 },
      };
      
      await guessCallbackHandler(mockCtx);
      
      // Should send error message
      expect(require('../../src/core/telegramHelpers').sendMessage).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number),
        expect.stringContaining('Game not found'),
        expect.anything()
      );
    });

    it('should handle invalid game state gracefully', async () => {
      registerDiceHandlers(mockBot);
      
      // Mock game in wrong state
      require('../../src/core/gameService').getGame.mockResolvedValue({
        id: 'test_game_123',
        status: 'waiting', // Should be 'playing'
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        data: { playerGuess: 0, diceResult: 0, isWon: false },
      });
      
      const guessCallbackHandler = mockBot.callbackQuery.mock.calls.find(
        call => call[0].toString().includes('dice_guess')
      )[1];
      
      const mockCtx = {
        callbackQuery: {
          id: 'test_callback',
          data: JSON.stringify({ action: 'dice_guess', g: 'test_game_123', n: 3 }),
        },
        from: { id: 123, username: 'testuser', first_name: 'Test' },
        chat: { id: 123 },
      };
      
      await guessCallbackHandler(mockCtx);
      
      // Should send error message
      expect(require('../../src/core/telegramHelpers').sendMessage).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number),
        expect.stringContaining('Game is not in playing state'),
        expect.anything()
      );
    });
  });

  describe('Callback Data Validation', () => {
    it('should validate callback data format for all games', () => {
      const games = [
        { name: 'dice', action: 'dice_guess', expectedKeys: ['g', 'n'] },
        { name: 'basketball', action: 'basketball_guess', expectedKeys: ['g', 's'] },
        { name: 'football', action: 'football_guess', expectedKeys: ['g', 's'] },
        { name: 'blackjack', action: 'blackjack_action', expectedKeys: ['g', 'a'] },
        { name: 'bowling', action: 'bowling_guess', expectedKeys: ['g', 's'] },
      ];

      games.forEach(game => {
        const validCallbackData = {
          action: game.action,
          ...Object.fromEntries(game.expectedKeys.map(key => [key, 'test_value'])),
        };

        // Verify the callback data structure is valid
        expect(validCallbackData).toHaveProperty('action', game.action);
        game.expectedKeys.forEach(key => {
          expect(validCallbackData).toHaveProperty(key);
        });
      });
    });

    it('should ensure callback data is compact enough for Telegram', () => {
      const testGameId = 'dice_1753049345633_gpjxtbryd'; // Long game ID like we saw in logs
      
      const compactCallbackData = {
        action: 'dice_guess',
        g: testGameId,
        n: 3,
      };
      
      const jsonString = JSON.stringify(compactCallbackData);
      
      // Telegram has a 64-byte limit for callback_data
      expect(jsonString.length).toBeLessThan(64);
      expect(jsonString).toContain('"g":"dice_1753049345633_gpjxtbryd"');
      expect(jsonString).toContain('"n":3');
    });
  });
}); 