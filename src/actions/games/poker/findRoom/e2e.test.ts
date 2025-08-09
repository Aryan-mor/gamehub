import { describe, it, expect, vi } from 'vitest';
import { createRoom, addPlayer, markReady } from '@/actions/games/poker/services/roomStore';
import { encodeAction } from '@/modules/core/route-alias';

describe('games.poker.findRoom e2e', () => {
  it('should show Share + Back only when room has < 2 players', async () => {
    const roomId = `room_test_empty`;
    createRoom({ id: roomId, isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });

    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
        createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
      },
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
      formState: { get: vi.fn(), set: vi.fn() }
    };

    await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });

    expect(sent.length).toBe(1);
    const kb = sent[0];
    const actions = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
    expect(actions).toContain('g.pk.find'); // inline share entry
    expect(actions).toContain('g.pk.st'); // back to poker start
    expect(actions).not.toContain('g.pk.r.sg'); // no start game
  });

  it('should show Start Game when room has >= 2 players and at least two ready', async () => {
    const roomId = `room_test_two_players`;
    createRoom({ id: roomId, isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
    // add a second player
    addPlayer(roomId, 'u2');
    // both ready
    markReady(roomId, 'u1');
    markReady(roomId, 'u2');

    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
        createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
      },
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
      formState: { get: vi.fn(), set: vi.fn() }
    };

    await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });

    expect(sent.length).toBe(1);
    const kb = sent[0];
    const actions = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
    expect(actions).toContain('g.pk.r.st'); // start game visible (games.poker.room.start)
    expect(actions).toContain('g.pk.st');
    // When >=2 players, Share should not be primary action row anymore
  });

  it('should NOT show Start Game when players >= 2 but ready < 2', async () => {
    const roomId = `room_test_not_enough_ready`;
    createRoom({ id: roomId, isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
    addPlayer(roomId, 'u2');
    // only one ready
    markReady(roomId, 'u1');

    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
        createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
      },
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
      formState: { get: vi.fn(), set: vi.fn() }
    };

    await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });

    expect(sent.length).toBe(1);
    const kb = sent[0];
    const actions = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
    expect(actions).not.toContain('g.pk.r.st'); // start game hidden
    expect(actions).toContain('g.pk.st');
  });

  it('should include player list controls (placeholders) in room view', async () => {
    const roomId = `room_test_players_view`;
    createRoom({ id: roomId, isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
    addPlayer(roomId, 'u2');

    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
        createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
      },
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
      formState: { get: vi.fn(), set: vi.fn() }
    };

    await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });
    const kb = sent[0];
    const actions = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
    // Expect presence of a refresh/info route to reflect players list (placeholder: games.poker.room.info)
    expect(actions).toContain('g.pk.r.in');
  });

  it('share view should be inline within findRoom (no separate route), with copy-link and contacts', async () => {
    const roomId = 'room_inline_share_1';
    createRoom({ id: roomId, isPrivate: false, maxPlayers: 2, smallBlind: 100, createdBy: 'u1' });
    addPlayer(roomId, 'u2');

    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
        createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
      },
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
      formState: { get: vi.fn(), set: vi.fn() }
    };

    // Render share view inline by passing s=share
    await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId, s: 'share' } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId, s: 'share' });
    const kb = sent.pop();
    const entries = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data));
    const hasFindAction = entries.some((e: any) => e.action === 'g.pk.find');
    expect(hasFindAction).toBe(true);
    // Should contain a copy-link action marker via param
    const hasCopy = entries.some((e: any) => e.s === 'copy');
    expect(hasCopy).toBe(true);
  });

  it('should show Ready when user is not ready, and Not Ready when user is ready', async () => {
    const roomId = `room_test_ready_toggle`;
    createRoom({ id: roomId, isPrivate: false, maxPlayers: 2, smallBlind: 100, createdBy: 'u1' });
    addPlayer(roomId, 'u2'); // ensure 2 players

    const mod = await import('./index');
    const handler = mod.default as (ctx: any, q?: Record<string, string>) => Promise<void>;
    const ctxFactory = () => {
      const sent: any[] = [];
      const ctx: any = {
        t: (k: string) => k,
        keyboard: {
          buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
          createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
        },
        replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
        log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
        formState: { get: vi.fn(), set: vi.fn() }
      };
      return { ctx, sent };
    };

    // Initial: user u1 not ready
    {
      const { ctx, sent } = ctxFactory();
      await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });
      const acts = sent[0].inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
      expect(acts).toContain('g.pk.r.ry'); // Ready
    }

    // Mark user ready and expect Not Ready button
    markReady(roomId, 'u1');
    {
      const { ctx, sent } = ctxFactory();
      await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });
      const acts = sent[0].inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
      expect(acts).toContain('g.pk.r.nry'); // Not Ready
    }
  });
});


