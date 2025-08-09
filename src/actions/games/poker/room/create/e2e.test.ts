import { describe, it, expect } from 'vitest';
import type { BaseHandler } from '@/modules/core/handler';
import { runHandlerAndGetActions, runHandlerWithQueryPayloads, expectActionsUnder64Bytes } from '@/__tests__/helpers/context';

describe('games.poker.room.create e2e (flow callbacks)', () => {
  it('step1 -> privacy buttons + back', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    const { actions } = await runHandlerAndGetActions(mod.default);
    expect(actions).toContain('g.pk.r.cr');
    expect(actions).toContain('g.pk.st');
    expectActionsUnder64Bytes(actions);
  });

  it('step2 -> maxPlayers buttons after privacy', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    const { payloads } = await runHandlerWithQueryPayloads(mod.default, { s: 'privacy', v: 'true' });
    expect(payloads.some((p) => p.action === 'g.pk.r.cr' && p.s === 'maxPlayers' && p.v === '2')).toBe(true);
    expect(payloads.some((p) => p.action === 'g.pk.r.cr' && p.s === 'maxPlayers' && p.v === '8')).toBe(true);
    const actions = payloads.map((p) => String(p.action ?? ''));
    expectActionsUnder64Bytes(actions);
  });

  it('step3 -> creates room and navigates to room.info', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    // Choose smallBlind step directly to simulate completion
    const { payloads } = await runHandlerWithQueryPayloads(mod.default, { s: 'smallBlind', v: '100' });
    // Expect the resulting message to be the room info keyboard (contains refresh to info with roomId)
    expect(payloads.some((p) => p.action === 'g.pk.r.in' && typeof p.roomId === 'string' && (p.roomId as string).startsWith('room_'))).toBe(true);
    const actions = payloads.map((p) => String(p.action ?? ''));
    expectActionsUnder64Bytes(actions);
  });
});


