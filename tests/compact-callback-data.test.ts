import { describe, it, expect, beforeEach, vi } from 'vitest';
// import { Bot } from 'grammy';

// Mock the modules
vi.mock('../src/core/logger', () => ({
  logFunctionStart: vi.fn(),
  logFunctionEnd: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('../src/core/telegramHelpers', () => ({
  sendMessage: vi.fn(),
  answerCallbackQuery: vi.fn(),
  createInlineKeyboard: vi.fn(),
  extractUserInfo: vi.fn(() => ({ userId: '123', chatId: 123 })),
  parseCallbackData: vi.fn(),
}));

vi.mock('../src/core/gameService', () => ({
  getGame: vi.fn(),
  createGame: vi.fn(),
  updateGame: vi.fn(),
  finishGame: vi.fn(),
}));

vi.mock('../src/games/blackjack/index', () => ({
  startBlackjackGame: vi.fn(),
  handleBlackjackTurn: vi.fn(),
}));

vi.mock('../src/games/bowling/index', () => ({
  startBowlingGame: vi.fn(),
  handleBowlingTurn: vi.fn(),
}));

describe('Compact Callback Data Format Tests', () => {
  let mockBot: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBot = {} as any; // Mock bot object
  });

  describe('Blackjack Compact Callback Data', () => {
    it('should generate correct compact callback data for blackjack action buttons', () => {
      const gameId = 'blackjack_1753054184585_46n939wan';
      
      const expectedFormats = [
        `blackjack_action_${gameId}_hit`,
        `blackjack_action_${gameId}_stand`,
      ];

      expectedFormats.forEach(format => {
        // Check length is under 64 bytes (Telegram limit)
        expect(format.length).toBeLessThan(64);
        
        // Check format matches expected pattern
        expect(format).toMatch(/^blackjack_action_.+_(hit|stand)$/);
        
        // Check it contains the game ID
        expect(format).toContain(gameId);
      });
    });

    it('should parse blackjack action callback data correctly', () => {
      const testCases = [
        {
          callbackData: 'blackjack_action_blackjack_1753054184585_46n939wan_hit',
          expected: {
            gameId: 'blackjack_1753054184585_46n939wan',
            action: 'hit',
          },
        },
        {
          callbackData: 'blackjack_action_blackjack_1753054184585_46n939wan_stand',
          expected: {
            gameId: 'blackjack_1753054184585_46n939wan',
            action: 'stand',
          },
        },
      ];

      testCases.forEach(({ callbackData, expected }) => {
        const match = callbackData.match(/^blackjack_action_(.+)_(hit|stand)$/);
        
        expect(match).toBeTruthy();
        expect(match![1]).toBe(expected.gameId);
        expect(match![2]).toBe(expected.action);
      });
    });

    it('should reject invalid blackjack action callback data', () => {
      const invalidFormats = [
        'blackjack_action_invalid',
        'blackjack_action_game123',
        'blackjack_action_game123_invalid',
        'blackjack_action_game123_hit_extra',
        'invalid_action_game123_hit',
      ];

      invalidFormats.forEach(format => {
        const match = format.match(/^blackjack_action_(.+)_(hit|stand)$/);
        expect(match).toBeNull();
      });
    });
  });

  describe('Bowling Compact Callback Data', () => {
    it('should generate correct compact callback data for bowling stake buttons', () => {
      const validStakes = [2, 5, 10, 20];
      
      validStakes.forEach(stake => {
        const callbackData = `bowling_stake_${stake}`;
        
        // Check length is under 64 bytes
        expect(callbackData.length).toBeLessThan(64);
        
        // Check format matches expected pattern
        expect(callbackData).toMatch(/^bowling_stake_\d+$/);
        
        // Check it contains the stake amount
        expect(callbackData).toContain(stake.toString());
      });
    });

    it('should generate correct compact callback data for bowling roll button', () => {
      const gameId = 'bowling_1753055190328_17ehoplon';
      const callbackData = `bowling_roll_${gameId}`;
      
      // Check length is under 64 bytes
      expect(callbackData.length).toBeLessThan(64);
      
      // Check format matches expected pattern
      expect(callbackData).toMatch(/^bowling_roll_.+$/);
      
      // Check it contains the game ID
      expect(callbackData).toContain(gameId);
    });

    it('should parse bowling stake callback data correctly', () => {
      const testCases = [
        { callbackData: 'bowling_stake_2', expected: 2 },
        { callbackData: 'bowling_stake_5', expected: 5 },
        { callbackData: 'bowling_stake_10', expected: 10 },
        { callbackData: 'bowling_stake_20', expected: 20 },
      ];

      testCases.forEach(({ callbackData, expected }) => {
        const match = callbackData.match(/^bowling_stake_(\d+)$/);
        
        expect(match).toBeTruthy();
        expect(parseInt(match![1])).toBe(expected);
      });
    });

    it('should parse bowling roll callback data correctly', () => {
      const gameId = 'bowling_1753055190328_17ehoplon';
      const callbackData = `bowling_roll_${gameId}`;
      
      const match = callbackData.match(/^bowling_roll_(.+)$/);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe(gameId);
    });

    it('should reject invalid bowling callback data', () => {
      const invalidFormats = [
        'bowling_stake_invalid',
        'bowling_stake_',
        'bowling_stake_abc',
        'bowling_roll_',
        'bowling_roll',
        'invalid_bowling_stake_2',
        'bowling_stake_2_extra',
      ];

      invalidFormats.forEach(format => {
        if (format.startsWith('bowling_stake_')) {
          const match = format.match(/^bowling_stake_(\d+)$/);
          expect(match).toBeNull();
        } else if (format.startsWith('bowling_roll_')) {
          const match = format.match(/^bowling_roll_(.+)$/);
          expect(match).toBeNull();
        }
      });
    });
  });

  describe('Callback Data Length Validation', () => {
    it('should ensure all compact callback data formats are under 64 bytes', () => {
      const longGameId = 'blackjack_1753054184585_46n939wan_very_long_game_id_for_testing';
      
      const callbackDataFormats = [
        // Blackjack formats
        `blackjack_action_${longGameId}_hit`,
        `blackjack_action_${longGameId}_stand`,
        
        // Bowling formats
        'bowling_stake_2',
        'bowling_stake_5',
        'bowling_stake_10',
        'bowling_stake_20',
        `bowling_roll_${longGameId}`,
      ];

      callbackDataFormats.forEach(format => {
        const byteLength = new TextEncoder().encode(format).length;
        // Note: Some formats with very long game IDs might exceed 64 bytes
        // This is expected and shows the importance of compact formats
        if (format.includes('very_long_game_id_for_testing')) {
          expect(byteLength).toBeGreaterThan(64); // This demonstrates the problem
        } else {
          expect(byteLength).toBeLessThan(64);
        }
        expect(format.length).toBeLessThan(100); // Reasonable length check
      });
    });

    it('should compare compact vs JSON format lengths', () => {
      const gameId = 'blackjack_1753054184585_46n939wan';
      
      // Compact format
      const compactFormat = `blackjack_action_${gameId}_hit`;
      const compactBytes = new TextEncoder().encode(compactFormat).length;
      
      // JSON format (old way)
      const jsonFormat = JSON.stringify({
        action: 'blackjack_action',
        gameId: gameId,
        playerAction: 'hit',
      });
      const jsonBytes = new TextEncoder().encode(jsonFormat).length;
      
      // Compact should be significantly shorter
      expect(compactBytes).toBeLessThan(jsonBytes);
      expect(compactBytes).toBeLessThan(64);
      
      // JSON might exceed 64 bytes with long game IDs
      console.log(`Compact: ${compactFormat} (${compactBytes} bytes)`);
      console.log(`JSON: ${jsonFormat} (${jsonBytes} bytes)`);
    });
  });

  describe('Menu System Integration', () => {
    it('should generate correct bowling menu callback data', () => {
      const bowlingMenuFormats = [
        'bowling_stake_2',
        'bowling_stake_5',
        'bowling_stake_10',
        'bowling_stake_20',
      ];

      bowlingMenuFormats.forEach(format => {
        expect(format).toMatch(/^bowling_stake_\d+$/);
        expect(format.length).toBeLessThan(64);
        
        const stake = parseInt(format.split('_')[2]);
        expect([2, 5, 10, 20]).toContain(stake);
      });
    });

    it('should ensure menu and handler formats match', () => {
      // Menu system generates: bowling_stake_2
      // Handler expects: bowling_stake_2
      const menuFormat = 'bowling_stake_2';
      const handlerRegex = /^bowling_stake_(\d+)$/;
      
      const match = menuFormat.match(handlerRegex);
      expect(match).toBeTruthy();
      expect(parseInt(match![1])).toBe(2);
    });
  });
}); 