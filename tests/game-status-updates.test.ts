import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStatus } from '../src/core/types';

// Mock the modules
vi.mock('../src/core/logger', () => ({
  logFunctionStart: vi.fn(),
  logFunctionEnd: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('../src/core/gameService', () => ({
  createGame: vi.fn(),
  updateGame: vi.fn(),
  getGame: vi.fn(),
}));

vi.mock('../src/core/userService', () => ({
  getUser: vi.fn(),
  deductCoins: vi.fn(),
}));

describe('Game Status Updates Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Blackjack Game Status Updates', () => {
    it('should set blackjack game status to PLAYING after creation', async () => {
      const { startBlackjackGame } = await import('../src/games/blackjack/startGame');
      const { createGame, updateGame } = await import('../src/core/gameService');
      const { getUser, deductCoins } = await import('../src/core/userService');

      // Mock successful responses
      (getUser as any).mockResolvedValue({
        id: '123',
        name: 'Test User',
        username: 'testuser',
        coins: 1000,
      });
      (deductCoins as any).mockResolvedValue(true);
      (createGame as any).mockResolvedValue({
        id: 'blackjack_1753054184585_46n939wan',
        status: 'waiting',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
      });
      (updateGame as any).mockResolvedValue(undefined);

      const result = await startBlackjackGame('123', 2);

      expect(result.success).toBe(true);
      expect(createGame).toHaveBeenCalled();
      expect(updateGame).toHaveBeenCalledWith(
        'blackjack_1753054184585_46n939wan',
        expect.objectContaining({
          status: GameStatus.PLAYING,
        })
      );
    });

    it('should include blackjack game data when updating status', async () => {
      const { startBlackjackGame } = await import('../src/games/blackjack/startGame');
      const { createGame, updateGame } = await import('../src/core/gameService');
      const { getUser, deductCoins } = await import('../src/core/userService');

      // Mock successful responses
      (getUser as any).mockResolvedValue({
        id: '123',
        name: 'Test User',
        username: 'testuser',
        coins: 1000,
      });
      (deductCoins as any).mockResolvedValue(true);
      (createGame as any).mockResolvedValue({
        id: 'blackjack_1753054184585_46n939wan',
        status: 'waiting',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
      });
      (updateGame as any).mockResolvedValue(undefined);

      await startBlackjackGame('123', 2);

      expect(updateGame).toHaveBeenCalledWith(
        'blackjack_1753054184585_46n939wan',
        expect.objectContaining({
          status: GameStatus.PLAYING,
          data: expect.objectContaining({
            playerHand: expect.any(Array),
            dealerHand: expect.any(Array),
            deck: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('Bowling Game Status Updates', () => {
    it('should set bowling game status to PLAYING after creation', async () => {
      const { startBowlingGame } = await import('../src/games/bowling/startGame');
      const { createGame, updateGame } = await import('../src/core/gameService');
      const { getUser, deductCoins } = await import('../src/core/userService');

      // Mock successful responses
      (getUser as any).mockResolvedValue({
        id: '123',
        name: 'Test User',
        username: 'testuser',
        coins: 1000,
      });
      (deductCoins as any).mockResolvedValue(true);
      (createGame as any).mockResolvedValue({
        id: 'bowling_1753055190328_17ehoplon',
        status: 'waiting',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
      });
      (updateGame as any).mockResolvedValue(undefined);

      const result = await startBowlingGame('123', 2);

      expect(result.success).toBe(true);
      expect(createGame).toHaveBeenCalled();
      expect(updateGame).toHaveBeenCalledWith(
        'bowling_1753055190328_17ehoplon',
        expect.objectContaining({
          status: GameStatus.PLAYING,
        })
      );
    });

    it('should include bowling game data when updating status', async () => {
      const { startBowlingGame } = await import('../src/games/bowling/startGame');
      const { createGame, updateGame } = await import('../src/core/gameService');
      const { getUser, deductCoins } = await import('../src/core/userService');

      // Mock successful responses
      (getUser as any).mockResolvedValue({
        id: '123',
        name: 'Test User',
        username: 'testuser',
        coins: 1000,
      });
      (deductCoins as any).mockResolvedValue(true);
      (createGame as any).mockResolvedValue({
        id: 'bowling_1753055190328_17ehoplon',
        status: 'waiting',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
      });
      (updateGame as any).mockResolvedValue(undefined);

      await startBowlingGame('123', 2);

      expect(updateGame).toHaveBeenCalledWith(
        'bowling_1753055190328_17ehoplon',
        expect.objectContaining({
          status: GameStatus.PLAYING,
          data: expect.objectContaining({
            diceResult: 0,
            isWon: false,
            reward: 0,
            fee: 0,
          }),
        })
      );
    });
  });

  describe('Game Status Transition Validation', () => {
    it('should ensure games start in WAITING status and transition to PLAYING', async () => {
      const { createGame, updateGame } = await import('../src/core/gameService');
      const { startBlackjackGame } = await import('../src/games/blackjack/startGame');
      const { getUser, deductCoins } = await import('../src/core/userService');

      // Mock successful responses
      (getUser as any).mockResolvedValue({
        id: '123',
        name: 'Test User',
        username: 'testuser',
        coins: 1000,
      });
      (deductCoins as any).mockResolvedValue(true);
      (createGame as any).mockResolvedValue({
        id: 'blackjack_1753054184585_46n939wan',
        status: 'waiting', // Initial status
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
      });
      (updateGame as any).mockResolvedValue(undefined);

      await startBlackjackGame('123', 2);

      // Verify the status transition
      const updateCall = (updateGame as any).mock.calls[0];
      expect(updateCall[1]).toHaveProperty('status', GameStatus.PLAYING);
    });

    it('should handle multiple game types with consistent status updates', async () => {
      const { startBlackjackGame } = await import('../src/games/blackjack/startGame');
      const { startBowlingGame } = await import('../src/games/bowling/startGame');
      const { createGame, updateGame } = await import('../src/core/gameService');
      const { getUser, deductCoins } = await import('../src/core/userService');

      // Mock successful responses
      (getUser as any).mockResolvedValue({
        id: '123',
        name: 'Test User',
        username: 'testuser',
        coins: 1000,
      });
      (deductCoins as any).mockResolvedValue(true);
      (createGame as any).mockResolvedValue({
        id: 'test_game_id',
        status: 'waiting',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
      });
      (updateGame as any).mockResolvedValue(undefined);

      // Test blackjack
      await startBlackjackGame('123', 2);
      expect(updateGame).toHaveBeenCalledWith(
        'test_game_id',
        expect.objectContaining({
          status: GameStatus.PLAYING,
        })
      );

      // Reset mocks
      vi.clearAllMocks();
      (getUser as any).mockResolvedValue({
        id: '123',
        name: 'Test User',
        username: 'testuser',
        coins: 1000,
      });
      (deductCoins as any).mockResolvedValue(true);
      (createGame as any).mockResolvedValue({
        id: 'test_game_id',
        status: 'waiting',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
      });
      (updateGame as any).mockResolvedValue(undefined);

      // Test bowling
      await startBowlingGame('123', 2);
      expect(updateGame).toHaveBeenCalledWith(
        'test_game_id',
        expect.objectContaining({
          status: GameStatus.PLAYING,
        })
      );
    });
  });

  describe('Error Handling in Status Updates', () => {
    it('should handle updateGame failure gracefully', async () => {
      const { startBlackjackGame } = await import('../src/games/blackjack/startGame');
      const { createGame, updateGame } = await import('../src/core/gameService');
      const { getUser, deductCoins } = await import('../src/core/userService');

      // Mock successful responses
      (getUser as any).mockResolvedValue({
        id: '123',
        name: 'Test User',
        username: 'testuser',
        coins: 1000,
      });
      (deductCoins as any).mockResolvedValue(true);
      (createGame as any).mockResolvedValue({
        id: 'blackjack_1753054184585_46n939wan',
        status: 'waiting',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
      });
      (updateGame as any).mockRejectedValue(new Error('Database error'));

      const result = await startBlackjackGame('123', 2);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to start blackjack game');
    });

    it('should handle updateGame failure gracefully for bowling', async () => {
      const { startBowlingGame } = await import('../src/games/bowling/startGame');
      const { createGame, updateGame } = await import('../src/core/gameService');
      const { getUser, deductCoins } = await import('../src/core/userService');

      // Mock successful responses
      (getUser as any).mockResolvedValue({
        id: '123',
        name: 'Test User',
        username: 'testuser',
        coins: 1000,
      });
      (deductCoins as any).mockResolvedValue(true);
      (createGame as any).mockResolvedValue({
        id: 'bowling_1753055190328_17ehoplon',
        status: 'waiting',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
      });
      (updateGame as any).mockRejectedValue(new Error('Database error'));

      const result = await startBowlingGame('123', 2);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to start bowling game');
    });
  });

  describe('Game Status Constants', () => {
    it('should use correct GameStatus enum values', () => {
      expect(GameStatus.WAITING).toBe('waiting');
      expect(GameStatus.PLAYING).toBe('playing');
      expect(GameStatus.FINISHED).toBe('finished');
    });

    it('should ensure status updates use the correct enum', async () => {
      const { startBlackjackGame } = await import('../src/games/blackjack/startGame');
      const { createGame, updateGame } = await import('../src/core/gameService');
      const { getUser, deductCoins } = await import('../src/core/userService');

      // Mock successful responses
      (getUser as any).mockResolvedValue({
        id: '123',
        name: 'Test User',
        username: 'testuser',
        coins: 1000,
      });
      (deductCoins as any).mockResolvedValue(true);
      (createGame as any).mockResolvedValue({
        id: 'blackjack_1753054184585_46n939wan',
        status: 'waiting',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
      });
      (updateGame as any).mockResolvedValue(undefined);

      await startBlackjackGame('123', 2);

      const updateCall = (updateGame as any).mock.calls[0];
      expect(updateCall[1].status).toBe(GameStatus.PLAYING);
      expect(updateCall[1].status).toBe('playing');
    });
  });
}); 