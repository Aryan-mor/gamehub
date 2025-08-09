export default {
  rules: {
    'no-hardcoded-route-strings': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow hardcoded dotted route strings; use ROUTES.* or ActionRoute instead',
        },
        schema: [],
        messages: {
          avoidHardcoded: "Avoid hardcoded dotted route strings. Use ROUTES.* or a typed ActionRoute instead.",
        },
      },
      create(context) {
        function isDottedRouteLiteral(node) {
          return (
            node &&
            node.type === 'Literal' &&
            typeof node.value === 'string' &&
            /^(?:[a-zA-Z0-9_]+\.)+[a-zA-Z0-9_]+$/.test(node.value)
          );
        }

        return {
          // ctx.keyboard.buildCallbackData('<route>', ...)
          CallExpression(node) {
            try {
              const callee = node.callee;
              if (
                callee &&
                ((callee.type === 'MemberExpression' && callee.property && callee.property.type === 'Identifier' && callee.property.name === 'buildCallbackData') ||
                  (callee.type === 'Identifier' && callee.name === 'buildCallbackData'))
              ) {
                const firstArg = node.arguments && node.arguments[0];
                if (isDottedRouteLiteral(firstArg)) {
                  context.report({ node: firstArg, messageId: 'avoidHardcoded' });
                }
              }
            } catch {
              // ignore
            }
          },

          // { action: '<route>' }
          Property(node) {
            try {
              if (
                node.key && node.key.type === 'Identifier' && node.key.name === 'action' &&
                node.value && isDottedRouteLiteral(node.value)
              ) {
                context.report({ node: node.value, messageId: 'avoidHardcoded' });
              }
            } catch {
              // ignore
            }
          },
        };
      },
    },

    'expect-route-constant': {
      meta: {
        type: 'suggestion',
        docs: {
          description: "Require using ROUTES.* constant in expectActionsToContainRoute/NotToContainRoute calls",
        },
        schema: [],
        messages: {
          useRoutesConst: "Use ROUTES.* (from '@/modules/core/routes.generated') instead of a string literal here.",
        },
      },
      create(context) {
        function isTargetExpect(callee) {
          if (!callee) return false;
          if (callee.type === 'Identifier') {
            return callee.name === 'expectActionsToContainRoute' || callee.name === 'expectActionsNotToContainRoute';
          }
          if (callee.type === 'MemberExpression' && callee.property?.type === 'Identifier') {
            return callee.property.name === 'expectActionsToContainRoute' || callee.property.name === 'expectActionsNotToContainRoute';
          }
          return false;
        }

        return {
          CallExpression(node) {
            try {
              if (!isTargetExpect(node.callee)) return;
              const args = node.arguments || [];
              if (args.length < 2) return;
              const routeArg = args[1];
              if (routeArg && routeArg.type === 'Literal' && typeof routeArg.value === 'string') {
                context.report({ node: routeArg, messageId: 'useRoutesConst' });
              }
            } catch {
              // ignore
            }
          },
        };
      },
    },
  },
};


