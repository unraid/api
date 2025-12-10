import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 1 }],
            'eol-last': ['error', 'always'],
        },
    },
    {
        ignores: ['node_modules/**/*', 'dist/**/*'],
    }
);
