import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameType, GameStatus } from '../../../core/types';

// Mock the core services
vi.mock('../../../core/logger', () => ({
  logFunctionStart: vi.fn(() => ({ info: vi.fn() })),
  logFunctionEnd: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('../../../core/userService', () => ({
  getUser: vi.fn(),
  deductCoins: vi.fn(),
  addCoins: vi.fn(),
}));

vi.mock('../../../core/gameService', () => ({
  createGame: vi.fn(),
  getGame: vi.fn(),
  updateGame: vi.fn(),
  finishGame: vi.fn(),
}));

describe('Dice Game', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startDiceGame', () => {
    it('should start a dice game successfully', async () => {
      const mockUser = {
        id: '123',
        coins: 100,
        name: 'Test User',
        username: 'testuser',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const mockGame = {
        id: 'dice_123',
        type: GameType.DICE,
        status: GameStatus.WAITING,
        players: [mockUser],
        currentPlayerIndex: 0,
        stake: 10,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      };

      const { getUser, deductCoins } = await import('../../../core/userService');
      const { createGame, updateGame } = await import('../../../core/gameService');

      vi.mocked(getUser).mockResolvedValue(mockUser);
      vi.mocked(deductCoins).mockResolvedValue(true);
      vi.mocked(createGame).mockResolvedValue(mockGame);
      vi.mocked(updateGame).mockResolvedValue(mockGame);

      const result = await startDiceGame('123', 10);

      expect(result.success).toBe(true);
      expect(result.gameId).toBe('dice_123');
      expect(getUser).toHaveBeenCalledWith('123');
      expect(deductCoins).toHaveBeenCalledWith('123', 10, 'dice_game_stake');
    });

    it('should fail if user has insufficient coins', async () => {
      const mockUser = {
        id: '123',
        coins: 5,
        name: 'Test User',
        username: 'testuser',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const { getUser } = await import('../../../core/userService');
      vi.mocked(getUser).mockResolvedValue(mockUser);

      const result = await startDiceGame('123', 10);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient coins for this stake.');
    });

    it('should fail if stake amount is invalid', async () => {
      const result = await startDiceGame('123', 0);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid stake amount. Must be between 1 and 1000 coins.');
    });
  });

  describe('handleDiceTurn', () => {
    it('should handle a winning dice turn', async () => {
      const mockGame = {
        id: 'dice_123',
        type: GameType.DICE,
        status: GameStatus.PLAYING,
        players: [{ id: '123', name: 'Test User', coins: 90 }],
        currentPlayerIndex: 0,
        stake: 10,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      };

      const { getGame, updateGame, finishGame } = await import('../../../core/gameService');
      const { addCoins } = await import('../../../core/userService');

      vi.mocked(getGame).mockResolvedValue(mockGame);
      vi.mocked(updateGame).mockResolvedValue(mockGame);
      vi.mocked(finishGame).mockResolvedValue();
      vi.mocked(addCoins).mockResolvedValue();

      // Mock Math.random to return a predictable value
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.166); // This will give us 1 when multiplied by 6 and floored

      const result = await handleDiceTurn('dice_123', 1);

      expect(result.success).toBe(true);
      expect(result.result?.isWon).toBe(true);
      expect(result.result?.playerGuess).toBe(1);
      expect(result.result?.diceResult).toBe(1);
      expect(result.result?.coinsWon).toBe(50); // 10 * 5

      Math.random = originalRandom;
    });

    it('should handle a losing dice turn', async () => {
      const mockGame = {
        id: 'dice_123',
        type: GameType.DICE,
        status: GameStatus.PLAYING,
        players: [{ id: '123', name: 'Test User', coins: 90 }],
        currentPlayerIndex: 0,
        stake: 10,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      };

      const { getGame, updateGame, finishGame } = await import('../../../core/gameService');

      vi.mocked(getGame).mockResolvedValue(mockGame);
      vi.mocked(updateGame).mockResolvedValue(mockGame);
      vi.mocked(finishGame).mockResolvedValue();

      // Mock Math.random to return a different value
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.5); // This will give us 4 when multiplied by 6 and floored

      const result = await handleDiceTurn('dice_123', 1);

      expect(result.success).toBe(true);
      expect(result.result?.isWon).toBe(false);
      expect(result.result?.playerGuess).toBe(1);
      expect(result.result?.diceResult).toBe(4);
      expect(result.result?.coinsLost).toBe(10);

      Math.random = originalRandom;
    });

    it('should fail if game is not found', async () => {
      const { getGame } = await import('../../../core/gameService');
      vi.mocked(getGame).mockResolvedValue(null);

      const result = await handleDiceTurn('nonexistent', 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game not found.');
    });
  });

  describe('resolveDiceResult', () => {
    it('should resolve dice result successfully', async () => {
      const mockGame = {
        id: 'dice_123',
        type: GameType.DICE,
        status: GameStatus.FINISHED,
        players: [{ id: '123', name: 'Test User', coins: 90 }],
        currentPlayerIndex: 0,
        stake: 10,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {
          playerGuess: 1,
          diceResult: 1,
          isWon: true,
        },
        result: {
          winner: '123',
          loser: undefined,
          isDraw: false,
          coinsWon: 50,
          coinsLost: 0,
        },
      };

      const { getGame } = await import('../../../core/gameService');
      vi.mocked(getGame).mockResolvedValue(mockGame);

      const result = await resolveDiceResult('dice_123');

      expect(result.success).toBe(true);
      expect(result.result?.isWon).toBe(true);
      expect(result.result?.playerGuess).toBe(1);
      expect(result.result?.diceResult).toBe(1);
      expect(result.result?.coinsWon).toBe(50);
    });

    it('should fail if game is not finished', async () => {
      const mockGame = {
        id: 'dice_123',
        type: GameType.DICE,
        status: GameStatus.PLAYING,
        players: [{ id: '123', name: 'Test User', coins: 90 }],
        currentPlayerIndex: 0,
        stake: 10,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {},
      };

      const { getGame } = await import('../../../core/gameService');
      vi.mocked(getGame).mockResolvedValue(mockGame);

      const result = await resolveDiceResult('dice_123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game is not finished.');
    });
  });
}); 