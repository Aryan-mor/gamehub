import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wrapWithMiddlewares } from '@/modules/core/middleware';
import { isJoined, isTurn, isNotJoined } from '../index';

// Mock the validation functions
vi.mock('../../utils/validateUser', () => ({
  validateUser: vi.fn(() => ({ id: '123', username: 'testuser' }))
}));

vi.mock('../../utils/getRoomId', () => ({
  getRoomId: vi.fn(() => 'room_123')
}));

describe('Poker Room Middleware', () => {
  let mockContext: any;
  let mockQuery: Record<string, string>;

  beforeEach(() => {
    mockContext = {
      user: { id: '123', username: 'testuser' },
      ctx: {
        reply: vi.fn()
      }
    };
    mockQuery = { roomId: 'room_123' };
  });

  describe('wrapWithMiddlewares', () => {
    it('should execute handler when no middleware is provided', async () => {
      const handler = vi.fn();
      const wrappedHandler = wrapWithMiddlewares(handler, []);
      
      await wrappedHandler(mockContext, mockQuery);
      
      expect(handler).toHaveBeenCalledWith(mockContext, mockQuery);
    });

    it('should execute middleware in correct order', async () => {
      const handler = vi.fn();
      const executionOrder: string[] = [];
      
      const middleware1 = vi.fn(async (ctx: any, query: any, next: () => Promise<void>) => {
        executionOrder.push('middleware1');
        await next();
      });
      
      const middleware2 = vi.fn(async (ctx: any, query: any, next: () => Promise<void>) => {
        executionOrder.push('middleware2');
        await next();
      });
      
      const wrappedHandler = wrapWithMiddlewares(handler, [middleware1, middleware2]);
      
      await wrappedHandler(mockContext, mockQuery);
      
      expect(middleware1).toHaveBeenCalled();
      expect(middleware2).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
      expect(executionOrder).toEqual(['middleware1', 'middleware2']);
    });

    it('should stop execution when middleware throws', async () => {
      const handler = vi.fn();
      const errorMiddleware = vi.fn(async () => {
        throw new Error('Middleware error');
      });
      
      const wrappedHandler = wrapWithMiddlewares(handler, [errorMiddleware]);
      
      await expect(wrappedHandler(mockContext, mockQuery)).rejects.toThrow('Middleware error');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('isJoined middleware', () => {
    it('should call next when user is joined', async () => {
      const next = vi.fn();
      
      await isJoined(mockContext, mockQuery, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('isTurn middleware', () => {
    it('should call next when it is user\'s turn', async () => {
      const next = vi.fn();
      
      await isTurn(mockContext, mockQuery, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('isNotJoined middleware', () => {
    it('should call next when user is not joined', async () => {
      const next = vi.fn();
      
      await isNotJoined(mockContext, mockQuery, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
}); 