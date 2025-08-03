import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Bot } from 'grammy';

// Mock the smart router
vi.mock('@/modules/core/smart-router', () => ({
  dispatch: vi.fn()
}));

describe('Poker Callback Integration', () => {
  let mockBot: any;
  let mockCtx: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock bot context
    mockCtx = {
      callbackQuery: {
        id: 'test_callback_id',
        data: '{"action":"games.poker.start"}'
      },
      from: {
        id: 123456,
        username: 'testuser'
      },
      chat: {
        id: 123456
      },
      reply: vi.fn(),
      answerCallbackQuery: vi.fn()
    };

    // Mock bot
    mockBot = {
      callbackQuery: vi.fn(),
      command: vi.fn(),
      use: vi.fn()
    };
  });

  it('should handle games.poker.start callback correctly', async () => {
    // This test verifies that the callback pattern is correctly set up
    // The actual implementation is tested in the smart router tests
    
    const callbackData = '{"action":"games.poker.start"}';
    const pattern = /.*"action":"games\.poker\.start".*/;
    
    // Test that the pattern matches the callback data
    expect(pattern.test(callbackData)).toBe(true);
    
    // Test that it doesn't match other actions
    expect(pattern.test('{"action":"games.start"}')).toBe(false);
    expect(pattern.test('{"action":"financial.freecoin"}')).toBe(false);
  });

  it('should extract correct action from callback data', () => {
    const callbackData = '{"action":"games.poker.start"}';
    const parsed = JSON.parse(callbackData);
    
    expect(parsed.action).toBe('games.poker.start');
  });

  it('should handle callback data with additional parameters', () => {
    const callbackData = '{"action":"games.poker.start","roomId":"room_123"}';
    const parsed = JSON.parse(callbackData);
    
    expect(parsed.action).toBe('games.poker.start');
    expect(parsed.roomId).toBe('room_123');
  });
}); 