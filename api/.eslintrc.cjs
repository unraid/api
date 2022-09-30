// @ts-check

/** @type {import('eslint').Linter.Config} */
module.exports = {
	root: true,
	plugins: ['@typescript-eslint/eslint-plugin', 'unused-imports'],
	extends: [
		'@unraid/eslint-config/node',
		'plugin:@typescript-eslint/recommended',
		'plugin:import/recommended',
		'plugin:import/typescript',
	],
	rules: {
		'@typescript-eslint/no-redundant-type-constituents': 'off',
		'@typescript-eslint/no-unsafe-call': 'off',
		'@typescript-eslint/naming-convention': 'off',
		'@typescript-eslint/no-unsafe-assignment': 'off',
		'@typescript-eslint/no-unsafe-return': 'off',
		'@typescript-eslint/ban-types': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'unicorn/numeric-separators-style': [
			'error', { number: { minimumDigits: 0, groupLength: 3 } },
		],
		'import/no-cycle': 'off', // Change this to "error" to find circular imports
		'no-unused-vars': 'off',
		'@typescript-eslint/no-non-null-assertion': 'off',
		'@typescript-eslint/no-unused-vars': ['error', {
			argsIgnorePattern: '^_',
			varsIgnorePattern: '^_',
			caughtErrorsIgnorePattern: '^_',
		}],
		'no-use-before-define': 'off',
		'@typescript-eslint/no-use-before-define': ['error'],
	},
	settings: {
		'import/parsers': {
			'@typescript-eslint/parser': ['.ts'],
		},
		'import/resolver': {
			typescript: {
				alwaysTryTypes: true,
			},
		},
	},
};
