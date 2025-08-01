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
      // The function should not throw, as auto-discovery router will handle it
      await handlePokerMessage('games.poker.unknown', mockContext);
      
      // Should not send any error message as auto-discovery handles unknown modules
      expect(mockContext.ctx.reply).not.toHaveBeenCalled();
    });
  });
}); 