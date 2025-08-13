import { describe, it, expect, vi } from 'vitest';
import type { BaseHandler } from '@/modules/core/handler';
import { encodeAction } from '@/modules/core/route-alias';
import { createRoom, addPlayer, markReady } from '@/actions/games/poker/room/services/roomService';
import * as roomService from '@/actions/games/poker/room/services/roomService';

describe('games.poker.room.start E2E (initial wiring)', () => {
  it('should trigger broadcast after start (no direct reply with buttons)', async () => {
    // Prepare a room with two players
    const room = await createRoom({ id: '', isPrivate: false, maxPlayers: 2, smallBlind: 100, createdBy: 'u1' });
    await addPlayer(room.id, 'u2');
    await markReady(room.id, 'u1');
    await markReady(room.id, 'u2');

    // Mock game flow to avoid DB operations inside start
    const mockStart = vi.fn(async () => {});
    vi.doMock('../services/gameFlow', () => ({ startHandForRoom: mockStart }));
    // Spy on broadcast and capture calls
    const broadcastSpy = vi.spyOn(roomService, 'broadcastRoomInfo').mockImplementation(async () => {});

    const mod: { default: BaseHandler } = await import('./index');
    const startHandler = mod.default;

    const sent: any[] = [];
    const ctx: any = {
      t: (k: string) => k,
      from: { id: 1 },
      keyboard: {
        buildCallbackData: (action: string, params: Record<string, string> = {}) => JSON.stringify({ action: encodeAction(action), ...params }),
        createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
      },
      // Not used by this test anymore
      sendOrEditMessageToUsers: vi.fn(async () => {}),
      replySmart: vi.fn(async () => { /* start no longer directly replies with game buttons */ })
    };

    await startHandler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId: room.id } } as any, { roomId: room.id });
    expect(mockStart).toHaveBeenCalledOnce();
    expect(broadcastSpy).toHaveBeenCalledOnce();
  });
});


