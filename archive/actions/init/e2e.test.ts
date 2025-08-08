import { describe, it, expect } from 'vitest';
import { encodeAction } from '@/modules/core/route-alias';

// E2E: ensure inline keyboard contains expected compact callbacks
describe('games.poker.room.init inline buttons', () => {
  it('should encode callbacks under 64 bytes and map to expected actions', () => {
    const actions = [
      'games.poker.room.create',
      'games.poker.room.join',
      'games.poker.room.list',
      'games.poker.help',
      'start'
    ];

    const encoded = actions.map(a => ({ action: encodeAction(a) }));
    const payloads = encoded.map(e => JSON.stringify(e));

    // All should be < 64 bytes
    for (const p of payloads) {
      expect(Buffer.byteLength(p, 'utf8')).toBeLessThan(64);
    }

    // Spot-check encoded tokens
    expect(encoded[0].action).toBe('g.pk.r.cr');
    expect(encoded[1].action).toBe('g.pk.r.jn');
    expect(encoded[2].action).toBe('g.pk.r.ls');
    expect(encoded[3].action).toBe('g.pk.h');
    expect(encoded[4].action).toBe('st');
  });
});


