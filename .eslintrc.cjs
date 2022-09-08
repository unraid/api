// @ts-check

/** @type {import('eslint').Linter.Config} */
module.exports = {
	root: true,
	extends: [
		'@unraid/eslint-config/node',
	],
	plugins: ['eslint-plugin-import'],
	rules: {
		'@typescript-eslint/no-redundant-type-constituents': 'off',
		'@typescript-eslint/no-unsafe-call': 'off',
		'@typescript-eslint/naming-convention': 'off',
		'@typescript-eslint/no-unsafe-assignment': 'off',
		'@typescript-eslint/no-unsafe-return': 'off',
		'@typescript-eslint/ban-types': 'off',
		'import/no-cycle': ['error', { ignoreExternal: true }],
	},
};
