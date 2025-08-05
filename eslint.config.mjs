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
  // New rule specifically for poker actions
  {
    files: ["src/actions/games/poker/**/*.ts"],
    ignores: ["src/actions/games/poker/compact-codes.ts", "src/actions/games/poker/**/__tests__/**/*"],
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
      // Prevent hardcoded poker action codes - only allow POKER_ACTIONS constants
      "no-restricted-syntax": [
        "error",
        {
          "selector": "Literal[value='gpcall']",
          "message": "Do not use hardcoded poker action codes. Use POKER_ACTIONS.CALL instead of 'gpcall'"
        },
        {
          "selector": "Literal[value='gpchk']",
          "message": "Do not use hardcoded poker action codes. Use POKER_ACTIONS.CHECK instead of 'gpchk'"
        },
        {
          "selector": "Literal[value='gpfld']",
          "message": "Do not use hardcoded poker action codes. Use POKER_ACTIONS.FOLD instead of 'gpfld'"
        },
        {
          "selector": "Literal[value='gprse']",
          "message": "Do not use hardcoded poker action codes. Use POKER_ACTIONS.RAISE instead of 'gprse'"
        },
        {
          "selector": "Literal[value='gpall']",
          "message": "Do not use hardcoded poker action codes. Use POKER_ACTIONS.ALL_IN instead of 'gpall'"
        },
        {
          "selector": "Literal[value='gpref']",
          "message": "Do not use hardcoded poker action codes. Use POKER_ACTIONS.REFRESH_GAME instead of 'gpref'"
        },
        {
          "selector": "Literal[value='gpl']",
          "message": "Do not use hardcoded poker action codes. Use POKER_ACTIONS.LEAVE_ROOM instead of 'gpl'"
        },
        {
          "selector": "Literal[value='gpsg']",
          "message": "Do not use hardcoded poker action codes. Use POKER_ACTIONS.START_GAME instead of 'gpsg'"
        }
      ]
    },
  },
  {
    files: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/**/__tests__/**/*.ts"],
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
