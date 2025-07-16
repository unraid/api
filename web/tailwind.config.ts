import tailwindConfig from '@unraid/ui/tailwind.config.ts';

import type { Config } from 'tailwindcss';

const config: Config = {
  presets: [tailwindConfig],
  content: [
    // Web components
    './components/**/*.ce.{js,vue,ts}',
    // Regular Vue components
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
  ],
};

export default config;
