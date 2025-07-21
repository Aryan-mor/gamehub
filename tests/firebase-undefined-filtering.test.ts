import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the modules
vi.mock('../src/core/logger', () => ({
  logFunctionStart: vi.fn(),
  logFunctionEnd: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('../src/core/gameService', () => ({
  getGame: vi.fn(),
  updateGame: vi.fn(),
  finishGame: vi.fn(),
}));

vi.mock('../src/core/userService', () => ({
  addCoins: vi.fn(),
}));

describe('Firebase Undefined Value Filtering Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Blackjack HandleTurn Undefined Filtering', () => {
    it('should filter out undefined values before sending to Firebase', async () => {
      const { handleBlackjackTurn } = await import('../src/games/blackjack/handleTurn');
      const { getGame, updateGame } = await import('../src/core/gameService');
      const { addCoins } = await import('../src/core/userService');

      // Mock game data with undefined result (game not finished)
      (getGame as any).mockResolvedValue({
        id: 'blackjack_1753054184585_46n939wan',
        status: 'playing',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        data: {
          playerHand: [{ suit: 'hearts', displayValue: 'A' }],
          dealerHand: [{ suit: 'spades', displayValue: 'K' }],
          deck: [],
        },
      });
      (updateGame as any).mockResolvedValue(undefined);
      (addCoins as any).mockResolvedValue(undefined);

      const result = await handleBlackjackTurn('blackjack_1753054184585_46n939wan', 'hit');

      expect(result.success).toBe(true);
      expect(updateGame).toHaveBeenCalled();

      // Check that the data sent to Firebase doesn't contain undefined values
      const updateCall = (updateGame as any).mock.calls[0];
      const sentData = updateCall[1].data;

      // Verify that all values in the sent data are defined
      Object.values(sentData).forEach(value => {
        expect(value).not.toBeUndefined();
      });

      // Verify the data structure
      expect(sentData).toHaveProperty('playerHand');
      expect(sentData).toHaveProperty('dealerHand');
      expect(sentData).toHaveProperty('deck');
      expect(sentData).toHaveProperty('reward');
      expect(sentData).toHaveProperty('fee');
    });

    it('should include result field when game is finished', async () => {
      const { handleBlackjackTurn } = await import('../src/games/blackjack/handleTurn');
      const { getGame, updateGame } = await import('../src/core/gameService');
      const { addCoins } = await import('../src/core/userService');

      // Mock game data that will result in a finished game (player busts)
      (getGame as any).mockResolvedValue({
        id: 'blackjack_1753054184585_46n939wan',
        status: 'playing',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        data: {
          playerHand: [
            { suit: 'hearts', displayValue: 'K' },
            { suit: 'spades', displayValue: 'Q' },
            { suit: 'diamonds', displayValue: 'J' }, // This will cause bust
          ],
          dealerHand: [{ suit: 'clubs', displayValue: 'A' }],
          deck: [],
        },
      });
      (updateGame as any).mockResolvedValue(undefined);
      (addCoins as any).mockResolvedValue(undefined);

      const result = await handleBlackjackTurn('blackjack_1753054184585_46n939wan', 'hit');

      expect(result.success).toBe(true);
      expect(updateGame).toHaveBeenCalled();

      // Check that the data sent to Firebase includes the result field
      const updateCall = (updateGame as any).mock.calls[0];
      const sentData = updateCall[1].data;

      expect(sentData).toHaveProperty('result');
      expect(sentData.result).toBe('lose'); // Player busted
      expect(sentData).toHaveProperty('reward');
      expect(sentData).toHaveProperty('fee');
    });

    it('should handle game data with all defined values correctly', async () => {
      const { handleBlackjackTurn } = await import('../src/games/blackjack/handleTurn');
      const { getGame, updateGame } = await import('../src/core/gameService');
      const { addCoins } = await import('../src/core/userService');

      // Mock game data with all defined values
      (getGame as any).mockResolvedValue({
        id: 'blackjack_1753054184585_46n939wan',
        status: 'playing',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        data: {
          playerHand: [{ suit: 'hearts', displayValue: 'A' }],
          dealerHand: [{ suit: 'spades', displayValue: 'K' }],
          deck: [],
          result: 'win',
          reward: 4,
          fee: 0,
        },
      });
      (updateGame as any).mockResolvedValue(undefined);
      (addCoins as any).mockResolvedValue(undefined);

      const result = await handleBlackjackTurn('blackjack_1753054184585_46n939wan', 'stand');

      expect(result.success).toBe(true);
      expect(updateGame).toHaveBeenCalled();

      // Check that all values are preserved
      const updateCall = (updateGame as any).mock.calls[0];
      const sentData = updateCall[1].data;

      expect(sentData).toHaveProperty('playerHand');
      expect(sentData).toHaveProperty('dealerHand');
      expect(sentData).toHaveProperty('deck');
      expect(sentData).toHaveProperty('result');
      expect(sentData).toHaveProperty('reward');
      expect(sentData).toHaveProperty('fee');
    });
  });

  describe('Object.fromEntries Filtering Logic', () => {
    it('should correctly filter undefined values using Object.fromEntries', () => {
      const testData = {
        playerHand: [{ suit: 'hearts', displayValue: 'A' }],
        dealerHand: [{ suit: 'spades', displayValue: 'K' }],
        deck: [],
        result: undefined, // This should be filtered out
        reward: 0,
        fee: 0,
        undefinedField: undefined, // This should also be filtered out
      };

      const cleanData = Object.fromEntries(
        Object.entries(testData).filter(([_, value]) => value !== undefined)
      );

      expect(cleanData).toHaveProperty('playerHand');
      expect(cleanData).toHaveProperty('dealerHand');
      expect(cleanData).toHaveProperty('deck');
      expect(cleanData).toHaveProperty('reward');
      expect(cleanData).toHaveProperty('fee');
      expect(cleanData).not.toHaveProperty('result');
      expect(cleanData).not.toHaveProperty('undefinedField');
    });

    it('should handle null values correctly (not filter them)', () => {
      const testData = {
        playerHand: [{ suit: 'hearts', displayValue: 'A' }],
        dealerHand: null, // This should NOT be filtered out
        deck: [],
        result: undefined, // This should be filtered out
        reward: 0,
      };

      const cleanData = Object.fromEntries(
        Object.entries(testData).filter(([_, value]) => value !== undefined)
      );

      expect(cleanData).toHaveProperty('playerHand');
      expect(cleanData).toHaveProperty('dealerHand');
      expect(cleanData.dealerHand).toBeNull();
      expect(cleanData).toHaveProperty('deck');
      expect(cleanData).toHaveProperty('reward');
      expect(cleanData).not.toHaveProperty('result');
    });

    it('should handle empty arrays and zero values correctly', () => {
      const testData = {
        playerHand: [],
        dealerHand: [],
        deck: [],
        result: undefined,
        reward: 0,
        fee: 0,
        emptyString: '',
        zeroNumber: 0,
      };

      const cleanData = Object.fromEntries(
        Object.entries(testData).filter(([_, value]) => value !== undefined)
      );

      expect(cleanData).toHaveProperty('playerHand');
      expect(cleanData.playerHand).toEqual([]);
      expect(cleanData).toHaveProperty('dealerHand');
      expect(cleanData).toHaveProperty('deck');
      expect(cleanData).toHaveProperty('reward');
      expect(cleanData.reward).toBe(0);
      expect(cleanData).toHaveProperty('fee');
      expect(cleanData.fee).toBe(0);
      expect(cleanData).toHaveProperty('emptyString');
      expect(cleanData.emptyString).toBe('');
      expect(cleanData).toHaveProperty('zeroNumber');
      expect(cleanData.zeroNumber).toBe(0);
      expect(cleanData).not.toHaveProperty('result');
    });
  });

  describe('Firebase Data Validation', () => {
    it('should ensure filtered data is valid for Firebase', async () => {
      const { handleBlackjackTurn } = await import('../src/games/blackjack/handleTurn');
      const { getGame, updateGame } = await import('../src/core/gameService');
      const { addCoins } = await import('../src/core/userService');

      // Mock game data
      (getGame as any).mockResolvedValue({
        id: 'blackjack_1753054184585_46n939wan',
        status: 'playing',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        data: {
          playerHand: [{ suit: 'hearts', displayValue: 'A' }],
          dealerHand: [{ suit: 'spades', displayValue: 'K' }],
          deck: [],
        },
      });
      (updateGame as any).mockResolvedValue(undefined);
      (addCoins as any).mockResolvedValue(undefined);

      const result = await handleBlackjackTurn('blackjack_1753054184585_46n939wan', 'hit');

      expect(result.success).toBe(true);
      expect(updateGame).toHaveBeenCalled();

      // Verify the data structure is valid for Firebase
      const updateCall = (updateGame as any).mock.calls[0];
      const sentData = updateCall[1].data;

      // Check that all values are serializable
      expect(() => JSON.stringify(sentData)).not.toThrow();

      // Check that no undefined values exist
      const checkForUndefined = (obj: any): boolean => {
        for (const key in obj) {
          if (obj[key] === undefined) {
            return true;
          }
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (checkForUndefined(obj[key])) {
              return true;
            }
          }
        }
        return false;
      };

      expect(checkForUndefined(sentData)).toBe(false);
    });

    it('should handle complex nested objects correctly', async () => {
      const { handleBlackjackTurn } = await import('../src/games/blackjack/handleTurn');
      const { getGame, updateGame } = await import('../src/core/gameService');
      const { addCoins } = await import('../src/core/userService');

      // Mock game data with complex nested structure
      (getGame as any).mockResolvedValue({
        id: 'blackjack_1753054184585_46n939wan',
        status: 'playing',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        data: {
          playerHand: [
            { suit: 'hearts', displayValue: 'A', value: 11 },
            { suit: 'spades', displayValue: 'K', value: 10 },
          ],
          dealerHand: [
            { suit: 'diamonds', displayValue: 'Q', value: 10 },
            { suit: 'clubs', displayValue: 'J', value: 10 },
          ],
          deck: [
            { suit: 'hearts', displayValue: '2', value: 2 },
            { suit: 'spades', displayValue: '3', value: 3 },
          ],
          gameState: {
            isPlayerTurn: true,
            canHit: true,
            canStand: true,
            undefinedField: undefined, // This should be filtered out
          },
        },
      });
      (updateGame as any).mockResolvedValue(undefined);
      (addCoins as any).mockResolvedValue(undefined);

      const result = await handleBlackjackTurn('blackjack_1753054184585_46n939wan', 'hit');

      expect(result.success).toBe(true);
      expect(updateGame).toHaveBeenCalled();

      // Verify nested undefined values are handled
      const updateCall = (updateGame as any).mock.calls[0];
      const sentData = updateCall[1].data;

      // The nested undefined should still exist in the gameState object
      // because we're only filtering at the top level
      expect(sentData.gameState).toHaveProperty('undefinedField');
      expect(sentData.gameState.undefinedField).toBeUndefined();
    });
  });

  describe('Error Handling in Data Filtering', () => {
    it('should handle errors during data filtering gracefully', async () => {
      const { handleBlackjackTurn } = await import('../src/games/blackjack/handleTurn');
      const { getGame, updateGame } = await import('../src/core/gameService');
      const { addCoins } = await import('../src/core/userService');

      // Mock game data that might cause issues
      (getGame as any).mockResolvedValue({
        id: 'blackjack_1753054184585_46n939wan',
        status: 'playing',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        data: {
          playerHand: [{ suit: 'hearts', displayValue: 'A' }],
          dealerHand: [{ suit: 'spades', displayValue: 'K' }],
          deck: [],
        },
      });
      (updateGame as any).mockRejectedValue(new Error('Firebase error'));
      (addCoins as any).mockResolvedValue(undefined);

      const result = await handleBlackjackTurn('blackjack_1753054184585_46n939wan', 'hit');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to process blackjack turn');
    });

    it('should handle malformed game data gracefully', async () => {
      const { handleBlackjackTurn } = await import('../src/games/blackjack/handleTurn');
      const { getGame, updateGame } = await import('../src/core/gameService');
      const { addCoins } = await import('../src/core/userService');

      // Mock malformed game data
      (getGame as any).mockResolvedValue({
        id: 'blackjack_1753054184585_46n939wan',
        status: 'playing',
        players: [{ id: '123', name: 'Test User', username: 'testuser', coins: 998 }],
        stake: 2,
        data: null, // Malformed data
      });
      (updateGame as any).mockResolvedValue(undefined);
      (addCoins as any).mockResolvedValue(undefined);

      const result = await handleBlackjackTurn('blackjack_1753054184585_46n939wan', 'hit');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to process blackjack turn');
    });
  });
}); 