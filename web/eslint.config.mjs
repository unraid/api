// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";
import eslintPrettier from "eslint-config-prettier";

export default withNuxt(
  {
    rules: {
      "vue/multi-word-component-names": "off", // turn off to allow web component parents to work and not trigger errors
      "vue/no-v-html": "off",
    },
  },
  eslintPrettier
);
