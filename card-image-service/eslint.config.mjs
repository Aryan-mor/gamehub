import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/**/__tests__/**/*"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "prefer-const": "error",
      "no-var": "error",
      // Prevent hardcoded user-facing strings - only allow translation keys
      "no-restricted-syntax": [
        "error",
        {
          "selector": "Literal[value='🎴 Card Image Service Bot']",
          "message": "Do not use hardcoded user-facing strings. Use ctx.t('bot.start.title') instead"
        },
        {
          "selector": "Literal[value='This bot is used for generating and sending card images.']",
          "message": "Do not use hardcoded user-facing strings. Use ctx.t('bot.start.description') instead"
        },
        {
          "selector": "Literal[value='✅ Card Image Service is running']",
          "message": "Do not use hardcoded user-facing strings. Use ctx.t('bot.status.running') instead"
        },
        {
          "selector": "Literal[value='📊 Cache Statistics']",
          "message": "Do not use hardcoded user-facing strings. Use ctx.t('bot.cache.stats.title') instead"
        },
        {
          "selector": "Literal[value='Total entries']",
          "message": "Do not use hardcoded user-facing strings. Use ctx.t('bot.cache.stats.totalEntries') instead"
        },
        {
          "selector": "Literal[value='Expired entries']",
          "message": "Do not use hardcoded user-facing strings. Use ctx.t('bot.cache.stats.expiredEntries') instead"
        },
        {
          "selector": "Literal[value='🗑️ Cache cleared successfully']",
          "message": "Do not use hardcoded user-facing strings. Use ctx.t('bot.cache.cleared') instead"
        },
        {
          "selector": "Literal[value='❌ Error getting cache stats']",
          "message": "Do not use hardcoded user-facing strings. Use ctx.t('bot.cache.error.stats') instead"
        },
        {
          "selector": "Literal[value='❌ Error clearing cache']",
          "message": "Do not use hardcoded user-facing strings. Use ctx.t('bot.cache.error.clear') instead"
        }
      ]
    },
  },
  {
    files: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/**/__tests__/**/*"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
];

export default eslintConfig; 