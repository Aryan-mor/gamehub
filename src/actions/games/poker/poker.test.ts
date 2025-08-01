import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handlePokerMessage } from './index';

// Mock the room module
vi.mock('./room', () => ({
  handleRoomMessage: vi.fn()
}));

describe('Poker Game Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handlePokerMessage', () => {
    it('should handle room actions', async () => {
      const context = {
        ctx: { reply: vi.fn() },
        user: { id: '123' }
      };

      await handlePokerMessage('games.poker.room.call?roomId=abc', context);
      
      // Should route to room handler
      const { handleRoomMessage } = await import('./room');
      expect(handleRoomMessage).toHaveBeenCalledWith('games.poker.room.call?roomId=abc', context);
    });

    it('should handle start action', async () => {
      const context = {
        ctx: { reply: vi.fn() },
        user: { id: '123' }
      };

      await handlePokerMessage('games.poker.start', context);
      
      // Should show poker start message
      expect(context.ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Welcome to Texas Hold\'em Poker'),
        expect.any(Object)
      );
    });

    it('should handle help action', async () => {
      const context = {
        ctx: { reply: vi.fn() },
        user: { id: '123' }
      };

      await handlePokerMessage('games.poker.help', context);
      
      // Should show poker help message
      expect(context.ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Texas Hold\'em Rules'),
        expect.any(Object)
      );
    });

    it('should handle unknown module gracefully', async () => {
      const context = {
        ctx: { reply: vi.fn() },
        user: { id: '123' }
      };

      await handlePokerMessage('games.poker.unknown.action', context);
      
      // Should show error message for unknown module
      expect(context.ctx.reply).toHaveBeenCalledWith('Sorry, there was an error processing your Poker request.');
    });
  });
}); 