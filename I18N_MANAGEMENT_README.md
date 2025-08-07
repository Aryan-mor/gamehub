# 🌐 i18n Management System

This project includes a comprehensive i18n management system to handle translations efficiently and maintain consistency across the codebase.

## 📋 Features

### 🛠️ 1. i18next-parser Integration
- **Automatic key detection**: Scans source code for `ctx.t()` calls
- **Missing key addition**: Adds keys that are used in code but missing from translation files
- **Unused key removal**: Removes keys that are no longer used in code
- **Multi-locale support**: Handles both English (en) and Persian (fa) locales

### 🔍 2. Duplicate Detection
- **Value-based detection**: Identifies keys with identical values
- **Comprehensive reporting**: Shows all duplicate values and their associated keys
- **Non-destructive**: Only reports issues, doesn't auto-fix

### 📊 3. Translation Analytics
- **Usage statistics**: Tracks total keys, empty keys, duplicates, unused keys, missing keys
- **Code analysis**: Extracts translation keys from source code
- **Gap analysis**: Identifies missing translations

## 🚀 Usage

### Basic Commands

```bash
# Sync translations with code
pnpm run i18n:sync

# Check for duplicate values
pnpm run i18n:check-duplicates

# Comprehensive i18n management (recommended)
pnpm run i18n:manage
```

### Command Details

#### `pnpm run i18n:sync`
- Runs i18next-parser to sync translation files with code
- Adds missing keys found in code
- Removes unused keys (when `keepRemoved: false`)
- Updates both `en` and `fa` locales

#### `pnpm run i18n:check-duplicates`
- Analyzes English translation file for duplicate values
- Reports all duplicates with their keys
- Helps identify redundant translations

#### `pnpm run i18n:manage`
- **Comprehensive analysis**: Provides detailed statistics
- **Duplicate detection**: Shows all duplicate values
- **Automatic sync**: Runs i18next-parser after analysis
- **One-stop solution**: Recommended for regular maintenance

## 📁 File Structure

```
project/
├── i18next-parser.config.js    # Parser configuration
├── locales/
│   ├── en/
│   │   └── translation.json    # English translations
│   └── fa/
│       └── translation.json    # Persian translations
└── scripts/
    ├── check-i18n-duplicates.ts # Duplicate detection
    └── i18n-manager.ts         # Comprehensive management
```

## ⚙️ Configuration

### i18next-parser.config.js
```javascript
module.exports = {
  locales: ['en', 'fa'],
  defaultNamespace: 'translation',
  output: 'locales/$LOCALE/$NAMESPACE.json',
  input: ['src/**/*.{ts,tsx}'],
  keySeparator: false,
  namespaceSeparator: false,
  keepRemoved: false, // Remove unused keys
  verbose: true,
  // Function detection
  func: {
    list: ['t', 'ctx.t'],
    extensions: ['.ts', '.tsx']
  }
};
```

## 📊 Translation Statistics

The management system provides detailed analytics:

- **Total keys**: Number of translation keys
- **Empty keys**: Keys with empty values
- **Duplicate values**: Number of duplicate values found
- **Unused keys**: Keys in translation but not in code
- **Missing keys**: Keys in code but not in translation

## 🔧 Best Practices

### 1. Regular Maintenance
```bash
# Run weekly to keep translations in sync
pnpm run i18n:manage
```

### 2. Before Releases
```bash
# Check for issues before deployment
pnpm run i18n:check-duplicates
pnpm run i18n:sync
```

### 3. Code Guidelines
- Always use `ctx.t('key')` for user-facing strings
- Use descriptive key names (e.g., `🏠 <b>Create Poker Room</b>`)
- Keep translations organized in logical groups
- Avoid hardcoded strings in code

### 4. Translation Structure
```json
{
  "bot": {
    "start": {
      "title": "🎮 GameHub Bot",
      "description": "Welcome to GameHub!"
    },
    "poker": {
      "room": {
        "create": {
          "title": "Create Poker Room"
        }
      }
    }
  }
}
```

## 🚨 Common Issues

### 1. Empty Values
- **Cause**: Keys added by parser but not manually translated
- **Solution**: Fill in missing translations manually

### 2. Duplicate Values
- **Cause**: Same text used for different contexts
- **Solution**: Review and differentiate translations

### 3. Missing Keys
- **Cause**: New code using keys not in translation files
- **Solution**: Run `pnpm run i18n:sync` to add missing keys

### 4. Unused Keys
- **Cause**: Old translations no longer used in code
- **Solution**: Review and remove if confirmed unused

## 📈 Monitoring

### Weekly Tasks
1. Run `pnpm run i18n:manage`
2. Review duplicate values
3. Fill in empty translations
4. Remove confirmed unused keys

### Before Releases
1. Run `pnpm run i18n:check-duplicates`
2. Resolve any duplicate values
3. Ensure all keys have proper translations
4. Test with both locales

## 🔄 Workflow

### For New Features
1. Add translation keys in code using `ctx.t('key')`
2. Run `pnpm run i18n:sync` to add keys to translation files
3. Fill in English translations
4. Add Persian translations
5. Test both locales

### For Bug Fixes
1. Update code as needed
2. Run `pnpm run i18n:manage` to check for issues
3. Update translations if needed
4. Test changes

## 📝 Notes

- The system preserves existing translations when possible
- Backup files are created as `translation_old.json`
- The parser detects `ctx.t()` function calls automatically
- Both English and Persian locales are managed simultaneously
- Empty values are reported but not automatically filled

## 🎯 Goals

✅ **Unused translations removed**  
✅ **Missing keys added**  
✅ **Duplicate values identified**  
✅ **No hardcoded strings in code**  
✅ **Consistent translation structure**  
✅ **Multi-locale support**  
✅ **Automated maintenance**  

This system ensures your project maintains clean, consistent, and complete translations across all supported languages.
