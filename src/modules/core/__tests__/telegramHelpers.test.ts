import { describe, it, expect, vi } from 'vitest';
import { tryEditMessageText, tryEditMessageReplyMarkup } from '../telegramHelpers';

describe('Telegram Helpers', () => {
  describe('tryEditMessageText', () => {
    it('should edit message when editMessageText is available', async () => {
      const mockEditMessageText = vi.fn().mockResolvedValue(true);
      const mockReply = vi.fn();
      
      const ctx = {
        editMessageText: mockEditMessageText,
        reply: mockReply
      };
      
      const text = 'Test message';
      const options = { parse_mode: 'HTML' };
      
      await tryEditMessageText(ctx, text, options);
      
      expect(mockEditMessageText).toHaveBeenCalledWith(text, options);
      expect(mockReply).not.toHaveBeenCalled();
    });

    it('should fallback to reply when editMessageText fails', async () => {
      const mockEditMessageText = vi.fn().mockRejectedValue(new Error('Edit failed'));
      const mockReply = vi.fn().mockResolvedValue({});
      
      const ctx = {
        editMessageText: mockEditMessageText,
        reply: mockReply
      };
      
      const text = 'Test message';
      const options = { parse_mode: 'HTML' };
      
      await tryEditMessageText(ctx, text, options);
      
      expect(mockEditMessageText).toHaveBeenCalledWith(text, options);
      expect(mockReply).toHaveBeenCalledWith(text, options);
    });

    it('should use reply when editMessageText is not available', async () => {
      const mockReply = vi.fn().mockResolvedValue({});
      
      const ctx = {
        reply: mockReply
      };
      
      const text = 'Test message';
      const options = { parse_mode: 'HTML' };
      
      await tryEditMessageText(ctx, text, options);
      
      expect(mockReply).toHaveBeenCalledWith(text, options);
    });

    it('should throw error when neither edit nor reply is available', async () => {
      const ctx = {};
      
      const text = 'Test message';
      const options = { parse_mode: 'HTML' };
      
      await expect(tryEditMessageText(ctx, text, options)).rejects.toThrow(
        'Neither editMessageText nor reply is available'
      );
    });
  });

  describe('tryEditMessageReplyMarkup', () => {
    it('should edit reply markup when editMessageReplyMarkup is available', async () => {
      const mockEditMessageReplyMarkup = vi.fn().mockResolvedValue(true);
      const mockReply = vi.fn();
      
      const ctx = {
        editMessageReplyMarkup: mockEditMessageReplyMarkup,
        reply: mockReply
      };
      
      const replyMarkup = { inline_keyboard: [] };
      
      await tryEditMessageReplyMarkup(ctx, replyMarkup);
      
      expect(mockEditMessageReplyMarkup).toHaveBeenCalledWith(replyMarkup);
      expect(mockReply).not.toHaveBeenCalled();
    });

    it('should fallback to reply when editMessageReplyMarkup fails', async () => {
      const mockEditMessageReplyMarkup = vi.fn().mockRejectedValue(new Error('Edit failed'));
      const mockReply = vi.fn().mockResolvedValue({});
      
      const ctx = {
        editMessageReplyMarkup: mockEditMessageReplyMarkup,
        reply: mockReply
      };
      
      const replyMarkup = { inline_keyboard: [] };
      const fallbackText = 'Fallback text';
      const fallbackOptions = { parse_mode: 'HTML' };
      
      await tryEditMessageReplyMarkup(ctx, replyMarkup, fallbackText, fallbackOptions);
      
      expect(mockEditMessageReplyMarkup).toHaveBeenCalledWith(replyMarkup);
      expect(mockReply).toHaveBeenCalledWith(fallbackText, { ...fallbackOptions, reply_markup: replyMarkup });
    });

    it('should use reply when editMessageReplyMarkup is not available', async () => {
      const mockReply = vi.fn().mockResolvedValue({});
      
      const ctx = {
        reply: mockReply
      };
      
      const replyMarkup = { inline_keyboard: [] };
      const fallbackText = 'Fallback text';
      const fallbackOptions = { parse_mode: 'HTML' };
      
      await tryEditMessageReplyMarkup(ctx, replyMarkup, fallbackText, fallbackOptions);
      
      expect(mockReply).toHaveBeenCalledWith(fallbackText, { ...fallbackOptions, reply_markup: replyMarkup });
    });

    it('should throw error when neither edit nor reply is available', async () => {
      const ctx = {};
      
      const replyMarkup = { inline_keyboard: [] };
      
      await expect(tryEditMessageReplyMarkup(ctx, replyMarkup)).rejects.toThrow(
        'Neither editMessageReplyMarkup nor reply is available'
      );
    });
  });
}); 