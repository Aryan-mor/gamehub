import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHandlerTestContext } from '@/__tests__/helpers/context';

describe('games.poker.room.check e2e', () => {
  beforeEach(() => vi.clearAllMocks());

  it('applies check via applyCallForUser and broadcasts info with override actingPos', async () => {
    const { default: handler } = await import('./index');
    const context = createHandlerTestContext();

    const mockApplyCall = vi.fn().mockResolvedValue({ ok: true, toCall: 0, callAmount: 0, nextPos: 3 });
    const mockBroadcast = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../services/actionFlow', () => ({ applyCallForUser: mockApplyCall }));
    vi.doMock('../services/roomService', () => ({ broadcastRoomInfo: mockBroadcast }));

    (context as any)._query = { r: 'r-check' };

    await handler(context);

    expect(mockApplyCall).toHaveBeenCalledWith(expect.any(Object), 'r-check');
    expect(mockBroadcast).toHaveBeenCalledWith(context.ctx, 'r-check', undefined, undefined, 3);
  });
});


