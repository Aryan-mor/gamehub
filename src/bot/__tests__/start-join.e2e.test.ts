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
});


