import { describe, it, expect } from 'vitest';
import { createRoom } from '@/actions/games/poker/room/services/roomService';
import { getActiveRoomId, setActiveRoomId, clearActiveRoomId } from '@/modules/core/userRoomState';
import type { BaseHandler } from '@/modules/core/handler';

describe('games.join.switch e2e', () => {
  it('leaves current active room then joins the target room', async () => {
    const userId = 'switch_user_1';
    clearActiveRoomId(userId);

    // Arrange: create an active room and a target room
    const active = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 2, smallBlind: 100, createdBy: 'ownerA' });
    const target = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 2, smallBlind: 100, createdBy: 'ownerB' });
    const activeRoomId = active.id as string;
    const targetRoomId = target.id as string;
    setActiveRoomId(userId, activeRoomId);

    // Load handler
    const mod: { default: BaseHandler } = await import('./index');
    const handler = mod.default;

    // Minimal ctx stub with logging shape to avoid errors
    const ctx: any = {
      t: (k: string) => k,
      log: { info: () => {}, error: () => {}, debug: () => {} },
      keyboard: { buildCallbackData: (a: string, p: Record<string, string> = {}) => JSON.stringify({ action: a, ...p }) },
      replySmart: async () => {},
    };

    // Act: switch to target room
    await handler({ ctx, user: { id: userId, username: 'test' }, _query: { r: targetRoomId } } as unknown as import('@/modules/core/handler').HandlerContext);

    // Assert: active room should be updated to target
    expect(getActiveRoomId(userId)).toBe(targetRoomId);
  });

  it('joins target when no active room exists', async () => {
    const userId = 'switch_user_2';
    clearActiveRoomId(userId);

    const target = await createRoom({ id: 'temp', isPrivate: false, maxPlayers: 4, smallBlind: 50, createdBy: 'ownerC' });
    const targetRoomId = target.id as string;

    const mod: { default: BaseHandler } = await import('./index');
    const handler = mod.default;
    const ctx: any = {
      t: (k: string) => k,
      log: { info: () => {}, error: () => {}, debug: () => {} },
      keyboard: { buildCallbackData: (a: string, p: Record<string, string> = {}) => JSON.stringify({ action: a, ...p }) },
      replySmart: async () => {},
    };

    await handler({ ctx, user: { id: userId, username: 'test' }, _query: { r: targetRoomId } } as unknown as import('@/modules/core/handler').HandlerContext);
    expect(getActiveRoomId(userId)).toBe(targetRoomId);
  });
});


