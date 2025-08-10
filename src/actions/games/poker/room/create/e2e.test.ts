import { describe, it, expect, vi } from 'vitest';
import type { BaseHandler } from '@/modules/core/handler';
import { runHandlerAndGetActions, runHandlerAndGetPayloads, runHandlerWithQueryPayloads, expectActionsUnder64Bytes, expectCallbackDataUnder64Bytes } from '@/__tests__/helpers/context';

describe('games.poker.room.create e2e (flow callbacks)', () => {
  it('step1 -> privacy buttons + back', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    const { actions } = await runHandlerAndGetActions(mod.default);
    const { payloads } = await runHandlerAndGetPayloads(mod.default);
    expect(actions).toContain('g.pk.r.cr');
    expect(actions).toContain('g.pk.st');
    expectActionsUnder64Bytes(actions);
    expectCallbackDataUnder64Bytes(payloads);
  });

  it('step2 -> maxPlayers buttons after privacy', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    const { payloads } = await runHandlerWithQueryPayloads(mod.default, { s: 'privacy', v: 'true' });
    expect(payloads.some((p) => p.action === 'g.pk.r.cr' && p.s === 'maxPlayers' && p.v === '2')).toBe(true);
    expect(payloads.some((p) => p.action === 'g.pk.r.cr' && p.s === 'maxPlayers' && p.v === '8')).toBe(true);
    expectCallbackDataUnder64Bytes(payloads);
  });

  it('step3 -> timeout buttons after smallBlind', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    const { payloads } = await runHandlerWithQueryPayloads(mod.default, { s: 'smallBlind', v: '100' });
    // Expect timeout options (2,4,8,16 minutes => 120,240,480,960 seconds)
    expect(payloads.some((p) => p.action === 'g.pk.r.cr' && p.s === 'timeout' && p.v === '120')).toBe(true);
    expect(payloads.some((p) => p.action === 'g.pk.r.cr' && p.s === 'timeout' && p.v === '240')).toBe(true);
    expect(payloads.some((p) => p.action === 'g.pk.r.cr' && p.s === 'timeout' && p.v === '480')).toBe(true);
    expect(payloads.some((p) => p.action === 'g.pk.r.cr' && p.s === 'timeout' && p.v === '960')).toBe(true);
    expectCallbackDataUnder64Bytes(payloads);
  });

  it('step4 -> creates room and navigates to room.info after timeout selection', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    const { payloads } = await runHandlerWithQueryPayloads(mod.default, { s: 'timeout', v: '240' });
    // Expect the resulting message to be the room info keyboard
    expect(payloads.some((p) => p.action === 'g.pk.r.in')).toBe(true);
    // Room info payloads now only contain route action (no per-player u/ready pairs)
    expectCallbackDataUnder64Bytes(payloads);
  });

  it('attempts DB persist when GAMEHUB_USE_DB=true and repo.createRoom fails (non-blocking)', async () => {
    process.env.GAMEHUB_USE_DB = 'true';

    vi.resetModules();
    const persistError = new Error('DB persist failed');

    const createMock = vi.fn().mockRejectedValue(persistError);
    vi.doMock('../../services/roomRepo', () => ({
      createRoom: createMock,
      getRoom: vi.fn(),
      addPlayer: vi.fn(),
      removePlayer: vi.fn(),
      setReady: vi.fn(),
    }));

    const mod: { default: BaseHandler } = await import('./index');
    const { payloads } = await runHandlerWithQueryPayloads(mod.default, { s: 'timeout', v: '240' });

    // UI still navigates to room.info
    expect(payloads.some((p) => p.action === 'g.pk.r.in')).toBe(true);

    // wait a tick for fire-and-forget persist to run
    await new Promise((r) => setTimeout(r, 0));

    // DB persist was attempted (and failed) but did not block UI
    expect(createMock).toHaveBeenCalled();

    delete process.env.GAMEHUB_USE_DB;
    vi.resetModules();
  });
});


