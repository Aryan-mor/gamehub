import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHandlerTestContext } from '@/__tests__/helpers/context';

describe('games.poker.room.raise e2e', () => {
  beforeEach(() => vi.clearAllMocks());

  it('blocks raise options when not your turn and shows toast + refresh', async () => {
    const { default: handler } = await import('./index');
    const context = createHandlerTestContext();
    (context as any)._query = { r: 'r1' };

    vi.doMock('@/lib/supabase', () => ({
      supabaseFor: (_schema: string) => ({
        from: (_table: string) => ({
          select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [{ id: 'h1', acting_pos: 7, min_raise: 200 }] }) }) }) })
        })
      })
    }));
    vi.doMock('@/api/users', () => ({ getByTelegramId: async () => ({ id: 'user-uuid' }) }));
    const mockBroadcast = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../services/roomService', () => ({ broadcastRoomInfo: mockBroadcast }));

    await handler(context);
    expect(mockBroadcast).toHaveBeenCalledWith(context.ctx, 'r1');
  });

  it('shows raise amount options when tapped without amount', async () => {
    const { default: handler } = await import('./index');
    const context = createHandlerTestContext();

    vi.doMock('@/lib/supabase', () => ({
      supabaseFor: (_schema: string) => ({
        from: (table: string) => ({
          select: () => ({
            eq: () => ({ order: () => ({ limit: async () => ({ data: table === 'hands' ? [{ id: 'h1', acting_pos: 0, min_raise: 200 }] : [{ seat_pos: 0, user_id: 'user-uuid' }] }) }) })
          })
        })
      })
    }));
    vi.doMock('@/api/users', () => ({ getByTelegramId: async () => ({ id: 'user-uuid' }) }));
    (context as any)._query = { r: 'r1' };

    await handler(context);

    expect(context.ctx.replySmart).toHaveBeenCalled();
    const call = (context.ctx.replySmart as any).mock.calls.pop();
    const options = call?.[1];
    const kb = options?.reply_markup?.inline_keyboard ?? [];
    const callbacks = kb.flat().map((b: any) => b.callback_data as string);
    // Should include raise options and back to info
    expect(callbacks).toContain('g.pk.r.rs?r=r1&a=10');
    expect(callbacks).toContain('g.pk.r.rs?r=r1&a=25');
    expect(callbacks).toContain('g.pk.r.rs?r=r1&a=50');
    expect(callbacks).toContain('g.pk.r.rs?r=r1&a=100');
    expect(callbacks).toContain('g.pk.r.in?r=r1');
  });

  it('applies raise when amount is provided and refreshes room info', async () => {
    const { default: handler } = await import('./index');
    const context = createHandlerTestContext();

    const mockApply = vi.fn().mockResolvedValue(undefined);
    const mockBroadcast = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../services/actionFlow', () => ({ applyRaiseForUser: mockApply }));
    vi.doMock('../services/roomService', () => ({ broadcastRoomInfo: mockBroadcast }));

    // Acting turn
    vi.doMock('@/lib/supabase', () => ({
      supabaseFor: (_schema: string) => ({
        from: (table: string) => ({
          select: () => ({
            eq: () => ({ order: () => ({ limit: async () => ({ data: table === 'hands' ? [{ id: 'h1', acting_pos: 0, min_raise: 200 }] : [{ seat_pos: 0, user_id: 'user-uuid' }] }) }) })
          })
        })
      })
    }));
    vi.doMock('@/api/users', () => ({ getByTelegramId: async () => ({ id: 'user-uuid' }) }));
    (context as any)._query = { r: 'r1', a: '50' } as any;

    await handler(context);

    expect(mockApply).toHaveBeenCalledWith(expect.any(Object), 'r1', 50);
    expect(mockBroadcast).toHaveBeenCalledWith(context.ctx, 'r1');
  });
});


