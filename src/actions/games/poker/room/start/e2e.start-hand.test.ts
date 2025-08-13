import { describe, it, expect, vi } from 'vitest';
import type { BaseHandler } from '@/modules/core/handler';

describe('games.poker.room.start -> calls game flow startHandForRoom', () => {
  it('should call startHandForRoom with context and roomId', async () => {
    const mockStart = vi.fn(async () => {});
    vi.doMock('../services/gameFlow', () => ({
      startHandForRoom: mockStart,
    }));

    const mod: { default: BaseHandler } = await import('./index');
    const startHandler = mod.default;

    const ctx: any = {
      t: (k: string) => k,
      keyboard: {
        buildCallbackData: (action: string) => action,
        createInlineKeyboard: (buttons: Array<{ text: string; callback_data: string }>) => ({ inline_keyboard: buttons.map(b => [b]) })
      },
      replySmart: vi.fn(async () => {})
    };

    await startHandler({ ctx, user: { id: 'u1', username: 't' }, _query: { roomId: 'r1' } } as any, { roomId: 'r1' });

    expect(mockStart).toHaveBeenCalledOnce();
    expect(mockStart).toHaveBeenCalledWith(expect.any(Object), 'r1');
  });
});


