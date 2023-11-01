/* eslint-disable @typescript-eslint/no-var-requires */
const { readFileSync } = require('fs');
const { parse } = require('dotenv');

const envConfig = parse(readFileSync('.env'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

module.exports = {
  extends: ['@nuxtjs/eslint-config-typescript'],
  ignorePatterns: ['composables/gql/'],
  rules: {
    'comma-dangle': ['warn', 'only-multiline'],
    semi: ['error', 'always'],
    quotes: ['warn', 'single'],
    'no-console': (process.env.NODE_ENV === 'production' ? 'error' : 'off'),
    'no-debugger': (process.env.NODE_ENV === 'production' ? 'error' : 'off'),
    '@typescript-eslint/no-unused-vars': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'max-len': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/v-on-event-hyphenation': 'off',
    'vue/no-v-html': 'off',
    'no-fallthrough': 'off',
  }
};
