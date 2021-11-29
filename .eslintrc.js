module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    extends: [
        '@unraid'
    ],
    rules: {
        curly: ["error", "multi-line"],
        "@typescript-eslint/member-ordering": ["off"]
    }
};