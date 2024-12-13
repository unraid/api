import baseConfig from "../tailwind.config";

export default {
  ...baseConfig,
  content: [
    "../src/**/*.{vue,js,ts,jsx,tsx}",
    "../stories/**/*.{js,ts,jsx,tsx,mdx}",
    "../.storybook/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};
