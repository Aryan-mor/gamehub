import { describe, it, expect, beforeEach } from 'vitest';
import { Context } from 'grammy';
import { HandlerContext } from '../src/modules/core/handler';
import { GameHubContext } from '../src/plugins';

describe('Handlers', () => {
  let mockContext: GameHubContext;

  beforeEach(() => {
    // Create a mock GameHubContext
    mockContext = {
      chat: { id: 123 },
      from: { id: 456, username: 'testuser', language_code: 'en' },
      message: { message_id: 789 },
      replySmart: vi.fn().mockResolvedValue(undefined),
      t: vi.fn().mockImplementation((key: string) => key),
      log: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      },
      user: {
        id: '456',
        username: 'testuser',
        languageCode: 'en',
        isNewUser: false
      }
    } as GameHubContext;
  });

  it('should create HandlerContext correctly', () => {
    const handlerContext: HandlerContext = {
      ctx: mockContext,
      user: {
        id: '456' as any,
        username: 'testuser'
      }
    };

    expect(handlerContext.ctx).toBe(mockContext);
    expect(handlerContext.user.id).toBe('456');
    expect(handlerContext.user.username).toBe('testuser');
  });

  it('should have access to all plugin features in HandlerContext', () => {
    const handlerContext: HandlerContext = {
      ctx: mockContext,
      user: {
        id: '456' as any,
        username: 'testuser'
      }
    };

    // Test that all plugin features are available
    expect(handlerContext.ctx.replySmart).toBeDefined();
    expect(handlerContext.ctx.t).toBeDefined();
    expect(handlerContext.ctx.log).toBeDefined();
    expect(handlerContext.ctx.user).toBeDefined();
  });

  it('should handle translation calls correctly', () => {
    const handlerContext: HandlerContext = {
      ctx: mockContext,
      user: {
        id: '456' as any,
        username: 'testuser'
      }
    };

    const result = handlerContext.ctx.t('bot.start.welcome');
    expect(result).toBe('bot.start.welcome');
    expect(mockContext.t).toHaveBeenCalledWith('bot.start.welcome');
  });

  it('should handle logging calls correctly', () => {
    const handlerContext: HandlerContext = {
      ctx: mockContext,
      user: {
        id: '456' as any,
        username: 'testuser'
      }
    };

    handlerContext.ctx.log.info('Test message');
    expect(mockContext.log.info).toHaveBeenCalledWith('Test message');
  });

  it('should handle smart reply calls correctly', () => {
    const handlerContext: HandlerContext = {
      ctx: mockContext,
      user: {
        id: '456' as any,
        username: 'testuser'
      }
    };

    handlerContext.ctx.replySmart('Test message');
    expect(mockContext.replySmart).toHaveBeenCalledWith('Test message');
  });
}); 