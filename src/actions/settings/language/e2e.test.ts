import { describe, it } from 'vitest';
import { runHandlerAndGetPayloads, expectCallbackDataUnder64Bytes } from '@/__tests__/helpers/context';
import type { BaseHandler } from '@/modules/core/handler';

describe('settings.language e2e', () => {
  it('should render EN/FA buttons with compact set route and lang param', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    const { payloads } = await runHandlerAndGetPayloads(mod.default, {}, { from: { id: 123, language_code: 'en' } as any });

    // Expect two payloads for EN/FA
    const actions = payloads.map(p => String(p.action));
    const langs = payloads.map(p => (p.lang ? String(p.lang) : '')).filter(Boolean);
    // Route should be encoded variant of settings.language.set
    expect(actions.every(a => typeof a === 'string' && a.length > 0)).toBeTruthy();
    // Params must include lang for both
    expect(langs).toContain('en');
    expect(langs).toContain('fa');

    expectCallbackDataUnder64Bytes(payloads);
  });
});


