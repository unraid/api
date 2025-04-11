import eslint from '@eslint/js';
// @ts-ignore-error No Declaration For This Plugin
import importPlugin from 'eslint-plugin-import';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import prettier from 'eslint-plugin-prettier';
import vuePlugin from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
  files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
  languageOptions: {
    parser: require('vue-eslint-parser'),
    parserOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      browser: true,
      window: true,
      document: true,
      es2022: true,
      HTMLElement: true,
    },
  },
  plugins: {
    'no-relative-import-paths': noRelativeImportPaths,
    prettier: prettier,
    import: importPlugin,
    vue: vuePlugin,
  },
  rules: {
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
    // Vue specific rules
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
    // Allow empty object types and any types in Vue component definitions
    '@typescript-eslint/no-explicit-any': [
      'error',
      {
        ignoreRestArgs: true,
        fixToUnknown: false,
      },
    ],
  },

  ignores: ['src/graphql/generated/client/**/*'],
});
