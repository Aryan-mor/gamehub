import { describe, it, expect, vi } from 'vitest';
import { encodeAction } from '../../modules/core/route-alias';

// Mock userService to avoid external dependencies during handler execution
vi.mock('@/modules/core/userService', () => ({
  setUserProfile: vi.fn(async () => {}),
  getUser: vi.fn(async () => ({ coins: 0, lastFreeCoinAt: null })),
  addCoins: vi.fn(async () => {}),
}));

describe('start inline buttons', () => {
  it('should encode callbacks under 64 bytes', () => {
    const actions = [
      'games.poker.start',
      'help',
    ];
    const payloads = actions.map(a => JSON.stringify({ action: encodeAction(a) }));
    for (const p of payloads) {
      expect(Buffer.byteLength(p, 'utf8')).toBeLessThan(64);
    }
  });

  it('should produce keyboard with compact actions via handler', async () => {
    const handlerModule = await import('./index');
    const handleStart = handlerModule.default as (ctx: any, q: Record<string,string>) => Promise<void>;

    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string) => JSON.stringify({ action: encodeAction(action) })
      },
      replySmart: vi.fn(async (_text: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { error: vi.fn(), info: vi.fn(), debug: vi.fn() },
    };

    const context: any = {
      ctx,
      user: { id: '123', username: 'test' }
    };

    await handleStart(context, {});

    expect(sent.length).toBe(1);
    const kb = sent[0];
    expect(kb).toBeDefined();
    const buttons = kb.inline_keyboard.flat();
    const actions = buttons.map((b: any) => JSON.parse(b.callback_data).action);
    // After ROUTES update with _self, start route is built via ROUTES.games.poker + '.start'
    // Which is encoded as encodeAction(ROUTES.games.poker + '.start') => g.pk.st
    expect(actions).toContain('g.pk.st');
    expect(actions).toContain('h');
  });
});


