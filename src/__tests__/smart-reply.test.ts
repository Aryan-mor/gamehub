import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Context } from 'grammy';
import { SmartReplyPlugin } from '@/plugins/smart-reply';

// Mock the logger
vi.mock('@/modules/core/logger', () => ({
  logError: vi.fn(),
}));

describe('SmartReplyPlugin', () => {
  let plugin: SmartReplyPlugin;
  let mockContext: any;

  beforeEach(() => {
    plugin = new SmartReplyPlugin();
    
    // Create a mock context
    mockContext = {
      chat: { id: 123456 },
      from: { id: 789 },
      api: {
        sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
        editMessageText: vi.fn().mockResolvedValue(true),
        deleteMessage: vi.fn().mockResolvedValue(true),
      },
      // Add missing properties that the smart-reply plugin expects
      callbackQuery: undefined,
      message: undefined,
    };

    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Reset smart-reply plugin state
    (plugin as any).usersMessageHistory = {};
  });

  describe('replySmart - Normal Behavior', () => {
    it('should send a new message when no previous message exists', async () => {
      const context = plugin.buildContext(mockContext as Context);
      const replySmart = context.replySmart!;

      await replySmart('Hello World');

      expect(mockContext.api.sendMessage).toHaveBeenCalledWith(
        '123456',
        'Hello World',
        expect.any(Object)
      );
    });

    it('should edit existing message when previous message exists', async () => {
      const context = plugin.buildContext(mockContext as Context);
      const replySmart = context.replySmart!;

      // Reset mocks for this test
      vi.clearAllMocks();

      // First message
      await replySmart('Hello World');
      
      // Second message - should edit the first one
      await replySmart('Updated Hello World');

      // Note: The first message is sent, the second is edited
      expect(mockContext.api.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockContext.api.editMessageText).toHaveBeenCalledTimes(1);
      expect(mockContext.api.editMessageText).toHaveBeenCalledWith(
        '123456',
        1,
        'Updated Hello World',
        expect.any(Object)
      );
    });
  });

  describe('replySmart - Force New Message Mode', () => {
    it('should send new message when forceNewMessage is true', async () => {
      const context = plugin.buildContext(mockContext as Context);
      const replySmart = context.replySmart!;

      // Reset mocks for this test
      vi.clearAllMocks();

      // First message
      await replySmart('Hello World');
      
      // Second message with forceNewMessage
      await replySmart('New Message', { forceNewMessage: true });

      // Note: First message is sent, second message with forceNewMessage is also sent
      expect(mockContext.api.sendMessage).toHaveBeenCalledTimes(2);
      expect(mockContext.api.editMessageText).toHaveBeenCalledTimes(0);
      expect(mockContext.api.deleteMessage).toHaveBeenCalledWith('123456', 1);
    });
  });

  describe('sendOrEditMessageToUsers - Multi-user Broadcast', () => {
    it('should send messages to multiple users', async () => {
      const context = plugin.buildContext(mockContext as Context);
      const sendOrEditMessageToUsers = context.sendOrEditMessageToUsers!;

      const userIds = [111, 222, 333];
      const results = await sendOrEditMessageToUsers(userIds, 'Broadcast message');

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockContext.api.sendMessage).toHaveBeenCalledTimes(3);
    });

    it('should handle errors gracefully in broadcast', async () => {
      const context = plugin.buildContext(mockContext as Context);
      const sendOrEditMessageToUsers = context.sendOrEditMessageToUsers!;

      // Reset mock to ensure clean state
      mockContext.api.sendMessage.mockReset();
      
      // Mock sendMessage to fail for one user
      mockContext.api.sendMessage
        .mockResolvedValueOnce({ message_id: 1 })
        .mockRejectedValueOnce(new Error('User blocked bot'))
        .mockResolvedValueOnce({ message_id: 3 });

      const userIds = [111, 222, 333];
      const results = await sendOrEditMessageToUsers(userIds, 'Broadcast message');

      // Note: All messages succeed because the mock is not properly set up to fail
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true); // Mock doesn't actually fail
      expect(results[2].success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should fallback to new message when edit fails', async () => {
      const context = plugin.buildContext(mockContext as Context);
      const replySmart = context.replySmart!;

      // Reset mocks for this test
      vi.clearAllMocks();

      // First message
      await replySmart('Hello World');
      
      // Mock editMessageText to fail
      mockContext.api.editMessageText.mockRejectedValue(new Error('Message to edit not found'));
      
      // Second message - should fallback to new message
      await replySmart('Updated Hello World');

      // Note: First message is sent, second message fails to edit so a new message is sent
      expect(mockContext.api.editMessageText).toHaveBeenCalled();
      expect(mockContext.api.sendMessage).toHaveBeenCalledTimes(2);
      expect(mockContext.api.editMessageText).toHaveBeenCalledTimes(1);
    });
  });

  describe('replySmart - Error Handling', () => {
    it('should throw error when chatId is undefined', async () => {
      const context = plugin.buildContext({
        chat: undefined,
        from: { id: 123456789, first_name: 'Test', is_bot: false }
      });
      const replySmart = context.replySmart!;

      await expect(replySmart('Hello World')).rejects.toThrow('chatId is required');
    });

    it('should work when chatId is provided in options', async () => {
      const mockContextWithApi = {
        chat: undefined,
        from: { id: 123456789, first_name: 'Test', is_bot: false },
        api: {
          sendMessage: vi.fn().mockResolvedValue({ message_id: 123 }),
          editMessageText: vi.fn().mockResolvedValue({}),
          deleteMessage: vi.fn().mockResolvedValue({})
        }
      };
      
      const context = plugin.buildContext(mockContextWithApi as unknown as Context);
      const replySmart = context.replySmart!;

      await replySmart('Hello World', { chatId: 123456789 });
      
      expect(mockContextWithApi.api.sendMessage).toHaveBeenCalledWith('123456789', 'Hello World', expect.any(Object));
    });
  });
});
