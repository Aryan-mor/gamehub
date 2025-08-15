import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHandlerTestContext } from '@/__tests__/helpers/context';

describe('games.poker.room.fold e2e', () => {
  beforeEach(() => vi.clearAllMocks());

  it('applies fold and broadcasts room info', async () => {
    const { default: handler } = await import('./index');
    const context = createHandlerTestContext();

    const mockFold = vi.fn().mockResolvedValue(undefined);
    const mockBroadcast = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../services/actionFlow', () => ({ applyFoldForUser: mockFold }));
    vi.doMock('../services/roomService', () => ({ broadcastRoomInfo: mockBroadcast }));

    (context as any)._query = { r: 'r-fold' };

    await handler(context);

    expect(mockFold).toHaveBeenCalledWith(expect.any(Object), 'r-fold');
    expect(mockBroadcast).toHaveBeenCalledWith(context.ctx, 'r-fold');
  });
});


