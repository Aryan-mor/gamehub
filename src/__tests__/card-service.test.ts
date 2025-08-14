import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendCardImagesToUser } from '@/actions/games/poker/room/services/cardService';

// Mock the GameHubContext
const mockContext = {
  replySmart: vi.fn().mockResolvedValue(true),
  api: {
    sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
    forwardMessage: vi.fn().mockResolvedValue(true)
  },
  t: vi.fn((key: string) => key),
  log: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
};

describe('CardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendCardImagesToUser', () => {
    it('should handle errors gracefully when getUserCardsAndBoard fails', async () => {
      const result = await sendCardImagesToUser(
        mockContext as any,
        'test-room-id',
        'test-user-id',
        123456789
      );

      expect(result).toBe(false);
    });

    it('should handle errors when replySmart fails', async () => {
      mockContext.replySmart.mockRejectedValueOnce(new Error('Send failed'));

      const result = await sendCardImagesToUser(
        mockContext as any,
        'test-room-id',
        'test-user-id',
        123456789
      );

      expect(result).toBe(false);
    });
  });
});
