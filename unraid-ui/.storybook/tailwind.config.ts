import baseConfig from "../tailwind.config";

export default {
  ...baseConfig,
  content: [
    ...baseConfig.content,
    "../stories/**/*.{js,ts,jsx,tsx,mdx}",
    "../.storybook/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};
