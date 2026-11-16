import tseslint from 'typescript-eslint';

import requireGraphqlAuthorization from './require-graphql-authorization.mjs';

export const graphqlAuthorizationConfig = [
    {
        files: ['**/*.ts'],
        // Tests include deliberately unguarded fixtures; templates are not deployed handlers.
        ignores: [
            '**/*.spec.ts',
            '**/*.test.ts',
            '**/__test__/**',
            '**/__tests__/**',
            '**/templates/**',
        ],
        languageOptions: { parser: tseslint.parser },
        plugins: {
            'unraid-auth': { rules: { 'require-graphql-authorization': requireGraphqlAuthorization } },
        },
        rules: { 'unraid-auth/require-graphql-authorization': 'error' },
    },
];

// This focused pass does not evaluate the existing style-rule suppressions.
export default [
    ...graphqlAuthorizationConfig,
    {
        plugins: { '@typescript-eslint': tseslint.plugin },
        linterOptions: { reportUnusedDisableDirectives: 'off' },
    },
];
