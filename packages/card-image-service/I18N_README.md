# Internationalization (i18n) Implementation

This document describes the multi-language support implementation for the Card Image Service Telegram bot.

## Overview

The bot now supports multiple languages using [i18next](https://www.i18next.com/) with the file system backend. The default language is English (`en`), and Persian (`fa`) is also supported.

## Architecture

### File Structure
```
card-image-service/
├── locales/
│   ├── en/
│   │   └── translation.json
│   └── fa/
│       └── translation.json
├── src/
│   ├── i18n.ts          # i18n configuration and middleware
│   ├── bot.ts           # Updated bot with i18n support
│   └── example-usage.ts # Usage examples
└── src/i18n.test.ts     # Tests for i18n functionality
```

### Key Components

1. **i18n.ts**: Core i18n configuration and middleware
2. **Translation Files**: JSON files in `locales/{language}/translation.json`
3. **Middleware**: Automatically injects `ctx.t()` function into bot context
4. **Type Safety**: Proper TypeScript interfaces for i18n context

## Usage

### Basic Translation
```typescript
// In bot commands
bot.command('start', (ctx) => {
  ctx.reply(`${ctx.t('🎴 Card Image Service Bot')}\n\n${ctx.t('This bot is used for generating and sending card images.')}`);
});
```

### Inline Keyboard Translation
```typescript
import { InlineKeyboard } from 'grammy';

const keyboard = new InlineKeyboard()
  .text(ctx.t('🎴 Card Image Service Bot'), 'start_command')
.text(ctx.t('✅ Card Image Service is running'), 'status_command');
```

### Error Handling
```typescript
try {
  // Some operation
} catch (error) {
  ctx.reply(ctx.t('❌ Error getting cache stats'));
}
```

## Language Detection

The bot automatically detects the user's language from `ctx.from?.language_code` and falls back to English if the language is not supported.

### Supported Languages
- **English (`en`)**: Default language
- **Persian (`fa`)**: Full translation support

## Translation Keys

### Structure
All translation keys follow a hierarchical structure:
- `🎴 Card Image Service Bot`: Bot start command title
- `This bot is used for generating and sending card images.`: Bot start command description
- `✅ Card Image Service is running`: Status command response
- `📊 Cache Statistics`: Cache statistics title
- `Total entries`: Cache total entries label
- `Expired entries`: Cache expired entries label
- `🗑️ Cache cleared successfully`: Cache cleared success message
- `❌ Error getting cache stats`: Cache stats error message
- `❌ Error clearing cache`: Cache clear error message

### Adding New Translations

1. **Add the key to English translation** (`locales/en/translation.json`):
```json
{
  "bot": {
    "new": {
      "feature": "New feature description"
    }
  }
}
```

2. **Add the corresponding translation** to other language files:
```json
// locales/fa/translation.json
{
  "bot": {
    "new": {
      "feature": "توضیح ویژگی جدید"
    }
  }
}
```

3. **Use in code**:
```typescript
ctx.reply(ctx.t('🎉 New Feature Available!'));
```

## Testing

Run the i18n tests:
```bash
pnpm test
```

The tests verify:
- Translation fallback to English for unsupported languages
- Correct translation for supported languages
- Key resolution and missing key handling
- i18next configuration

## ESLint Rules

The project includes ESLint rules that prevent hardcoded user-facing strings. The rules ensure that all user-visible text uses the translation system.

### Example of Blocked Code:
```typescript
// ❌ This will cause an ESLint error
ctx.reply('🎴 Card Image Service Bot');

// ✅ This is the correct way
ctx.reply(ctx.t('🎴 Card Image Service Bot'));
```

## Configuration

### i18next Configuration
- **Backend**: File system backend for loading translations
- **Fallback**: English (`en`) as fallback language
- **Supported Languages**: `['en', 'fa']`
- **Namespace**: `translation` (default)
- **Preload**: Both English and Persian are preloaded

### Middleware Configuration
- Automatically detects user language from Telegram context
- Falls back to English for unsupported languages
- Injects `ctx.t()` function into bot context

## Best Practices

1. **Always use translation keys** instead of hardcoded strings
2. **Follow the hierarchical key structure** for organization
3. **Test translations** for all supported languages
4. **Use descriptive key names** that indicate the context
5. **Keep translations consistent** across all language files

## Adding New Languages

To add a new language:

1. Create a new directory: `locales/{language_code}/`
2. Create `translation.json` with all the translation keys
3. Add the language code to `supportedLngs` in `i18n.ts`
4. Add the language to `preload` array in `i18n.ts`
5. Update tests to include the new language

## Troubleshooting

### Common Issues

1. **Translation not found**: Check if the key exists in all language files
2. **Fallback not working**: Verify the fallback language is correctly configured
3. **TypeScript errors**: Ensure proper typing for the `I18nContext` interface
4. **ESLint errors**: Make sure all user-facing strings use `ctx.t()`

### Debug Mode
To enable debug mode, set `debug: true` in the i18next configuration in `i18n.ts`. 