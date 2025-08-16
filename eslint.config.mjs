import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import i18nFlatPlugin from "./scripts/eslint-plugin-i18n-flat.js";
import routesPlugin from "./scripts/eslint-plugin-routes.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: [
      "src/**/*.test.ts",
      "src/**/*.spec.ts",
      "src/**/__tests__/**/*",
      "src/utils/cardImageService.ts",
      "src/actions/games/poker/room/create/buttonSets.ts",
    ],
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
      "i18n-flat": i18nFlatPlugin,
      "routes": routesPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Enforce max 500 lines per TS/TSX file (excluding blanks/comments)
      "max-lines": [
        "error",
        { max: 500, skipBlankLines: true, skipComments: true }
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "prefer-const": "error",
      "no-var": "error",
      // Disallow console.* usage across source files
      "no-console": ["error"],
      "routes/no-hardcoded-route-strings": "error",
      "i18n-flat/check-translation-keys": ["error", {
        localesPath: "locales",
        defaultLocale: "en"
      }],
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
    ignores: ["src/api/**/*", "src/**/*.test.ts", "src/**/*.spec.ts", "src/**/__tests__/**/*"],
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
  // Allow using supabase client in the dedicated cleanup script (admin-only scenario)
  {
    files: ["src/scripts/cleanSupabase.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/**/__tests__/**/*"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        // Don't use project for test files
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "routes": routesPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Tests: relax strict typing rules to reduce noisy warnings
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "prefer-const": "error",
      "no-var": "error",
      // Disable i18n checks for test files
      "i18n-flat/check-translation-keys": "off",
      "no-restricted-syntax": "off",
      // Enforce ROUTES.* usage in route assertions
      "routes/expect-route-constant": "error",
      // Allow require() style imports in tests
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // API layer: allow omitting explicit return types (cleaner DX), keep other rules
  {
    files: ["src/api/**/*.ts"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  {
    files: ["src/utils/cardImageService.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        // Don't use project for this file
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "prefer-const": "error",
      "no-var": "error",
      // Disable i18n checks for this file
      "i18n-flat/check-translation-keys": "off",
      "no-restricted-syntax": "off",
    },
  },
  // Rule for poker actions to prevent hardcoded strings
  {
    files: ["src/actions/games/poker/**/*.ts"],
    ignores: [
      "src/actions/games/poker/**/__tests__/**/*", 
      "src/actions/games/poker/compact-codes.ts", 
      "src/utils/cardImageService.ts", 
      "src/actions/games/poker/_utils/gameActionKeyboardGenerator.ts",
      // Reduced ignores: these files now use i18n keys consistently
      // "src/actions/games/poker/_utils/joinRoomKeyboardGenerator.ts",
      // "src/actions/games/poker/_utils/roomInfoHelper.ts",
      // "src/actions/games/poker/help/index.ts",
      "src/actions/games/poker/room/_button/buttonTemplates.ts",
      // "src/actions/games/poker/room/_middleware/active_game_redirect.ts",
      // Keep buttonSets ignored (pure mapping file)
      "src/actions/games/poker/room/create/buttonSets.ts",
      // Enable i18n checks for create flow files
      // "src/actions/games/poker/room/create/form.ts",
      // "src/actions/games/poker/room/create/index.ts",
      // "src/actions/games/poker/room/create/textHandler.ts",
      // "src/actions/games/poker/room/info/index.ts",
      // Reduced ignores: enable i18n checks for these compliant files
      // "src/actions/games/poker/room/join/index.ts",
      // "src/actions/games/poker/room/kick/index.ts",
      // "src/actions/games/poker/room/leave/index.ts",
      // "src/actions/games/poker/room/list/index.ts",
      // "src/actions/games/poker/room/share/index.ts",
      // "src/actions/games/poker/room/start/index.ts",
      // "src/actions/games/poker/services/roomMessageService.ts",
      // "src/actions/games/poker/start/index.ts"
    ],
  },
  // Rule for other files to prevent hardcoded strings
  {
    files: ["src/**/*.ts"],
    ignores: [
      "src/bot.ts",
      "src/modules/core/buttonHelpers.ts",
      "src/modules/core/interfaceHelpers.ts",
      // messageUpdater removed
      "src/plugins/index.ts",
      "src/plugins/keyboard.ts",
      "src/plugins/poker.ts",
      "src/plugins/utils.ts",
      "src/utils/cardImageService.ts",
      "src/actions/games/poker/room/create/buttonSets.ts",
      "src/**/*.test.ts",
      "src/**/*.spec.ts",
      "src/**/__tests__/**/*",
    ],
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
      // Smart-reply uses dynamic runtime shapes; relax strictness here
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  {
    files: ["src/plugins/context.ts"],
    rules: {
      // Context plugin integrates with grammy Context typing; allow any for adapters
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
