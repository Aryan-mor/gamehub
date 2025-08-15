import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHandlerTestContext } from '@/__tests__/helpers/context';

describe('games.poker.room.call e2e', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should broadcast room info to current user when Call is tapped', async () => {
    const { default: handler } = await import('./index');
    const context = createHandlerTestContext();
    const mockBroadcast = vi.fn().mockResolvedValue(undefined);
    vi.doMock('../services/roomService', () => ({
      broadcastRoomInfo: mockBroadcast,
    }));

    // Inject last viewed roomId
    (context.ctx.formState.set as any)?.('poker.info', context.user.id, { roomId: 'r1' });
    (context as any)._query = { r: 'r1' };

    await handler(context);

    expect(mockBroadcast).toHaveBeenCalled();
  });
});




