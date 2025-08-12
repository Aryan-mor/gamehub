import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock router to capture dispatch calls
const dispatchSpy = vi.fn();
vi.mock('@/modules/core/smart-router', () => ({
  dispatch: (...args: any[]) => dispatchSpy(...args),
}));

describe('start command join payload', () => {
  beforeEach(() => dispatchSpy.mockReset());

  it('routes to games.join when payload matches gprj<roomId>', async () => {
    const { registerStartCommand } = await import('../commands/start');

    // Fake bot capturing the handler
    let handler: any;
    const bot: any = {
      command: (_: string, h: any) => { handler = h; },
    };
    registerStartCommand(bot);

    const sent: any[] = [];
    const ctx: any = {
      from: { id: 100, username: 'tester' },
      message: { text: '/start gprjROOM42' },
      log: { info: vi.fn() },
      t: (k: string) => k,
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
    };

    await handler(ctx);

    expect(dispatchSpy).toHaveBeenCalled();
    const [route, context] = dispatchSpy.mock.calls[0];
    expect(route).toBe('games.join');
    expect(context?._query?.roomId).toBe('ROOM42');
  });

  it('redirects /start to games.findStep when user has an open room membership', async () => {
    // Arrange: mock active-room DB resolvers to return an open room for current user
    const roomId = 'room-abc';
    vi.doMock('@/api/users', () => ({
      getByTelegramId: async (_tid: string) => ({ id: 'db-u1' }),
    }));
    vi.doMock('@/api/roomPlayers', () => ({
      listOpenRoomsByUser: async (_uid: string) => [{ room_id: roomId, status: 'playing', joined_at: new Date().toISOString() }],
      listActiveRoomsByUser: async () => [],
    }));

    // Capture middleware registered on bot.use
    let capturedMw: any;
    const mockBot: any = { use: (fn: any) => { capturedMw = fn; } };
    const { registerActiveRoomRedirect } = await import('@/bot/middleware/active-room');
    registerActiveRoomRedirect(mockBot);

    // Fake grammY ctx
    const fakeCtx: any = {
      update: { message: {} },
      from: { id: 'u1', username: 'tester' },
      message: { text: '/start', entities: [{ type: 'bot_command', offset: 0, length: 6 }] },
      chat: { id: 123, type: 'private' },
    };

    // Act: run captured middleware
    await capturedMw(fakeCtx, async () => {});

    // Assert via top-level dispatchSpy
    expect(dispatchSpy).toHaveBeenCalled();
    const [route, ctxArg] = dispatchSpy.mock.calls[0];
    expect(route).toBe('games.findStep');
    expect(ctxArg?._query?.roomId).toBe(roomId);
  });
});


