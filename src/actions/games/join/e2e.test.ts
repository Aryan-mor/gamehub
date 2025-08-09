import { describe, it, expect, vi } from 'vitest';
import { createRoom } from '@/actions/games/poker/services/roomStore';
import { getActiveRoomId, setActiveRoomId, clearActiveRoomId } from '@/modules/core/userRoomState';
import { encodeAction } from '@/modules/core/route-alias';
import type { BaseHandler } from '@/modules/core/handler';
import type { SmartReplyOptions } from '@/types';

describe('games.join e2e', () => {
  it('joins room when no active room: sets active and proceeds', async () => {
    clearActiveRoomId('u2');
    const roomId = 'room_join_1';
    createRoom({ id: roomId, isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });

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
    const activeId = 'room_active_1';
    const newId = 'room_new_1';
    createRoom({ id: activeId, isPrivate: false, maxPlayers: 2, smallBlind: 100, createdBy: 'u1' });
    createRoom({ id: newId, isPrivate: false, maxPlayers: 2, smallBlind: 100, createdBy: 'u1' });
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
    const kb = sent[0];
    const acts = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
    expect(acts).toContain('g.findStep');
    expect(acts).toContain('g.jn.switch');
    expect(acts).toContain('g.lv.active');
  });
});


