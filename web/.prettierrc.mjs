/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: "es5",
  tabWidth: 4,
  printWidth: 105,
  singleQuote: true,
  plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
