// @ts-check
import eslintPrettier from 'eslint-config-prettier';

import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  {
    ignores: ['./coverage/**'],
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'eol-last': ['error', 'always'],
    },
  },
  eslintPrettier
);
