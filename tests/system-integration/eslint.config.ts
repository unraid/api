import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        plugins: {
            unicorn,
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 1 }],
            'eol-last': ['error', 'always'],
            'unicorn/numeric-separators-style': [
                'error',
                {
                    number: {
                        minimumDigits: 5,
                        groupLength: 3,
                    },
                },
            ],
        },
    },
    {
        ignores: ['node_modules/**/*', 'dist/**/*'],
    }
);
