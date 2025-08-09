import { describe, it, expect, vi } from 'vitest';
import { encodeAction } from '@/modules/core/route-alias';

describe('games.poker.start e2e (buttons)', () => {
  it('should render create/join/help/back callbacks under 64 bytes', async () => {
    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;

    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
      },
      poker: {
        generateMainMenuKeyboard: () => ({ inline_keyboard: [[
          { text: 'create', callback_data: JSON.stringify({ action: encodeAction('games.poker.room.create') }) },
          { text: 'join', callback_data: JSON.stringify({ action: encodeAction('games.poker.room.join') }) },
        ], [
          { text: 'help', callback_data: JSON.stringify({ action: encodeAction('games.poker.help') }) },
        ]]}),
      },
      replySmart: vi.fn(async (_text: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { error: vi.fn(), info: vi.fn(), debug: vi.fn() },
    };

    await handler({ ctx, user: { id: '123', username: 't' } }, {});

    expect(sent.length).toBe(1);
    const kb = sent[0];
    const actions = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
    expect(actions).toContain('g.pk.r.cr');
    expect(actions).toContain('g.pk.r.jn');
    expect(actions).toContain('g.pk.h');
    expect(actions).toContain('g.st'); // back button
    for (const a of kp(actions)) {
      expect(Buffer.byteLength(JSON.stringify({ action: a }), 'utf8')).toBeLessThan(64);
    }
  });
});

function kp<T>(arr: T[]): T[] { return Array.isArray(arr) ? arr : []; }


