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
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='ctx'][property.name='reply']",
          message: "Use ctx.replySmart() instead of ctx.reply()",
        },
        {
          selector: "MemberExpression[object.name='ctx'][property.name='editMessageText']",
          message: "Use ctx.replySmart() instead of ctx.editMessageText()",
        },
        // Prevent hardcoded user-facing strings in ctx.replySmart first parameter
        {
          "selector": "CallExpression[callee.object.name='ctx'][callee.property.name='replySmart'] > Literal:first-child",
          "message": "Use ctx.t() for user-facing strings in ctx.replySmart(). Example: ctx.replySmart(ctx.t('bot.start.welcome'))"
        },
        // Prevent hardcoded user-facing strings in button text properties
        {
          "selector": "Property[key.name='text'] > Literal[value=/^.+$/]",
          "message": "Use ctx.t() for all button text. Example: text: ctx.t('bot.poker.actions.fold')"
        }
      ],
    },
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: ["src/api/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/supabase"],
              message: "Do not import supabase directly outside of /api. Use the API client instead."
            }
          ]
        }
      ]
    },
  },

  // New rule for card-image-service to prevent hardcoded user-facing strings
  {
    files: ["card-image-service/src/**/*.ts"],
    ignores: ["card-image-service/src/**/*.test.ts", "card-image-service/src/**/*.spec.ts", "card-image-service/src/**/__tests__/**/*"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: "./card-image-service/tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
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
  // Rule for poker actions to prevent hardcoded strings
  {
    files: ["src/actions/games/poker/**/*.ts"],
    ignores: ["src/actions/games/poker/**/__tests__/**/*", "src/actions/games/poker/compact-codes.ts", "src/utils/cardImageService.ts", "src/actions/games/poker/_utils/gameActionKeyboardGenerator.ts"],
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
      // Prevent hardcoded user-facing strings in ctx.replySmart first parameter
      "no-restricted-syntax": [
        "error",
        {
          "selector": "CallExpression[callee.object.name='ctx'][callee.property.name='replySmart'] > Literal:first-child",
          "message": "Use ctx.t() for user-facing strings in ctx.replySmart(). Example: ctx.replySmart(ctx.t('bot.start.welcome'))"
        },
        // Prevent hardcoded user-facing strings in button text properties
        {
          "selector": "Property[key.name='text'] > Literal[value=/^.+$/]",
          "message": "Use ctx.t() for all button text. Example: text: ctx.t('bot.poker.actions.fold')"
        }
      ]
    },
  },
  {
    files: ["src/plugins/smart-reply.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
];

export default eslintConfig;
