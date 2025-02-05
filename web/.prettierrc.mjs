/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: 'es5',
  tabWidth: 2,
  printWidth: 105,
  singleQuote: true,
  plugins: ['prettier-plugin-tailwindcss', '@ianvs/prettier-plugin-sort-imports'],
  // decorators-legacy lets the import sorter transform files with decorators
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],
  importOrder: [
    /**----------------------
     *    Style imports
     *------------------------**/
    '^tailwindcss',
    '^~/assets',
    '',
    /**----------------------
     *    Vue & Framework
     *------------------------**/
    '^vue$',
    '^vue-i18n$',
    '^vue-router$',
    '^pinia$',
    '^@vue',
    '^@nuxt',
    '',
    /**----------------------
     *    Third party
     *------------------------**/
    '^@heroicons',
    '^@unraid/ui',
    '<THIRD_PARTY_MODULES>',
    '',
    /**----------------------
     *    Types
     *------------------------**/
    '<TYPES>^@/types',
    '<TYPES>^[.]',
    '<TYPES>',
    '',
    /**----------------------
     *    Local imports
     *------------------------**/
    '^~/components',
    '^~/composables',
    '^~/store',
    '^~/utils',
    '^[.]',
  ],
};

export default config;
