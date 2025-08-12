import { HandlerContext, createHandler } from '@/modules/core/handler';

async function handleLanguageSet(context: HandlerContext, query: Record<string, string>): Promise<void> {
  const { ctx } = context;
  const langParam = query.lang || (ctx.callbackQuery?.data && (() => {
    try { return (JSON.parse(ctx.callbackQuery?.data || '{}') as { lang?: string }).lang; } catch { return undefined; }
  })());

  const lang = (langParam === 'fa' ? 'fa' : (langParam === 'en' ? 'en' : undefined));
  if (!lang) {
    await ctx.replySmart(ctx.t('settings.language.invalid') || 'Invalid language');
    return;
  }

  const { updatePreferredLanguage, setPreferredLanguageInCache } = await import('@/modules/global/language');
  await updatePreferredLanguage(String(ctx.from?.id || ''), lang);
  setPreferredLanguageInCache(String(ctx.from?.id || ''), lang);
  // Redirect to start flow to continue normal onboarding/menu with new language
  const { dispatch } = await import('@/modules/core/smart-router');
  await dispatch('start', context);
}

export default createHandler(handleLanguageSet);


