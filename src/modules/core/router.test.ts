import { describe, it, expect, beforeEach, vi } from 'vitest';
import { router, register, dispatch } from './router';
import { parseMessageKey } from './utils/parseMessageKey';

describe('Router System', () => {
  beforeEach(() => {
    // Clear all handlers before each test
    (router as any).handlers.clear();
    (router as any).wildcardHandlers.clear();
  });

  describe('parseMessageKey', () => {
    it('should parse simple path without query', () => {
      const result = parseMessageKey('games.poker.room.call');
      expect(result).toEqual({
        path: ['games', 'poker', 'room', 'call'],
        action: 'call',
        query: {}
      });
    });

    it('should parse path with query parameters', () => {
      const result = parseMessageKey('games.poker.room.call?roomId=123&lang=en');
      expect(result).toEqual({
        path: ['games', 'poker', 'room', 'call'],
        action: 'call',
        query: {
          roomId: '123',
          lang: 'en'
        }
      });
    });

    it('should handle empty query', () => {
      const result = parseMessageKey('games.poker.room.call?');
      expect(result).toEqual({
        path: ['games', 'poker', 'room', 'call'],
        action: 'call',
        query: {}
      });
    });
  });

  describe('Router Registration', () => {
    it('should register exact route handlers', () => {
      const handler = vi.fn();
      register('games.poker.room.call', handler);
      
      const routes = (router as any).getRoutes();
      expect(routes).toContain('games.poker.room.call');
    });

    it('should register wildcard route handlers', () => {
      const handler = vi.fn();
      register('games.poker.room.*', handler);
      
      const routes = (router as any).getRoutes();
      expect(routes).toContain('games.poker.room.*');
    });
  });

  describe('Router Dispatch', () => {
    it('should dispatch to exact handler', async () => {
      const handler = vi.fn();
      register('games.poker.room.call', handler);
      
      const context = { user: { id: '123' } };
      await dispatch('games.poker.room.call?roomId=abc', context);
      
      expect(handler).toHaveBeenCalledWith(context, { roomId: 'abc' });
    });

    it('should dispatch to wildcard handler', async () => {
      const handler = vi.fn();
      register('games.poker.room.*', handler);
      
      const context = { user: { id: '123' } };
      await dispatch('games.poker.room.fold?roomId=abc', context);
      
      expect(handler).toHaveBeenCalledWith(context, { roomId: 'abc' });
    });

    it('should throw error for unregistered route', async () => {
      const context = { user: { id: '123' } };
      
      await expect(
        dispatch('games.poker.room.unknown?roomId=abc', context)
      ).rejects.toThrow('No handler found for route: games.poker.room.unknown?roomId=abc');
    });

    it('should prioritize exact match over wildcard', async () => {
      const exactHandler = vi.fn();
      const wildcardHandler = vi.fn();
      
      register('games.poker.room.call', exactHandler);
      register('games.poker.room.*', wildcardHandler);
      
      const context = { user: { id: '123' } };
      await dispatch('games.poker.room.call?roomId=abc', context);
      
      expect(exactHandler).toHaveBeenCalledWith(context, { roomId: 'abc' });
      expect(wildcardHandler).not.toHaveBeenCalled();
    });
  });
}); 