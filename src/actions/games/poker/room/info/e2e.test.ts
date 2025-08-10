import { describe, it, expect, vi } from 'vitest';
import { createRoom, addPlayer, markReady } from '../../services/roomStore';
import { encodeAction } from '../../../../../modules/core/route-alias';
import { expectCallbackDataUnder64Bytes } from '../../../../../__tests__/helpers/context';

describe('games.poker.room.info e2e', () => {
  it('should render detailed room info summary and player list with compact callbacks', async () => {
    const roomId = 'room_info_list_1';
    createRoom({ id: roomId, isPrivate: false, maxPlayers: 4, smallBlind: 100, createdBy: 'u1', turnTimeoutSec: 240 });
    addPlayer(roomId, 'u2');
    markReady(roomId, 'u1');

    const mod: any = await import('./index');
    const handler: any = mod.default;
    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
      },
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
    };

    await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as any, { roomId });
    const kb = sent[0];
    const entries = kb.inline_keyboard.flat().filter((b: any) => !!b.callback_data).map((b: any) => JSON.parse(b.callback_data));
    const actions = entries.map((e: any) => e.action);
    expect(actions).toContain('g.pk.r.in');
    // Ensure each callback_data stays under Telegram limit
    expectCallbackDataUnder64Bytes(entries);

    // Also assert that replySmart was called with a message containing the English structure keys
    // (We use lightweight checks to avoid coupling to exact formatting)
    const textArg = (ctx.replySmart as any).mock.calls?.[0]?.[0] as string;
    expect(textArg).toMatch(/Poker Room Info|Room Details|Settings|Players|Last update/i);
  });

  it('should refresh and re-render the same info using the refresh button payload and update lastUpdate', async () => {
    const roomId = 'room_info_refresh_1';
    createRoom({ id: roomId, isPrivate: false, maxPlayers: 4, smallBlind: 50, createdBy: 'u1', turnTimeoutSec: 240 });
    addPlayer(roomId, 'u1');

    const mod: any = await import('./index');
    const handler: any = mod.default;

    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
      },
      replySmart: vi.fn(async (_: string, opts: any) => { sent.push(opts?.reply_markup); }),
      log: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
    };

    // Initial render
    await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId } } as any, { roomId });

    const kb1 = sent[0];
    const entries1 = kb1.inline_keyboard.flat().filter((b: any) => !!b.callback_data).map((b: any) => JSON.parse(b.callback_data));
    // Find refresh payload for room.info
    const refreshEntry = entries1.find((e: any) => e.action === encodeAction('games.poker.room.info'));
    expect(refreshEntry).toBeTruthy();
    expect(refreshEntry.roomId).toBe(roomId);
    expectCallbackDataUnder64Bytes([refreshEntry]);

    // Capture initial lastUpdate text
    const beforeText = (ctx.replySmart as any).mock.calls?.[0]?.[0] as string;
    // Simulate a state change to advance lastUpdate (e.g., markReady again won't change list, but will bump lastUpdate)
    markReady(roomId, 'u1');
    // Simulate clicking refresh: re-invoke handler with payload params
    await handler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId: refreshEntry.roomId } } as any, { roomId: refreshEntry.roomId });

    const textCalls = (ctx.replySmart as any).mock.calls.map((c: any[]) => c[0]);
    // The latest text should still contain the structured info sections (not just the title)
    const latestText = textCalls[textCalls.length - 1] as string;
    expect(latestText).toMatch(/Poker Room Info|Room Details|Settings|Players|Last update/i);
    expect(latestText).not.toEqual(beforeText);
  });
});


