import { describe, it, expect, vi } from 'vitest';
import { createRoom, addPlayer, markReady } from '@/actions/games/poker/services/roomStore';
import { encodeAction } from '@/modules/core/route-alias';
import type { BaseHandler } from '@/modules/core/handler';
import type { SmartReplyOptions } from '@/types';

describe('games.poker.room.info e2e', () => {
  it('should list players with ready flags in callback data', async () => {
    const roomId = 'room_info_list_1';
    createRoom({ id: roomId, isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1' });
    addPlayer(roomId, 'u2');
    markReady(roomId, 'u1');

    const mod: { default: BaseHandler } = await import('./index');
    const handler = mod.default;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
      },
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
    };

    await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });
    const kb = sent[0];
    const entries = kb.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data));
    const actions = entries.map((e: any) => e.action);
    expect(actions).toContain('g.pk.r.in');
    // find rows for u1 and u2 with ready flags
    const u1row = entries.find((e: any) => e.u === 'u1');
    const u2row = entries.find((e: any) => e.u === 'u2');
    expect(u1row).toBeTruthy();
    expect(u2row).toBeTruthy();
    expect(u1row.ready).toBe('1');
    expect(u2row.ready).toBe('0');
  });
});


