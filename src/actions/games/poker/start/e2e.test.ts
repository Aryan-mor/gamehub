import { describe, it, expect } from 'vitest';
import { encodeAction } from '@/modules/core/route-alias';
import type { BaseHandler } from '@/modules/core/handler';
import { runHandlerAndGetActions, expectActionsUnder64Bytes } from '@/__tests__/helpers/context';

describe('games.poker.start e2e (buttons)', () => {
  it('should render create/join/help/back callbacks under 64 bytes', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    const { actions } = await runHandlerAndGetActions(mod.default, {}, {
      poker: {
        generateMainMenuKeyboard: () => ({ inline_keyboard: [[
          { text: 'create', callback_data: JSON.stringify({ action: encodeAction('games.poker.room.create') }) },
          { text: 'join', callback_data: JSON.stringify({ action: encodeAction('games.poker.room.join') }) },
        ], [
          { text: 'help', callback_data: JSON.stringify({ action: encodeAction('games.poker.help') }) },
        ]]}),
      },
    });

    expect(actions).toContain('g.pk.r.cr');
    expect(actions).toContain('g.pk.r.jn');
    expect(actions).toContain('g.pk.h');
    expect(actions).toContain('g.st'); // back button

    expectActionsUnder64Bytes(actions);
  });
});


