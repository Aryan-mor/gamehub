module.exports = {
  locales: ['en', 'fa'],
  defaultNamespace: 'translation',
  output: 'locales/$LOCALE/$NAMESPACE.json',
  input: ['src/**/*.{ts,tsx}'],
  keySeparator: false, // Use flat structure
  namespaceSeparator: ':',
  keepRemoved: true, // Don't remove existing translations
  verbose: true,
  // Add support for ctx.t() function calls
  contextSeparator: '_',
  // Parse function calls like ctx.t('key')
  func: {
    list: ['t', 'ctx.t'],
    extensions: ['.ts', '.tsx']
  },
  // Parse template literals
  trans: {
    component: 'Trans',
    i18nKey: 'i18nKey',
    defaultsKey: 'defaults',
    fallbackKey: function(ns, value) {
      return value;
    }
  },
  // Skip creating separate files for non-translation keys
  skipDefaultValues: true,
  // Use the key as default value for missing translations
  useKeysAsDefaultValue: true,
  // Only process translation namespace
  namespaces: ['translation']
};
