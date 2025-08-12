import { HandlerContext, createHandler } from '@/modules/core/handler';
import { getPreferredLanguageFromCache } from '@/modules/global/language';

async function handleLanguage(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  const { keyboard } = ctx;
  // no-op import left out; updates are handled in set handler

  const currentLang = getPreferredLanguageFromCache(String(ctx.from?.id || '')) || ctx.from?.language_code || 'en';
  const title = ctx.t('settings.language.title') || '🌐 Select your language';

  const enBase = '🇬🇧 ' + (ctx.t('settings.language.en') || 'English');
  const faBase = '🇮🇷 ' + (ctx.t('settings.language.fa') || 'فارسی');
  const enText = currentLang === 'en' ? `✅ ${enBase}` : enBase;
  const faText = currentLang === 'fa' ? `✅ ${faBase}` : faBase;

  const { encodeAction } = await import('@/modules/core/route-alias');
  const { ROUTES } = await import('@/modules/core/routes.generated');
  const setRoute = ROUTES.settings.language.set;
  const buttons = [
    { text: enText, callback_data: JSON.stringify({ action: encodeAction(setRoute), lang: 'en' }) },
    { text: faText, callback_data: JSON.stringify({ action: encodeAction(setRoute), lang: 'fa' }) },
  ];

  const replyMarkup = keyboard.createInlineKeyboard(buttons);
  await ctx.replySmart(title, { reply_markup: replyMarkup, parse_mode: 'HTML' });
}

export default createHandler(handleLanguage);


