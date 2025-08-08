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
  },
};


