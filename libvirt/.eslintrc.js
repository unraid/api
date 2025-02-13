module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.json']
	},
	plugins: [
		'@typescript-eslint',
		'unicorn'
	],
	extends: [
		'xo',
		'xo-typescript',
		'plugin:@typescript-eslint/recommended-requiring-type-checking'
	],
	rules: {
		'object-curly-spacing': ['error', 'always'],
		'@typescript-eslint/object-curly-spacing': ['error', 'always'],
		'@typescript-eslint/restrict-template-expressions': ['warn', { allowNumber: true, allowBoolean: true }]
	},
	ignorePatterns: [
		'styleguide',
		'dist',
		'examples',
		'lib/bindings.d.ts'
	]
};
