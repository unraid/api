import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import vuePlugin from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
// Import vue-eslint-parser as an ESM import
import vueEslintParser from 'vue-eslint-parser';

// Common rules shared across file types
const commonRules = {
  '@typescript-eslint/consistent-type-imports': [
    'error',
    {
      prefer: 'type-imports',
      disallowTypeAnnotations: false, // Allow type annotations in import expressions
    },
  ],
  '@typescript-eslint/no-unused-vars': ['off'],
  'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 1 }],
  'no-relative-import-paths/no-relative-import-paths': [
    'error',
    { allowSameFolder: false, rootDir: 'src', prefix: '@' },
  ],
  'no-restricted-globals': [
    'error',
    {
      name: '__dirname',
      message: 'Use import.meta.url instead of __dirname in ESM',
    },
    {
      name: '__filename',
      message: 'Use import.meta.url instead of __filename in ESM',
    },
  ],
  'eol-last': ['error', 'always'],
  '@typescript-eslint/no-explicit-any': [
    'error',
    {
      ignoreRestArgs: true,
      fixToUnknown: false,
    },
  ],
};

// Vue-specific rules
const vueRules = {
  'vue/multi-word-component-names': 'off',
  // Nuxt UI components are auto-imported by the @nuxt/ui vite plugin
  'vue/no-undef-components': [
    'error',
    {
      ignorePatterns: [
        '^U[A-Z].*', // All Nuxt UI components (UButton, UCard, etc.)
        'client-only', // Vue/Nuxt built-in
      ],
    },
  ],
  'vue/html-self-closing': [
    'error',
    {
      html: {
        void: 'always',
        normal: 'always',
        component: 'always',
      },
    },
  ],
  'vue/component-name-in-template-casing': ['error', 'PascalCase'],
  'vue/component-definition-name-casing': ['error', 'PascalCase'],
  'vue/no-unsupported-features': [
    'error',
    {
      version: '^3.5.0',
    },
  ],
  'vue/no-unused-properties': [
    'error',
    {
      groups: ['props'],
      deepData: false,
    },
  ],
};

// Common language options
const commonLanguageOptions = {
  ecmaVersion: 'latest',
  sourceType: 'module',
};

// No need to manually define globals - using globals package

export default [
  // Base config from recommended configs
  eslint.configs.recommended,
  ...tseslint.configs.recommended, // TypeScript Files (.ts)
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ...commonLanguageOptions,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'no-relative-import-paths': noRelativeImportPaths,
      import: importPlugin,
    },
    rules: {
      ...commonRules,
    },
  }, // Vue Files (.vue)
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueEslintParser,
      parserOptions: {
        ...commonLanguageOptions,
        parser: tseslint.parser,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'no-relative-import-paths': noRelativeImportPaths,
      import: importPlugin,
      vue: vuePlugin,
    },
    rules: {
      ...commonRules,
      ...vueRules,
    },
  }, // Ignores
  {
    ignores: [
      'src/graphql/generated/client/**/*',
      'src/global.d.ts',
      'eslint.config.ts',
      '.output/**/*',
      'dist/**/*',
      '.nuxt/**/*',
      'node_modules/**/*',
      'coverage/**/*',
    ],
  },
  // JavaScript files
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ...commonLanguageOptions,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'no-relative-import-paths': noRelativeImportPaths,
    },
    rules: {
      ...commonRules,
      '@typescript-eslint/no-unused-vars': 'off', // Use regular no-unused-vars for JS
      'no-unused-vars': ['error'],
      '@typescript-eslint/consistent-type-imports': 'off', // Not applicable to JS
      '@typescript-eslint/no-explicit-any': 'off', // Not applicable to JS
    },
  },
  // Node.js files (config files, scripts)
  {
    files: ['**/*.config.ts', '**/*.config.js', '**/*.config.mjs', 'scripts/**/*', 'vite-plugin-*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-restricted-globals': 'off', // Allow __dirname in config files
      // Keep no-require-imports enabled to enforce pure ESM
    },
  },
  // Disable no-relative-import-paths specifically for vite.config.ts
  {
    files: ['vite.config.ts'],
    rules: {
      'no-relative-import-paths/no-relative-import-paths': 'off', // Allow relative imports in vite.config.ts for local plugins
    },
  },
];
