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

describe('CardService Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CARD_IMAGE_CHANNEL_ID = '@test_channel';
  });

  describe('sendCardImagesToUser with card-image-service', () => {
    it('should handle errors gracefully when card-image-service is not available', async () => {
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
