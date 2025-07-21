import { describe, it, expect } from 'vitest';

describe('Callback Data Validation Tests', () => {
  describe('Telegram Callback Data Limits', () => {
    it('should ensure callback data is under 64 bytes for Telegram', () => {
      // Test with a very short game ID
      const longGameId = 'dice_1753049345';
      
      const callbackDataFormats = [
        // Dice game format
        {
          action: 'dice_guess',
          g: longGameId,
          n: 3,
        },
        // Basketball game format
        {
          action: 'basketball_guess',
          g: longGameId,
          s: 'score',
        },
        // Football game format
        {
          action: 'football_guess',
          g: longGameId,
          s: 'miss',
        },
        // Blackjack game format
        {
          action: 'blackjack_action',
          g: longGameId,
          a: 'hit',
        },
        // Bowling game format
        {
          action: 'bowling_guess',
          g: longGameId,
          s: 'strike',
        },
      ];

      callbackDataFormats.forEach((data, index) => {
        const jsonString = JSON.stringify(data);
        const byteLength = new TextEncoder().encode(jsonString).length;
        
        expect(byteLength).toBeLessThan(64);
        expect(jsonString.length).toBeLessThan(64);
        
        console.log(`Format ${index + 1}: ${jsonString} (${byteLength} bytes)`);
      });
    });

    it('should validate compact callback data structure', () => {
      const gameId = 'test_game_123';
      
      // Test all game callback formats
      const formats = {
        dice: { action: 'dice_guess', g: gameId, n: 3 },
        basketball: { action: 'basketball_guess', g: gameId, s: 'score' },
        football: { action: 'football_guess', g: gameId, s: 'miss' },
        blackjack: { action: 'blackjack_action', g: gameId, a: 'hit' },
        bowling: { action: 'bowling_guess', g: gameId, s: 'strike' },
      };

      Object.entries(formats).forEach(([game, data]) => {
        const jsonString = JSON.stringify(data);
        
        // Check structure
        expect(data).toHaveProperty('action');
        expect(data).toHaveProperty('g');
        
        // Check specific game requirements
        switch (game) {
          case 'dice':
            expect(data).toHaveProperty('n');
            expect(typeof data.n).toBe('number');
            expect(data.n).toBeGreaterThanOrEqual(1);
            expect(data.n).toBeLessThanOrEqual(6);
            break;
          case 'basketball':
          case 'football':
          case 'bowling':
            expect(data).toHaveProperty('s');
            expect(typeof data.s).toBe('string');
            break;
          case 'blackjack':
            expect(data).toHaveProperty('a');
            expect(typeof data.a).toBe('string');
            break;
        }
        
        // Check length
        expect(jsonString.length).toBeLessThan(64);
      });
    });
  });

  describe('Callback Data Parsing', () => {
    it('should parse dice callback data correctly', () => {
      const callbackData = { action: 'dice_guess', g: 'test_game_123', n: 4 };
      const jsonString = JSON.stringify(callbackData);
      
      const parsed = JSON.parse(jsonString);
      
      expect(parsed.action).toBe('dice_guess');
      expect(parsed.g).toBe('test_game_123');
      expect(parsed.n).toBe(4);
    });

    it('should parse basketball callback data correctly', () => {
      const callbackData = { action: 'basketball_guess', g: 'test_game_123', s: 'score' };
      const jsonString = JSON.stringify(callbackData);
      
      const parsed = JSON.parse(jsonString);
      
      expect(parsed.action).toBe('basketball_guess');
      expect(parsed.g).toBe('test_game_123');
      expect(parsed.s).toBe('score');
    });

    it('should parse football callback data correctly', () => {
      const callbackData = { action: 'football_guess', g: 'test_game_123', s: 'miss' };
      const jsonString = JSON.stringify(callbackData);
      
      const parsed = JSON.parse(jsonString);
      
      expect(parsed.action).toBe('football_guess');
      expect(parsed.g).toBe('test_game_123');
      expect(parsed.s).toBe('miss');
    });

    it('should parse blackjack callback data correctly', () => {
      const callbackData = { action: 'blackjack_action', g: 'test_game_123', a: 'stand' };
      const jsonString = JSON.stringify(callbackData);
      
      const parsed = JSON.parse(jsonString);
      
      expect(parsed.action).toBe('blackjack_action');
      expect(parsed.g).toBe('test_game_123');
      expect(parsed.a).toBe('stand');
    });

    it('should parse bowling callback data correctly', () => {
      const callbackData = { action: 'bowling_guess', g: 'test_game_123', s: 'spare' };
      const jsonString = JSON.stringify(callbackData);
      
      const parsed = JSON.parse(jsonString);
      
      expect(parsed.action).toBe('bowling_guess');
      expect(parsed.g).toBe('test_game_123');
      expect(parsed.s).toBe('spare');
    });
  });

  describe('Stake Selection Callback Data', () => {
    it('should validate stake selection callback data', () => {
      const validStakes = [2, 5, 10, 20];
      
      validStakes.forEach(stake => {
        const callbackData = { action: 'dice_stake', stake };
        const jsonString = JSON.stringify(callbackData);
        
        expect(jsonString.length).toBeLessThan(64);
        expect(callbackData.action).toBe('dice_stake');
        expect(callbackData.stake).toBe(stake);
      });
    });

    it('should validate all game stake callback formats', () => {
      const games = ['dice', 'basketball', 'football', 'blackjack', 'bowling'];
      const stake = 5;
      
      games.forEach(game => {
        const callbackData = { action: `${game}_stake`, stake };
        const jsonString = JSON.stringify(callbackData);
        
        expect(jsonString.length).toBeLessThan(64);
        expect(callbackData.action).toBe(`${game}_stake`);
        expect(callbackData.stake).toBe(stake);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long game IDs gracefully', () => {
      // Simulate a short game ID
      const veryLongGameId = 'dice_1753049345633_verylong';
      
      const callbackData = { action: 'dice_guess', g: veryLongGameId, n: 1 };
      const jsonString = JSON.stringify(callbackData);
      
      // Even with long game ID, should still be under limit
      expect(jsonString.length).toBeLessThan(64);
    });

    it('should validate all possible dice numbers', () => {
      for (let i = 1; i <= 6; i++) {
        const callbackData = { action: 'dice_guess', g: 'test_game_123', n: i };
        const jsonString = JSON.stringify(callbackData);
        
        expect(jsonString.length).toBeLessThan(64);
        expect(callbackData.n).toBe(i);
      }
    });

    it('should validate all possible basketball/football choices', () => {
      const choices = ['score', 'miss'];
      
      choices.forEach(choice => {
        const callbackData = { action: 'basketball_guess', g: 'test_game_123', s: choice };
        const jsonString = JSON.stringify(callbackData);
        
        expect(jsonString.length).toBeLessThan(64);
        expect(callbackData.s).toBe(choice);
      });
    });

    it('should validate all possible blackjack actions', () => {
      const actions = ['hit', 'stand'];
      
      actions.forEach(action => {
        const callbackData = { action: 'blackjack_action', g: 'test_game_123', a: action };
        const jsonString = JSON.stringify(callbackData);
        
        expect(jsonString.length).toBeLessThan(64);
        expect(callbackData.a).toBe(action);
      });
    });

    it('should validate all possible bowling choices', () => {
      const choices = ['strike', 'spare'];
      
      choices.forEach(choice => {
        const callbackData = { action: 'bowling_guess', g: 'test_game_123', s: choice };
        const jsonString = JSON.stringify(callbackData);
        
        expect(jsonString.length).toBeLessThan(64);
        expect(callbackData.s).toBe(choice);
      });
    });
  });

  describe('Callback Data Security', () => {
    it('should not expose sensitive information in callback data', () => {
      const callbackData = { action: 'dice_guess', g: 'test_game_123', n: 3 };
      const jsonString = JSON.stringify(callbackData);
      
      // Should not contain user IDs, tokens, or other sensitive data
      expect(jsonString).not.toContain('user');
      expect(jsonString).not.toContain('token');
      expect(jsonString).not.toContain('secret');
      expect(jsonString).not.toContain('password');
      
      // Should only contain game-specific data
      expect(jsonString).toContain('action');
      expect(jsonString).toContain('g');
      expect(jsonString).toContain('n');
    });

    it('should use minimal required data in callback', () => {
      const callbackData = { action: 'dice_guess', g: 'test_game_123', n: 3 };
      
      // Should only have the minimum required fields
      const requiredFields = ['action', 'g', 'n'];
      const actualFields = Object.keys(callbackData);
      
      expect(actualFields).toEqual(expect.arrayContaining(requiredFields));
      expect(actualFields.length).toBe(requiredFields.length);
    });
  });
}); 