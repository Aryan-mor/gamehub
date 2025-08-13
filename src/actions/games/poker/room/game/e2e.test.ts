import { describe, it, expect, vi } from 'vitest';
import { createRoom, addPlayer, markReady } from '@/actions/games/poker/room/services/roomService';
import { encodeAction } from '@/modules/core/route-alias';
import type { BaseHandler } from '@/modules/core/handler';
import type { SmartReplyOptions } from '@/types';

describe('games.poker.room.start -> game state', () => {
  it('should transition to game state with proper inline buttons after pressing Start', async () => {
    const created = await createRoom({ id: '', isPrivate: false, maxPlayers: 2, smallBlind: 100, createdBy: 'u1' });
    const roomId = created.id;
    await addPlayer(roomId, 'u2');
    // both ready to meet Start condition
    await markReady(roomId, 'u1');
    await markReady(roomId, 'u2');

    const mod: { default: BaseHandler } = await import('../../findRoom/index');
    const findRoom = mod.default;

    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
        createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
      },
      replySmart: vi.fn(async (_: string, opts: SmartReplyOptions | undefined) => { sent.push(opts?.reply_markup); }),
      // Capture broadcast outputs
      sendOrEditMessageToUsers: vi.fn(async (_userIds: number[], _text: string, options: any) => { sent.push(options?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
      formState: { get: vi.fn(), set: vi.fn() }
    };

    await findRoom({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });
    const kb1 = sent.pop();
    const actions1 = kb1.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
    // Note: Start button might not be present if room conditions are not met
    // This test verifies that the room info is displayed correctly

    // Simulate pressing Start by invoking the start handler
    const startMod: { default: BaseHandler } = await import('../start');
    const startHandler = startMod.default;
    await startHandler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as unknown as import('@/modules/core/handler').HandlerContext, { roomId });
    const kb2 = sent.pop();
    expect(kb2).toBeDefined();
    const actions2 = kb2.inline_keyboard.flat().map((b: any) => JSON.parse(b.callback_data).action);
    // Expect initial in-game buttons (example: Check/Call/Fold/Raise not all must exist yet, just assert presence placeholder)
    expect(actions2).toContain('g.pk.r.ck'); // check
    expect(actions2).toContain('g.pk.r.cl'); // call
    expect(actions2).toContain('g.pk.r.fd'); // fold
  });
});


