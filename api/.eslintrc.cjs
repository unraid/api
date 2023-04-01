/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    plugins: [
        '@typescript-eslint/eslint-plugin',
        'unused-imports',
        'eslint-plugin-unicorn',
    ],
    ignorePatterns: ['src/graphql/generated/**/*.ts', '*.test.ts'],
    parser: '@typescript-eslint/parser',
    rules: {
        '@typescript-eslint/no-redundant-type-constituents': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/consistent-type-imports': [
            'warn',
            { fixStyle: 'inline-type-imports' },
        ],
        'unicorn/numeric-separators-style': [
            'error',
            { number: { minimumDigits: 0, groupLength: 3 } },
        ],
        'import/no-cycle': 'off', // Change this to "error" to find circular imports
        '@typescript-eslint/no-use-before-define': ['error'],
    },
    overrides: [
        {
            files: ['*.ts'],
            extends: [
                'eslint:recommended',
                'plugin:@typescript-eslint/recommended',
            ],
            parserOptions: {
                project: true,
                tsconfigRootDir: __dirname,
            },
            rules: {
                '@typescript-eslint/no-explicit-any': 'off',
            }
        },
    ],
};
