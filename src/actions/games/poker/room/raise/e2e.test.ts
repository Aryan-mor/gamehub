import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHandlerTestContext } from '@/__tests__/helpers/context';

describe('games.poker.room.raise e2e', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('blocks raise options when not your turn and shows toast + refresh', async () => {
    const context = createHandlerTestContext();
    const buildChain = (data: unknown) => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data }),
            then: (resolve: (v: unknown) => unknown) => resolve({ data }),
          }),
        }),
      }),
    });
    vi.doMock('@/lib/supabase', () => ({
      supabaseFor: (_schema: string) => ({
        from: (table: string) => (table === 'hands' ? buildChain([{ id: 'h1', acting_pos: 7, min_raise: 200 }]) : buildChain([{ seat_pos: 0, user_id: 'user-uuid' }]))
      }),
    }));
    vi.doMock('@/api/users', () => ({ getByTelegramId: async () => ({ id: 'user-uuid' }) }));
    const mockBroadcast = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../services/roomService', () => ({ broadcastRoomInfo: mockBroadcast }));
    const { default: handler } = await import('./index');
    (context as any)._query = { r: 'r1' };

    await handler(context);
    expect(mockBroadcast).toHaveBeenCalledWith(context.ctx, 'r1');
  });

  it('shows raise amount options when tapped without amount', async () => {
    const context = createHandlerTestContext();
    const buildChain = (data: unknown) => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data }),
            then: (resolve: (v: unknown) => unknown) => resolve({ data }),
          }),
        }),
      }),
    });
    vi.doMock('@/lib/supabase', () => ({
      supabaseFor: (_schema: string) => ({
        from: (table: string) => (table === 'hands' ? buildChain([{ id: 'h1', acting_pos: 0, min_raise: 200, version: 0 }]) : buildChain([{ seat_pos: 0, user_id: 'user-uuid' }]))
      }),
    }));
    vi.doMock('@/api/users', () => ({ getByTelegramId: async () => ({ id: 'user-uuid' }) }));
    const { default: handler } = await import('./index');
    (context as any)._query = { r: 'r1' };

    await handler(context);

    expect(context.ctx.replySmart).toHaveBeenCalled();
    const call = (context.ctx.replySmart as any).mock.calls.pop();
    const options = call?.[1];
    const kb = options?.reply_markup?.inline_keyboard ?? [];
    const callbacks = kb.flat().map((b: any) => b.callback_data as string);
    // With min_raise=200, dynamic options should be [200,400,600,800] and include version param
    expect(callbacks).toContain('g.pk.r.rs?r=r1&a=200&v=0');
    expect(callbacks).toContain('g.pk.r.rs?r=r1&a=400&v=0');
    expect(callbacks).toContain('g.pk.r.rs?r=r1&a=600&v=0');
    expect(callbacks).toContain('g.pk.r.rs?r=r1&a=800&v=0');
    expect(callbacks).toContain('g.pk.r.in?r=r1');
  });

  it('applies raise when amount is provided and refreshes room info', async () => {
    const context = createHandlerTestContext();
    const mockApply = vi.fn().mockResolvedValue(undefined);
    const mockBroadcast = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../services/actionFlow', () => ({ applyRaiseForUser: mockApply }));
    vi.doMock('../services/roomService', () => ({ broadcastRoomInfo: mockBroadcast }));
    const buildChain = (data: unknown) => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data }),
            then: (resolve: (v: unknown) => unknown) => resolve({ data }),
          }),
        }),
      }),
    });
    vi.doMock('@/lib/supabase', () => ({
      supabaseFor: (_schema: string) => ({
        from: (table: string) => (table === 'hands' ? buildChain([{ id: 'h1', acting_pos: 0, min_raise: 200, version: 0 }]) : buildChain([{ seat_pos: 0, user_id: 'user-uuid' }]))
      }),
    }));
    vi.doMock('@/api/users', () => ({ getByTelegramId: async () => ({ id: 'user-uuid' }) }));
    const { default: handler } = await import('./index');
    (context as any)._query = { r: 'r1', a: '50', v: '0' } as any;

    await handler(context);

    expect(mockApply).toHaveBeenCalledWith(expect.any(Object), 'r1', 50);
    expect(mockBroadcast).toHaveBeenCalledWith(context.ctx, 'r1');
  });

  it('rejects stale raise when version mismatches and refreshes room', async () => {
    const context = createHandlerTestContext();
    const mockApply = vi.fn().mockResolvedValue(undefined);
    const mockBroadcast = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../services/actionFlow', () => ({ applyRaiseForUser: mockApply }));
    vi.doMock('../services/roomService', () => ({ broadcastRoomInfo: mockBroadcast }));
    const buildChain = (data: unknown) => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data }),
            then: (resolve: (v: unknown) => unknown) => resolve({ data }),
          }),
        }),
      }),
    });
    vi.doMock('@/lib/supabase', () => ({
      supabaseFor: (_schema: string) => ({
        from: (table: string) => (table === 'hands' ? buildChain([{ id: 'h1', acting_pos: 0, min_raise: 200, version: 2 }]) : buildChain([{ seat_pos: 0, user_id: 'user-uuid' }]))
      }),
    }));
    vi.doMock('@/api/users', () => ({ getByTelegramId: async () => ({ id: 'user-uuid' }) }));
    const { default: handler } = await import('./index');
    (context as any)._query = { r: 'r1', a: '50', v: '1' } as any;

    await handler(context);

    expect(mockApply).not.toHaveBeenCalled();
    expect(mockBroadcast).toHaveBeenCalledWith(context.ctx, 'r1');
  });

  it('accepts fresh raise when version matches', async () => {
    const context = createHandlerTestContext();
    const mockApply = vi.fn().mockResolvedValue(undefined);
    const mockBroadcast = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../services/actionFlow', () => ({ applyRaiseForUser: mockApply }));
    vi.doMock('../services/roomService', () => ({ broadcastRoomInfo: mockBroadcast }));
    const buildChain = (data: unknown) => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data }),
            then: (resolve: (v: unknown) => unknown) => resolve({ data }),
          }),
        }),
      }),
    });
    vi.doMock('@/lib/supabase', () => ({
      supabaseFor: (_schema: string) => ({
        from: (table: string) => (table === 'hands' ? buildChain([{ id: 'h1', acting_pos: 0, min_raise: 200, version: 3 }]) : buildChain([{ seat_pos: 0, user_id: 'user-uuid' }]))
      }),
    }));
    vi.doMock('@/api/users', () => ({ getByTelegramId: async () => ({ id: 'user-uuid' }) }));
    const { default: handler } = await import('./index');
    (context as any)._query = { r: 'r1', a: '50', v: '3' } as any;

    await handler(context);

    expect(mockApply).toHaveBeenCalledWith(expect.any(Object), 'r1', 50);
    expect(mockBroadcast).toHaveBeenCalledWith(context.ctx, 'r1');
  });
});


