/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
module.exports = {
    trailingComma: 'es5',
    tabWidth: 4,
    semi: true,
    singleQuote: true,
    printWidth: 105,
    plugins: ['@ianvs/prettier-plugin-sort-imports'],
    // decorators-legacy lets the import sorter transform files with decorators
    importOrderParserPlugins: ['typescript', 'decorators-legacy'],
    importOrder: [
        /**----------------------
         *    Nest.js & node.js imports
         *------------------------**/
        '<TYPES>^@nestjs(/.*)?$',
        '^@nestjs(/.*)?$', // matches imports starting with @nestjs
        '<TYPES>^(node:)',
        '<BUILTIN_MODULES>', // Node.js built-in modules
        '',
        /**----------------------
         *    Third party packages
         *------------------------**/
        '<TYPES>',
        '<THIRD_PARTY_MODULES>', // Imports not matched by other special words or groups.
        '',
        /**----------------------
         *    Application Code
         *------------------------**/
        '<TYPES>^@app(/.*)?$', // matches type imports starting with @app
        '^@app(/.*)?$',
        '',
        '<TYPES>^[.]',
        '^[.]', // relative imports
    ],
};
