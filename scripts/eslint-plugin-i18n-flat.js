const fs = require('fs');
const path = require('path');

/**
 * ESLint plugin for checking flat translation keys
 */
module.exports = {
  meta: {
    name: 'i18n-flat',
    version: '1.0.0',
  },
  rules: {
    'check-translation-keys': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Check for missing and unused translation keys in flat translation structure',
          category: 'Best Practices',
          recommended: true,
        },
        schema: [
          {
            type: 'object',
            properties: {
              localesPath: { type: 'string' },
              defaultLocale: { type: 'string' },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const options = context.options[0] || {};
        const localesPath = options.localesPath || 'locales';
        const defaultLocale = options.defaultLocale || 'en';
        
        // Cache for translation keys
        let translationKeys = null;
        let usedKeys = new Set();
        
        function getTranslationKeys() {
          if (translationKeys) return translationKeys;
          
          try {
            const enPath = path.join(process.cwd(), localesPath, defaultLocale, 'translation.json');
            const enContent = fs.readFileSync(enPath, 'utf8');
            const enTranslations = JSON.parse(enContent);
            translationKeys = new Set(Object.keys(enTranslations));
            return translationKeys;
          } catch (error) {
            context.report({
              loc: { line: 1, column: 1 },
              message: `Failed to load translation file: ${error.message}`,
            });
            return new Set();
          }
        }
        
        function extractKeyFromCall(node) {
          if (node.type === 'Literal' && typeof node.value === 'string') {
            return node.value;
          }
          if (node.type === 'TemplateLiteral' && node.quasis.length === 1) {
            return node.quasis[0].value.raw;
          }
          return null;
        }
        
        return {
          CallExpression(node) {
            // Check for ctx.t() calls
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'ctx' &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 't' &&
              node.arguments.length > 0
            ) {
              const key = extractKeyFromCall(node.arguments[0]);
              if (key) {
                usedKeys.add(key);
                
                const availableKeys = getTranslationKeys();
                if (!availableKeys.has(key)) {
                  context.report({
                    node: node.arguments[0],
                    message: `Translation key "${key}" is missing from ${defaultLocale}/translation.json`,
                  });
                }
              }
            }
            
            // Check for t() calls (direct function calls)
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 't' &&
              node.arguments.length > 0
            ) {
              const key = extractKeyFromCall(node.arguments[0]);
              if (key) {
                usedKeys.add(key);
                
                const availableKeys = getTranslationKeys();
                if (!availableKeys.has(key)) {
                  context.report({
                    node: node.arguments[0],
                    message: `Translation key "${key}" is missing from ${defaultLocale}/translation.json`,
                  });
                }
              }
            }
          },
          
          'Program:exit'() {
            // Optionally check for unused keys only when explicitly enabled
            const checkUnused = process.env.I18N_CHECK_UNUSED === 'true';
            if (!checkUnused) return;

            if (usedKeys.size > 0) {
              const availableKeys = getTranslationKeys();
              const unusedKeys = Array.from(availableKeys).filter(key => !usedKeys.has(key));
              if (unusedKeys.length > 0) {
                context.report({
                  loc: { line: 1, column: 1 },
                  message: `Unused translation keys found: ${unusedKeys.slice(0, 10).join(', ')}${unusedKeys.length > 10 ? ` and ${unusedKeys.length - 10} more` : ''}`,
                });
              }
            }
          },
        };
      },
    },
  },
};
