// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import eslintPrettier from 'eslint-config-prettier'

export default withNuxt(
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'eol-last': ['error', 'always'],
    },
  },
  eslintPrettier,
)
