module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    extends: [
        '@unraid',
        "plugin:unicorn/recommended"
    ],
    rules: {
        "unicorn/prefer-node-protocol": "error",
        "unicorn/no-null": "off",
        "unicorn/prevent-abbreviations": "off"
    }
};