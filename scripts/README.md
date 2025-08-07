# Translation Scripts

This directory contains scripts for managing and cleaning translation files.

## 🔄 Flatten Translations Script

### `flatten-translations.js`

A script to convert nested translation objects to flat structure using dot notation.

#### Features

- 🔄 **Converts nested objects** to flat key-value pairs
- 📝 **Uses dot notation** for nested keys (e.g., "bot.poker.room.create")
- 💾 **Creates backups** before making changes
- 📊 **Detailed reporting** of flattened keys
- 🌍 **Multi-locale support** - processes all locale directories
- ✅ **Preserves existing flat translations**

#### Usage

```bash
# Run the script
node scripts/flatten-translations.js

# Or make it executable and run directly
chmod +x scripts/flatten-translations.js
./scripts/flatten-translations.js
```

#### What it does

1. **Scans** all `locales/*/translation.json` files
2. **Detects** nested objects in translation files
3. **Converts** nested structure to flat using dot notation
4. **Creates backups** as `*_backup_before_flatten.json`
5. **Preserves** existing flat translations
6. **Saves** the flattened file with proper formatting

#### Example Output

```
🔄 Translation Flattener
========================
This script will convert nested translation objects to flat structure
using dot notation for nested keys (e.g., "bot.poker.room.create")

📂 Found 2 translation file(s):
  - /path/to/locales/en/translation.json
  - /path/to/locales/fa/translation.json

📁 Processing: /path/to/locales/en/translation.json
  🔍 Found nested objects, flattening...
  📊 Original keys: 100 → Flattened keys: 120
  🔄 Flattened nested keys:
    - "bot" → "bot.*"
    - "errors" → "errors.*"
  💾 Backup created: /path/to/locales/en/translation_backup_before_flatten.json
  ✅ Successfully flattened translation file

📊 Summary:
===========
📁 Files processed: 2
❌ Files with errors: 0
🔄 Total keys flattened: 240
📊 Total original keys: 200
📊 Total cleaned keys: 240

✅ Flattening completed successfully!
💾 Backups created for modified files
📝 Nested keys are now using dot notation
```

#### When to Use

- When you have nested translation objects that need to be flattened
- Before running the duplicate key cleaner
- When migrating from nested to flat translation structure
- When you want to use dot notation for translation keys

## 🔧 Complete Translation Fixer

### `fix-translations.js`

A comprehensive script that combines both flattening and cleaning operations in one go.

#### Features

- 🔄 **Flattens nested objects** to flat structure using dot notation
- 🧹 **Removes duplicate keys** while preserving first occurrence
- 💾 **Creates backups** at each step for safety
- 📊 **Detailed reporting** of all operations
- 🌍 **Multi-locale support** - processes all locale directories
- ✅ **Complete solution** - handles both flattening and cleaning

#### Usage

```bash
# Run the complete fixer
node scripts/fix-translations.js

# Or make it executable and run directly
chmod +x scripts/fix-translations.js
./scripts/fix-translations.js
```

#### What it does

1. **Step 1**: Flattens any nested objects to flat structure
2. **Step 2**: Removes any duplicate keys
3. **Creates backups** at each step
4. **Validates** the final JSON
5. **Reports** detailed statistics

#### Example Output

```
🔧 Translation Fixer - Complete Solution
=======================================
This script will:
1. Flatten any nested translation objects
2. Remove any duplicate keys
3. Create backups at each step

📂 Found 2 translation file(s):
  - /path/to/locales/en/translation.json
  - /path/to/locales/fa/translation.json

📁 Processing: /path/to/locales/en/translation.json
  🔄 Step 1: Flattening nested objects...
  💾 Step 1 backup created: /path/to/locales/en/translation_backup_before_flatten.json
  ✅ Flattened 20 nested keys
  🧹 Step 2: Removing duplicate keys...
  💾 Step 2 backup created: /path/to/locales/en/translation_backup_before_clean.json
  ✅ Removed 5 duplicate keys
  📊 Summary: 100 → 115 keys

📊 Final Summary:
=================
📁 Files processed: 2
❌ Files with errors: 0
🔄 Total keys flattened: 40
🗑️  Total duplicate keys removed: 10
📊 Total original keys: 200
📊 Total final keys: 230

✅ Translation files fixed successfully!
💾 Backups created for each step
📝 Files are now flat and clean
```

#### When to Use

- **Recommended for most cases** - handles both flattening and cleaning
- When you want to ensure your translation files are completely clean
- Before deploying to production
- When migrating translation files
- For regular maintenance of translation files

## 🧹 Clean Translations Script

### `clean-translations.js`

A script to remove duplicate keys from translation.json files while preserving the first occurrence of each key.

#### Features

- 🔍 **Detects duplicates** by parsing JSON as text first (before JSON.parse() removes them)
- 💾 **Creates backups** before making any changes
- 📊 **Detailed reporting** of removed duplicates with line numbers
- 🌍 **Multi-locale support** - processes all locale directories
- ✅ **JSON validation** - ensures cleaned files are valid JSON
- 🎯 **Preserves formatting** - maintains proper JSON indentation

#### Usage

```bash
# Run the script
node scripts/clean-translations.js

# Or make it executable and run directly
chmod +x scripts/clean-translations.js
./scripts/clean-translations.js
```

#### What it does

1. **Scans** all `locales/*/translation.json` files
2. **Detects** duplicate keys by parsing as text
3. **Reports** found duplicates with line numbers
4. **Creates backups** as `*_backup_before_cleanup.json`
5. **Removes** duplicate keys (keeps first occurrence)
6. **Validates** the cleaned JSON
7. **Saves** the cleaned file with proper formatting

#### Example Output

```
🧹 Translation Duplicate Key Cleaner
====================================
This script will remove duplicate keys from translation.json files
while preserving the first occurrence of each key.

📂 Found 2 translation file(s):
  - /path/to/locales/en/translation.json
  - /path/to/locales/fa/translation.json

📁 Processing: /path/to/locales/en/translation.json
  🔍 Found 5 duplicate keys:
    Line 25: "🎴 Poker"
    Line 30: "🏠 Create Room"
    Line 35: "❓ Help"
    Line 40: "🔙 Back"
    Line 45: "🎴 Poker"
  🗑️  Removing duplicate key: "🎴 Poker"
  🗑️  Removing duplicate key: "🏠 Create Room"
  🗑️  Removing duplicate key: "❓ Help"
  🗑️  Removing duplicate key: "🔙 Back"
  🗑️  Removing duplicate key: "🎴 Poker"
  💾 Backup created: /path/to/locales/en/translation_backup_before_cleanup.json
  ✅ Removed 5 duplicate keys
  📊 Original: 100 keys → Cleaned: 95 keys

📊 Summary:
===========
📁 Files processed: 2
❌ Files with errors: 0
🗑️  Total duplicate keys removed: 5
📊 Total original keys: 200
📊 Total cleaned keys: 195

✅ Cleanup completed successfully!
💾 Backups created for modified files
📝 You can restore from backup files if needed
```

#### Backup Files

The script creates backup files with the naming pattern:
- `translation_backup_before_cleanup.json`

These backups contain the original content before any changes were made. You can restore from these files if needed.

#### Safety Features

- ✅ **Backup creation** before any modifications
- ✅ **JSON validation** after cleanup
- ✅ **Error handling** for malformed files
- ✅ **Detailed logging** of all operations
- ✅ **Non-destructive** - original files are preserved in backups

#### When to Use

- After merging translation files
- When adding new translations manually
- Before deploying to production
- During code reviews of translation files
- When you notice duplicate keys in your translation files

#### Troubleshooting

If you encounter errors:

1. **Check file permissions** - ensure the script can read/write translation files
2. **Validate JSON** - ensure your translation files are valid JSON
3. **Restore from backup** - use the backup files if something goes wrong
4. **Check file encoding** - ensure files are UTF-8 encoded

## Other Scripts

### `remove-duplicate-keys.js` (Legacy)

The original script that used JSON.parse() to detect duplicates. This approach doesn't work well because JSON.parse() automatically removes duplicate keys.

### `remove-duplicate-keys-advanced.js` (Development)

An intermediate version used during development and testing.
