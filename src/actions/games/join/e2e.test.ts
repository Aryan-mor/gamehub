import { describe, it, expect, vi } from 'vitest';
import { createRoom, addPlayer } from '@/actions/games/poker/room/services/roomService';
import { getActiveRoomId, setActiveRoomId, clearActiveRoomId } from '@/modules/core/userRoomState';
import { encodeAction } from '@/modules/core/route-alias';
import type { BaseHandler } from '@/modules/core/handler';
import type { SmartReplyOptions } from '@/types';

describe('games.join e2e', () => {
  it('joins room when no active room: sets active and proceeds', async () => {
    clearActiveRoomId('u2');
    const created = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
    const roomId = created.id;

    const mod: { default: BaseHandler } = await import('./index');
    const handler = mod.default;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: { buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }) },
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
    };
    await handler({ ctx, user: { id: 'u2', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });
    expect(getActiveRoomId('u2')).toBe(roomId);
  });

  it('shows 3-option conflict UI when active room differs', async () => {
    const createdActive = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 2, smallBlind: 100, createdBy: 'u1' });
    const activeId = createdActive.id;
    const createdNew = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 2, smallBlind: 100, createdBy: 'u1' });
    const newId = createdNew.id;
    setActiveRoomId('u3', activeId);

    const mod: { default: BaseHandler } = await import('./index');
    const handler = mod.default;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: { buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }) },
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
    };
    await handler({ ctx, user: { id: 'u3', username: 't' }, _query: { roomId: newId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId: newId });
    const kb = sent[0] ?? { inline_keyboard: [] };
    const acts = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
    expect(acts).toContain('g.findStep');
    expect(acts).toContain('g.jn');
    expect(acts).toContain('g.st');
  });

      it.skip('navigates to room.info and broadcasts updates to other players (no loading)', async () => {
    // Do not reset modules to keep in-memory stores shared across handler and tests
    const created2 = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'owner1' });
    const roomId = created2.id;

    // Use real router to render room.info

    const mod: { default: BaseHandler } = await import('./index');
    const handler = mod.default;
    const sent: Array<{ text: string; markup: any }> = [];
    const ctx: any = {
      t: (k: string) => k,
      from: { id: 123, first_name: 'First', last_name: 'Last' },
      keyboard: { buildCallbackData: (a: string, p: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(a), ...p }) },
      replySmart: vi.fn(async (text: string, opts: any) => { sent.push({ text, markup: opts?.reply_markup }); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
      api: { sendMessage: vi.fn() },
    };
    await handler({ ctx, user: { id: 'joiner1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });
    // Should render room info for current user
    expect(sent.length).toBeGreaterThan(0);
    const last = sent.at(-1)?.text || '';
    expect(/poker\.room\.info\.title|poker\.room\.info\.section\.details/i.test(last)).toBe(true);
  });

  it('rejects join when room is full', async () => {
    const created3 = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 1, smallBlind: 50, createdBy: 'owner2' });
    const roomId = created3.id;
    // Fill the room
    await addPlayer(roomId, 'owner2');

    const mod: { default: BaseHandler } = await import('./index');
    const handler = mod.default;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: { buildCallbackData: (a: string, p: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(a), ...p }) },
      replySmart: vi.fn(async (text: string, opts: any) => { sent.push(text); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
    };
    // Ensure no active room interferes
    clearActiveRoomId('joiner2');
    await handler({ ctx, user: { id: 'joiner2', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });
    expect(sent.length).toBeGreaterThan(0);
    expect(String(sent[0])).toMatch(/poker\.room\.error\.full|full/i);
  });
});


