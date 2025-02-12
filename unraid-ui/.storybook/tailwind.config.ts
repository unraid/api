import baseConfig from '../tailwind.config';

export default {
  ...baseConfig,
  content: [
    '../src/components/**/*.{js,vue,ts}',
    '../src/components/**/*.ce.{js,vue,ts}',
    '../src/composables/**/*.{js,vue,ts}',
    '../stories/**/*.stories.{js,ts,jsx,tsx,mdx}',
  ],
};
