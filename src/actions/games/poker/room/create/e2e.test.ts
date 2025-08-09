import { describe, it, expect, vi } from 'vitest';
import { encodeAction } from '@/modules/core/route-alias';

describe('games.poker.room.create e2e (flow callbacks)', () => {
  it('step1 -> privacy buttons + back', async () => {
    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
        createCustomKeyboard: (layout: string[][], templates: Record<string, { text: string; callback_data: string }>) => ({ inline_keyboard: layout.map(row => row.map(k => templates[k])) })
      },
      formState: {
        get: (_ns: string, _uid: string) => undefined,
        set: (_ns: string, _uid: string, _state: unknown) => {},
        delete: () => {},
        has: () => false,
        clearNamespace: () => {},
      },
      replySmart: vi.fn(async (_text: string, opts: any) => { sent.push(opts?.reply_markup); }),
    };
    await handler({ ctx, user: { id: 'u', username: 't' } }, {});
    const kb = sent[0];
    const actions = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
    expect(actions).toContain('g.pk.r.cr'); // same route with params later
    expect(actions).toContain('g.pk.st'); // back
  });

  it('step2 -> maxPlayers buttons after privacy', async () => {
    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
        createCustomKeyboard: (layout: string[][], templates: Record<string, { text: string; callback_data: string }>) => ({ inline_keyboard: layout.map(row => row.map(k => templates[k])) })
      },
      formState: {
        get: (_ns: string, _uid: string) => undefined,
        set: (_ns: string, _uid: string, _state: unknown) => {},
        delete: () => {},
        has: () => false,
        clearNamespace: () => {},
      },
      replySmart: vi.fn(async (_text: string, opts: any) => { sent.push(opts?.reply_markup); }),
    };
    const context: any = { ctx, user: { id: 'u', username: 't' }, _query: { s: 'privacy', v: 'true' } };
    await handler(context, {});
    const kb = sent.at(-1);
    const actions = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data));
    expect(actions.some((a: any) => a.action === 'g.pk.r.cr' && a.s === 'maxPlayers' && a.v === '2')).toBe(true);
    expect(actions.some((a: any) => a.action === 'g.pk.r.cr' && a.s === 'maxPlayers' && a.v === '8')).toBe(true);
  });

  it('step3 -> smallBlind buttons after maxPlayers', async () => {
    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
        createCustomKeyboard: (layout: string[][], templates: Record<string, { text: string; callback_data: string }>) => ({ inline_keyboard: layout.map(row => row.map(k => templates[k])) })
      },
      formState: {
        get: (_ns: string, _uid: string) => undefined,
        set: (_ns: string, _uid: string, _state: unknown) => {},
        delete: () => {},
        has: () => false,
        clearNamespace: () => {},
      },
      replySmart: vi.fn(async (_text: string, opts: any) => { sent.push(opts?.reply_markup); }),
    };
    const context: any = { ctx, user: { id: 'u', username: 't' }, _query: { s: 'maxPlayers', v: '4' } };
    await handler(context, {});
    const kb = sent.at(-1);
    const actions = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data));
    expect(actions.some((a: any) => a.action === 'g.pk.r.cr' && a.s === 'smallBlind' && a.v === '100')).toBe(true);
    expect(actions.some((a: any) => a.action === 'g.pk.r.cr' && a.s === 'smallBlind' && a.v === '800')).toBe(true);
  });
});


