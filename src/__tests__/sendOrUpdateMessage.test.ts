import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Context } from 'grammy';
import { 
  sendOrUpdateMessage, 
  sendOrUpdateMessageToUsers,
  createMessageKey,
  createGameMessageKey,
  createRoomMessageKey,
  createUserMessageKey,
  type SendPayload,
  type SendOptions
} from '@/actions/utils/sendOrUpdateMessage';

// Mock the API and logger
vi.mock('@/lib/api', () => ({
  api: {
    messageTracking: {
      getByChatAndKey: vi.fn(),
      upsert: vi.fn(),
      deleteByChatAndKey: vi.fn(),
    },
  },
}));

vi.mock('@/modules/core/logger', () => ({
  logError: vi.fn(),
}));

describe('sendOrUpdateMessage', () => {
  let mockContext: any;
  let mockApi: any;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create mock context
    mockContext = {
      api: {
        sendMessage: vi.fn(),
        editMessageText: vi.fn(),
        deleteMessage: vi.fn(),
      },
    };

    // Get mock API
    mockApi = (await import('@/lib/api')).api;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('should send new message when no stored message exists', async () => {
      const chatId = 123456;
      const payload: SendPayload = { text: 'Hello World' };
      const options: SendOptions = { messageKey: 'test_key' };

      // Mock no stored message
      mockApi.messageTracking.getByChatAndKey.mockResolvedValue(null);
      
      // Mock successful message send
      mockContext.api.sendMessage.mockResolvedValue({ message_id: 789 });
      mockApi.messageTracking.upsert.mockResolvedValue(undefined);

      const result = await sendOrUpdateMessage(mockContext as Context, chatId, payload, options);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe(789);
      expect(mockContext.api.sendMessage).toHaveBeenCalledWith(chatId, payload.text, payload.extra);
      expect(mockApi.messageTracking.upsert).toHaveBeenCalledWith({
        chat_id: chatId,
        message_key: 'test_key',
        message_id: 789,
      });
    });

    it('should edit existing message when stored message exists', async () => {
      const chatId = 123456;
      const payload: SendPayload = { text: 'Updated Hello World' };
      const options: SendOptions = { messageKey: 'test_key' };

      // Mock stored message
      mockApi.messageTracking.getByChatAndKey.mockResolvedValue({
        message_id: 789,
        chat_id: chatId,
        message_key: 'test_key',
      });
      
      // Mock successful edit
      mockContext.api.editMessageText.mockResolvedValue(true);

      const result = await sendOrUpdateMessage(mockContext as Context, chatId, payload, options);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe(789);
      expect(mockContext.api.editMessageText).toHaveBeenCalledWith(
        chatId, 
        789, 
        payload.text, 
        expect.objectContaining({
          reply_markup: undefined,
        })
      );
      expect(mockContext.api.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Force new message mode', () => {
    it('should delete old message and send new one when forceNew is true', async () => {
      const chatId = 123456;
      const payload: SendPayload = { text: 'New Message' };
      const options: SendOptions = { messageKey: 'test_key', forceNew: true };

      // Mock stored message
      mockApi.messageTracking.getByChatAndKey.mockResolvedValue({
        message_id: 789,
        chat_id: chatId,
        message_key: 'test_key',
      });
      
      // Mock successful operations
      mockContext.api.deleteMessage.mockResolvedValue(true);
      mockContext.api.sendMessage.mockResolvedValue({ message_id: 999 });
      mockApi.messageTracking.deleteByChatAndKey.mockResolvedValue(undefined);
      mockApi.messageTracking.upsert.mockResolvedValue(undefined);

      const result = await sendOrUpdateMessage(mockContext as Context, chatId, payload, options);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe(999);
      expect(mockContext.api.deleteMessage).toHaveBeenCalledWith(chatId, 789);
      expect(mockContext.api.sendMessage).toHaveBeenCalledWith(chatId, payload.text, payload.extra);
      expect(mockApi.messageTracking.deleteByChatAndKey).toHaveBeenCalledWith(chatId, 'test_key');
      expect(mockApi.messageTracking.upsert).toHaveBeenCalledWith({
        chat_id: chatId,
        message_key: 'test_key',
        message_id: 999,
      });
    });

    it('should send new message when forceNew is true but no stored message exists', async () => {
      const chatId = 123456;
      const payload: SendPayload = { text: 'New Message' };
      const options: SendOptions = { messageKey: 'test_key', forceNew: true };

      // Mock no stored message
      mockApi.messageTracking.getByChatAndKey.mockResolvedValue(null);
      
      // Mock successful message send
      mockContext.api.sendMessage.mockResolvedValue({ message_id: 999 });
      mockApi.messageTracking.upsert.mockResolvedValue(undefined);

      const result = await sendOrUpdateMessage(mockContext as Context, chatId, payload, options);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe(999);
      expect(mockContext.api.deleteMessage).not.toHaveBeenCalled();
      expect(mockContext.api.sendMessage).toHaveBeenCalledWith(chatId, payload.text, payload.extra);
    });
  });

  describe('Error handling', () => {
    it('should fallback to new message when edit fails', async () => {
      const chatId = 123456;
      const payload: SendPayload = { text: 'Updated Message' };
      const options: SendOptions = { messageKey: 'test_key' };

      // Mock stored message
      mockApi.messageTracking.getByChatAndKey.mockResolvedValue({
        message_id: 789,
        chat_id: chatId,
        message_key: 'test_key',
      });
      
      // Mock edit failure
      mockContext.api.editMessageText.mockRejectedValue(new Error('Message to edit not found'));
      
      // Mock successful new message send
      mockContext.api.sendMessage.mockResolvedValue({ message_id: 999 });
      mockApi.messageTracking.deleteByChatAndKey.mockResolvedValue(undefined);
      mockApi.messageTracking.upsert.mockResolvedValue(undefined);

      const result = await sendOrUpdateMessage(mockContext as Context, chatId, payload, options);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe(999);
      expect(mockContext.api.editMessageText).toHaveBeenCalled();
      expect(mockContext.api.sendMessage).toHaveBeenCalled();
      expect(mockApi.messageTracking.deleteByChatAndKey).toHaveBeenCalledWith(chatId, 'test_key');
    });

    it('should handle database errors gracefully', async () => {
      const chatId = 123456;
      const payload: SendPayload = { text: 'Hello World' };
      const options: SendOptions = { messageKey: 'test_key' };

      // Mock database error
      mockApi.messageTracking.getByChatAndKey.mockRejectedValue(new Error('Database connection failed'));
      
      // Mock successful message send
      mockContext.api.sendMessage.mockResolvedValue({ message_id: 789 });

      const result = await sendOrUpdateMessage(mockContext as Context, chatId, payload, options);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe(789);
      expect(mockContext.api.sendMessage).toHaveBeenCalled();
    });
  });

  describe('Message key utilities', () => {
    it('should create message keys correctly', () => {
      expect(createMessageKey('test', '123')).toBe('test_123');
      expect(createGameMessageKey('game123', 'status')).toBe('game_game123_status');
      expect(createRoomMessageKey('room456', 'players')).toBe('room_room456_players');
      expect(createUserMessageKey(789, 'notification')).toBe('user_789_notification');
    });
  });
});

describe('sendOrUpdateMessageToUsers', () => {
  let mockContext: any;
  let mockApi: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    mockContext = {
      api: {
        sendMessage: vi.fn(),
        editMessageText: vi.fn(),
        deleteMessage: vi.fn(),
      },
    };

    mockApi = (await import('@/lib/api')).api;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should send messages to multiple users successfully', async () => {
    const users = [111, 222, 333];
    const payload: SendPayload = { text: 'Broadcast message' };
    const options: SendOptions = { messageKey: 'broadcast_key' };

    // Mock no stored messages for any user
    mockApi.messageTracking.getByChatAndKey.mockResolvedValue(null);
    
    // Mock successful message sends
    mockContext.api.sendMessage
      .mockResolvedValueOnce({ message_id: 1 })
      .mockResolvedValueOnce({ message_id: 2 })
      .mockResolvedValueOnce({ message_id: 3 });
    
    mockApi.messageTracking.upsert.mockResolvedValue(undefined);

    const results = await sendOrUpdateMessageToUsers(mockContext as Context, users, payload, options);

    expect(results).toHaveLength(3);
    expect(results.every(r => r.success)).toBe(true);
    expect(results[0].messageId).toBe(1);
    expect(results[1].messageId).toBe(2);
    expect(results[2].messageId).toBe(3);
    expect(mockContext.api.sendMessage).toHaveBeenCalledTimes(3);
  });

  it('should handle individual user failures gracefully', async () => {
    const users = [111, 222, 333];
    const payload: SendPayload = { text: 'Broadcast message' };
    const options: SendOptions = { messageKey: 'broadcast_key' };

    // Mock no stored messages
    mockApi.messageTracking.getByChatAndKey.mockResolvedValue(null);
    
    // Mock mixed results: success, failure, success
    mockContext.api.sendMessage
      .mockResolvedValueOnce({ message_id: 1 })
      .mockRejectedValueOnce(new Error('User blocked bot'))
      .mockResolvedValueOnce({ message_id: 3 });
    
    mockApi.messageTracking.upsert.mockResolvedValue(undefined);

    const results = await sendOrUpdateMessageToUsers(mockContext as Context, users, payload, options);

    expect(results).toHaveLength(3);
    expect(results[0].success).toBe(true);
    expect(results[0].messageId).toBe(1);
    expect(results[1].success).toBe(false);
    expect(results[1].error).toBe('User blocked bot');
    expect(results[2].success).toBe(true);
    expect(results[2].messageId).toBe(3);
  });

  it('should use default message key when options not provided', async () => {
    const users = [111];
    const payload: SendPayload = { text: 'Test message' };

    // Mock no stored message
    mockApi.messageTracking.getByChatAndKey.mockResolvedValue(null);
    mockContext.api.sendMessage.mockResolvedValue({ message_id: 1 });
    mockApi.messageTracking.upsert.mockResolvedValue(undefined);

    const results = await sendOrUpdateMessageToUsers(mockContext as Context, users, payload);

    expect(results[0].success).toBe(true);
    expect(mockApi.messageTracking.upsert).toHaveBeenCalledWith({
      chat_id: 111,
      message_key: expect.stringMatching(/^broadcast_\d+$/),
      message_id: 1,
    });
  });
});
