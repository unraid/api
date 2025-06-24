import tailwindRemToRem from '@unraid/tailwind-rem-to-rem';
import tailwindConfig from '@unraid/ui/tailwind.config.ts';
import type { Config } from 'tailwindcss';

export default {
  presets: [tailwindConfig],
  content: [
    // Web components
    './components/**/*.ce.{js,vue,ts}',
    // Regular Vue components
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
  ],

  plugins: [
    tailwindRemToRem({
      baseFontSize: 16,
      /**
       * The font size where the web components will be rendered in production.
       * Required due to the webgui using the 62.5% font-size "trick".
       * Set an env to 16 for local development and 10 for everything else.
       */
      newFontSize: Number(process.env.VITE_TAILWIND_BASE_FONT_SIZE ?? 10),
    }),
  ],
  theme: {
    extend: {
      // web-specific extensions only
    },
  },
} satisfies Partial<Config>;
