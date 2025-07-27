// @ts-check

import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  {
    ignores: ['./coverage/**'],
    languageOptions: {
      globals: {
        // Node.js globals
        NodeJS: 'readonly',
        // Browser APIs
        EventListenerOrEventListenerObject: 'readonly',
        HTMLCollectionOf: 'readonly',
        // webGUI-specific globals
        openPlugin: 'readonly',
        openBox: 'readonly',
        openChanges: 'readonly',
        FeedbackButton: 'readonly',
        flashBackup: 'readonly',
        confirmDowngrade: 'readonly',
        downloadDiagnostics: 'readonly',
        // Nuxt globals
        defineNuxtConfig: 'readonly',
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      /* 'vue/no-undef-components': [
        'error',
        {
          ignorePatterns: [
            // Custom Elements (components ending with Ce)
            '.*Ce$',
            // Web Components (components starting with unraid-)
            '^unraid-.*',
            // Client-only component
            '^client-only$',
            // Other common components
            '^ClientOnly$',
            '^BrandLogo$',
            '^ColorSwitcherCe$',
            '^DummyServerSwitcher$',
            '^HeaderOsVersionCe$',
            '^ConnectSettingsCe$',
          ],
        },
      ], */
      'eol-last': ['error', 'always'],
      
      // TypeScript rules for unused variables and undefined variables
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      'no-undef': 'error',
    },
  },
);
