// @ts-check

/** @type {import('eslint').Linter.Config} */
module.exports = {
	root: true,

	extends: [
		'@unraid'
	],
	rules: {
		curly: ['error', 'multi-line'],
		quotes: [2, 'single', { avoidEscape: true }]
	},
	overrides: [{
		files: ['*.ts', '*.tsx'],
		parser: '@typescript-eslint/parser',
		rules: {
			'@typescript-eslint/member-ordering': ['off']
		}
	}]
};
