import type { Linter } from 'eslint';
import eslint from '@eslint/js';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import tseslint from 'typescript-eslint';

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
    plugins: {
        'no-relative-import-paths': noRelativeImportPaths,
    },
    rules: {
        '@typescript-eslint/no-redundant-type-constituents': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        'no-use-before-define': ['off'],
        'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 1 }],
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
        'import/no-unresolved': 'off',
        'import/extensions': 'off',
        'import/no-absolute-path': 'off',
        'import/prefer-default-export': 'off',
        'no-relative-import-paths/no-relative-import-paths': [
            'error',
            { allowSameFolder: false, rootDir: 'src', prefix: '@app' },
        ],
    },
});
