import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Firebase
vi.mock('../src/core/firebase', () => ({
  database: null,
}));

// Mock services
vi.mock('../src/core/userService', () => ({
  getUser: vi.fn(),
  deductCoins: vi.fn(),
  addCoins: vi.fn(),
}));

vi.mock('../src/core/gameService', () => ({
  createGame: vi.fn(),
  updateGame: vi.fn(),
  getGame: vi.fn(),
  finishGame: vi.fn(),
}));

// Import the functions we want to test
import { startDiceGame } from '../src/games/dice/startGame';
import { startBasketballGame } from '../src/games/basketball/startGame';
import { startFootballGame } from '../src/games/football/startGame';
import { startBlackjackGame } from '../src/games/blackjack/startGame';
import { startBowlingGame } from '../src/games/bowling/startGame';
import { handleDiceTurn } from '../src/games/dice/handleTurn';
import { GameStatus } from '../src/core/types';

describe('Game State Management Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    const { getUser, deductCoins } = require('../src/core/userService');
    const { createGame, updateGame, getGame, finishGame } = require('../src/core/gameService');
    
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
      status: GameStatus.WAITING,
      players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
      currentPlayerIndex: 0,
      stake: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {},
    });
    
    updateGame.mockResolvedValue({
      id: 'test_game_123',
      status: GameStatus.PLAYING,
      data: { playerGuess: 0, diceResult: 0, isWon: false },
    });
    
    getGame.mockResolvedValue({
      id: 'test_game_123',
      status: GameStatus.PLAYING,
      players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
      stake: 2,
      data: { playerGuess: 0, diceResult: 0, isWon: false },
    });
    
    finishGame.mockResolvedValue(undefined);
  });

  describe('Game Start Functions', () => {
    it('should set game status to PLAYING for single-player games', async () => {
      const result = await startDiceGame('123', 2);
      
      expect(result.success).toBe(true);
      expect(result.gameId).toBe('test_game_123');
      
      const { updateGame } = require('../src/core/gameService');
      expect(updateGame).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          status: GameStatus.PLAYING,
          data: expect.objectContaining({
            playerGuess: 0,
            diceResult: 0,
            isWon: false,
          }),
        })
      );
    });

    it('should set basketball game status to PLAYING', async () => {
      const result = await startBasketballGame('123', 5);
      
      expect(result.success).toBe(true);
      
      const { updateGame } = require('../src/core/gameService');
      expect(updateGame).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          status: GameStatus.PLAYING,
        })
      );
    });

    it('should set football game status to PLAYING', async () => {
      const result = await startFootballGame('123', 10);
      
      expect(result.success).toBe(true);
      
      const { updateGame } = require('../src/core/gameService');
      expect(updateGame).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          status: GameStatus.PLAYING,
        })
      );
    });

    it('should set blackjack game status to PLAYING', async () => {
      const result = await startBlackjackGame('123', 20);
      
      expect(result.success).toBe(true);
      
      const { updateGame } = require('../src/core/gameService');
      expect(updateGame).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          status: GameStatus.PLAYING,
        })
      );
    });

    it('should set bowling game status to PLAYING', async () => {
      const result = await startBowlingGame('123', 5);
      
      expect(result.success).toBe(true);
      
      const { updateGame } = require('../src/core/gameService');
      expect(updateGame).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          status: GameStatus.PLAYING,
        })
      );
    });
  });

  describe('Game Turn Handling', () => {
    it('should accept turns only when game is in PLAYING status', async () => {
      const result = await handleDiceTurn('test_game_123', 3);
      
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result?.playerGuess).toBe(3);
      expect(result.result?.diceResult).toBeGreaterThanOrEqual(1);
      expect(result.result?.diceResult).toBeLessThanOrEqual(6);
    });

    it('should reject turns when game is in WAITING status', async () => {
      const { getGame } = require('../src/core/gameService');
      getGame.mockResolvedValue({
        id: 'test_game_123',
        status: GameStatus.WAITING,
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        data: { playerGuess: 0, diceResult: 0, isWon: false },
      });
      
      const result = await handleDiceTurn('test_game_123', 3);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Game is not in playing state.');
    });

    it('should reject turns when game is in FINISHED status', async () => {
      const { getGame } = require('../src/core/gameService');
      getGame.mockResolvedValue({
        id: 'test_game_123',
        status: GameStatus.FINISHED,
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        data: { playerGuess: 0, diceResult: 0, isWon: false },
      });
      
      const result = await handleDiceTurn('test_game_123', 3);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Game is not in playing state.');
    });

    it('should reject turns when game is not found', async () => {
      const { getGame } = require('../src/core/gameService');
      getGame.mockResolvedValue(null);
      
      const result = await handleDiceTurn('invalid_game', 3);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Game not found.');
    });
  });

  describe('Game Result Handling', () => {
    it('should finish game with proper result structure', async () => {
      const result = await handleDiceTurn('test_game_123', 3);
      
      expect(result.success).toBe(true);
      
      const { finishGame } = require('../src/core/gameService');
      expect(finishGame).toHaveBeenCalledWith(
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

    it('should handle winning game result correctly', async () => {
      // Mock a winning scenario
      const { getGame } = require('../src/core/gameService');
      getGame.mockResolvedValue({
        id: 'test_game_123',
        status: GameStatus.PLAYING,
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        data: { playerGuess: 0, diceResult: 0, isWon: false },
      });
      
      const result = await handleDiceTurn('test_game_123', 3);
      
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      
      // Check that the result has the correct structure
      if (result.result?.isWon) {
        expect(result.result.coinsWon).toBeGreaterThan(0);
        expect(result.result.coinsLost).toBe(0);
      } else {
        expect(result.result?.coinsWon).toBe(0);
        expect(result.result?.coinsLost).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle insufficient coins error', async () => {
      const { getUser } = require('../src/core/userService');
      getUser.mockResolvedValue({
        id: '123',
        username: 'testuser',
        name: 'Test User',
        coins: 1, // Not enough for stake of 2
      });
      
      const result = await startDiceGame('123', 2);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient coins for this stake.');
    });

    it('should handle invalid stake amount', async () => {
      const result = await startDiceGame('123', 0);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid stake amount. Must be between 1 and 1000 coins.');
    });

    it('should handle invalid guess', async () => {
      const result = await handleDiceTurn('test_game_123', 0);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid guess. Must be between 1 and 6.');
    });

    it('should handle invalid guess above range', async () => {
      const result = await handleDiceTurn('test_game_123', 7);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid guess. Must be between 1 and 6.');
    });
  });

  describe('Coin Management', () => {
    it('should deduct coins when starting game', async () => {
      await startDiceGame('123', 5);
      
      const { deductCoins } = require('../src/core/userService');
      expect(deductCoins).toHaveBeenCalledWith('123', 5, 'dice_game_stake');
    });

    it('should add coins when player wins', async () => {
      // Mock a winning scenario by manipulating the random dice result
      const originalMathRandom = Math.random;
      Math.random = vi.fn(() => 0.166); // This will give dice result of 1
      
      const { getGame } = require('../src/core/gameService');
      getGame.mockResolvedValue({
        id: 'test_game_123',
        status: GameStatus.PLAYING,
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        data: { playerGuess: 0, diceResult: 0, isWon: false },
      });
      
      const result = await handleDiceTurn('test_game_123', 1);
      
      const { addCoins } = require('../src/core/userService');
      if (result.result?.isWon) {
        expect(addCoins).toHaveBeenCalledWith('123', 10, 'dice_game_win'); // 5x stake
      }
      
      // Restore Math.random
      Math.random = originalMathRandom;
    });
  });
}); 