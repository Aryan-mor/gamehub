import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handlePokerMessage } from './index';

// Mock the smart router
vi.mock('@/modules/core/smart-router', () => ({
  dispatch: vi.fn(),
}));

describe('Poker Game Routing', () => {
  describe('handlePokerMessage', () => {
    const mockContext = {
      ctx: { reply: vi.fn() },
      user: { id: '123', username: 'testuser' }
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle start action', async () => {
      await handlePokerMessage('games.poker.start', mockContext);
      // Should not throw any errors
      expect(true).toBe(true);
    });

    it('should handle help action', async () => {
      await handlePokerMessage('games.poker.help', mockContext);
      // Should not throw any errors
      expect(true).toBe(true);
    });

    it('should handle unknown module gracefully', async () => {
      // The function should not throw, but should log an error and send a message
      await handlePokerMessage('games.poker.unknown', mockContext);
      
      // Should send error message to user
      expect(mockContext.ctx.reply).toHaveBeenCalledWith(
        'Sorry, there was an error processing your Poker request.'
      );
    });
  });
}); 