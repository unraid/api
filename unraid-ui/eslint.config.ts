// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import prettier from 'eslint-plugin-prettier';
import vuePlugin from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
// Import vue-eslint-parser as an ESM import
import vueEslintParser from 'vue-eslint-parser';

// Common rules shared across file types
const commonRules = {
  '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
  '@typescript-eslint/no-unused-vars': ['off'],
  'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 1 }],
  'no-relative-import-paths/no-relative-import-paths': [
    'error',
    { allowSameFolder: false, rootDir: 'src', prefix: '@' },
  ],
  'prettier/prettier': 'error',
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
      version: '^3.3.0',
    },
  ],
  'vue/no-undef-components': ['error'],
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

// Define globals separately
const commonGlobals = {
  window: 'readonly',
  document: 'readonly',
  console: 'readonly',
  Event: 'readonly',
  HTMLElement: 'readonly',
  HTMLInputElement: 'readonly',
  CustomEvent: 'readonly',
};

export default [// Base config from recommended configs
eslint.configs.recommended, ...tseslint.configs.recommended, // TypeScript Files (.ts)
{
  files: ['**/*.ts'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ...commonLanguageOptions,
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      ...commonGlobals
    },
  },
  plugins: {
    'no-relative-import-paths': noRelativeImportPaths,
    prettier: prettier,
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
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      ...commonGlobals
    },
  },
  plugins: {
    'no-relative-import-paths': noRelativeImportPaths,
    prettier: prettier,
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
  ],
}, ...storybook.configs["flat/recommended"]];
