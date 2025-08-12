import { describe, it, vi, expect } from 'vitest';
import { createHandlerTestContext } from '@/__tests__/helpers/context';
import type { BaseHandler } from '@/modules/core/handler';

// Mock language module to observe updates
vi.mock('@/modules/global/language', async (orig) => {
  const actual = await (orig as unknown as () => Promise<any>)();
  return {
    ...actual,
    updatePreferredLanguage: vi.fn(async () => {}),
    setPreferredLanguageInCache: vi.fn((_: string, __: string) => {}),
  };
});

describe('settings.language.set e2e', () => {
  it('should update preferred language for valid lang values', async () => {
    const mod: { default: BaseHandler } = await import('./index');
    const { updatePreferredLanguage, setPreferredLanguageInCache } = await import('@/modules/global/language');

    const context = createHandlerTestContext();
    // simulate callback with lang=en
    (context.ctx as any).callbackQuery = { data: JSON.stringify({ action: 'set', lang: 'en' }) };
    await mod.default(context as any, {});

    // Our helper sets ctx.from.id to 123456789; the handler uses ctx.from.id
    expect(updatePreferredLanguage).toHaveBeenCalledWith('123456789', 'en');
    expect(setPreferredLanguageInCache).toHaveBeenCalledWith('123456789', 'en');
  });
});


