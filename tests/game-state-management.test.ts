import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStatus, GameType } from '../src/core/types';

// Import the actual modules to be mocked
import * as userService from '../src/core/userService';
import * as gameService from '../src/core/gameService';

// Mock the modules at the top level
vi.mock('../src/core/firebase', () => ({
  database: null,
}));
vi.mock('../src/core/userService');
vi.mock('../src/core/gameService');

// Import the functions we want to test
import { startDiceGame } from '../src/games/dice/startGame';
import { startBasketballGame } from '../src/games/basketball/startGame';
import { startFootballGame } from '../src/games/football/startGame';
import { startBlackjackGame } from '../src/games/blackjack/startGame';
import { startBowlingGame } from '../src/games/bowling/startGame';
import { handleDiceTurn } from '../src/games/dice/handleTurn';

describe('Game State Management Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup default mocks using vi.mocked
    vi.mocked(userService.getUser).mockResolvedValue({
      id: '123',
      username: 'testuser',
      name: 'Test User',
      coins: 1000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    vi.mocked(userService.deductCoins).mockResolvedValue(true); // deductCoins returns boolean
    
    vi.mocked(gameService.createGame).mockResolvedValue({
      id: 'test_game_123',
      type: GameType.DICE,
      status: GameStatus.WAITING,
      players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
      currentPlayerIndex: 0,
      stake: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {},
    });
    vi.mocked(gameService.updateGame).mockResolvedValue({
      id: 'test_game_123',
      type: GameType.DICE,
      players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
      currentPlayerIndex: 0,
      stake: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: GameStatus.PLAYING,
      data: { playerGuess: 0, diceResult: 0, isWon: false },
    });
    vi.mocked(gameService.getGame).mockResolvedValue({
      id: 'test_game_123',
      type: GameType.DICE,
      players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
      currentPlayerIndex: 0,
      stake: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: GameStatus.PLAYING,
      data: { playerGuess: 0, diceResult: 0, isWon: false },
    });
    vi.mocked(gameService.finishGame).mockResolvedValue(undefined);
  });

  describe('Game Start Functions', () => {
    it('should set game status to PLAYING for single-player games', async () => {
      const result = await startDiceGame('123', 2);
      
      expect(result.success).toBe(true);
      expect(result.gameId).toBe('test_game_123');
      
      expect(vi.mocked(gameService.updateGame)).toHaveBeenCalledWith(
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
      
      expect(vi.mocked(gameService.updateGame)).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          status: GameStatus.PLAYING,
        })
      );
    });

    it('should set football game status to PLAYING', async () => {
      const result = await startFootballGame('123', 5);
      
      expect(result.success).toBe(true);
      
      expect(vi.mocked(gameService.updateGame)).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          status: GameStatus.PLAYING,
        })
      );
    });

    it('should set blackjack game status to PLAYING', async () => {
      const result = await startBlackjackGame('123', 10);
      
      expect(result.success).toBe(true);
      
      expect(vi.mocked(gameService.updateGame)).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          status: GameStatus.PLAYING,
        })
      );
    });

    it('should set bowling game status to PLAYING', async () => {
      const result = await startBowlingGame('123', 5);
      
      expect(result.success).toBe(true);
      
      expect(vi.mocked(gameService.updateGame)).toHaveBeenCalledWith(
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
    });

    it('should reject turns when game is in WAITING status', async () => {
      vi.mocked(gameService.getGame).mockResolvedValue({
        id: 'test_game_123',
        status: GameStatus.WAITING,
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        currentPlayerIndex: 0,
        type: GameType.DICE,
        data: {},
      });

      const result = await handleDiceTurn('test_game_123', 3);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Game is not in playing state.');
    });

    it('should reject turns when game is in FINISHED status', async () => {
      vi.mocked(gameService.getGame).mockResolvedValue({
        id: 'test_game_123',
        status: GameStatus.FINISHED,
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        currentPlayerIndex: 0,
        type: GameType.DICE,
        data: {},
      });

      const result = await handleDiceTurn('test_game_123', 3);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Game is not in playing state.');
    });

    it('should reject turns when game is not found', async () => {
      vi.mocked(gameService.getGame).mockResolvedValue(null);

      const result = await handleDiceTurn('test_game_123', 3);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Game not found');
    });
  });

  describe('Game Result Handling', () => {
    it('should finish game with proper result structure', async () => {
      const result = await handleDiceTurn('test_game_123', 3);
      
      expect(result.success).toBe(true);
      
      expect(vi.mocked(gameService.finishGame)).toHaveBeenCalledWith(
        'test_game_123',
        expect.objectContaining({
          isDraw: expect.any(Boolean),
          coinsWon: expect.any(Number),
          coinsLost: expect.any(Number),
        })
      );
    });

    it('should handle winning game result correctly', async () => {
      // Mock a winning scenario
      vi.mocked(gameService.getGame).mockResolvedValue({
        id: 'test_game_123',
        status: GameStatus.PLAYING,
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        currentPlayerIndex: 0,
        type: GameType.DICE,
        data: { playerGuess: 3, diceResult: 3, isWon: true },
      });

      const result = await handleDiceTurn('test_game_123', 3);
      
      expect(result.success).toBe(true);
      expect(vi.mocked(gameService.finishGame)).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle insufficient coins error', async () => {
      vi.mocked(userService.getUser).mockResolvedValue({
        id: '123',
        username: 'testuser',
        name: 'Test User',
        coins: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const result = await startDiceGame('123', 5);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient coins');
    });

    it('should handle invalid stake amount', async () => {
      const result = await startDiceGame('123', -1);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid stake amount');
    });

    it('should handle invalid guess', async () => {
      const result = await handleDiceTurn('test_game_123', -1);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid guess');
    });

    it('should handle invalid guess above range', async () => {
      const result = await handleDiceTurn('test_game_123', 7);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid guess');
    });
  });

  describe('Coin Management', () => {
    it('should deduct coins when starting game', async () => {
      await startDiceGame('123', 5);
      
      expect(vi.mocked(userService.deductCoins)).toHaveBeenCalledWith('123', 5, 'dice_game_stake');
    });

    it('should add coins when player wins', async () => {
      // Mock a winning scenario by controlling Math.random
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0); // This will make diceResult = 1
      
      vi.mocked(gameService.getGame).mockResolvedValue({
        id: 'test_game_123',
        status: GameStatus.PLAYING,
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        currentPlayerIndex: 0,
        type: GameType.DICE,
        data: {},
      });

      await handleDiceTurn('test_game_123', 1); // Guess 1 to match the mocked random result
      
      expect(vi.mocked(userService.addCoins)).toHaveBeenCalled();
      
      // Restore Math.random
      Math.random = originalRandom;
    });
  });
}); 