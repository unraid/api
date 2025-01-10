import 'dotenv/config';
import tailwindConfig from '@unraid/ui/tailwind.config';
import type { Config } from 'tailwindcss';
import remToRem from './utils/tailwind-rem-to-rem';

export default {
  presets: [tailwindConfig],
  content: [
    './components/**/*.{js,vue,ts}',
    './components/**/*.ce.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    '../unraid-ui/src/components/**/*.{js,vue,ts}',
    '../unraid-ui/src/components/**/*.ce.{js,vue,ts}',
  ],
  mode: 'jit',
  safelist: [
    {
      pattern: /^text-(header-text-secondary|orange-dark)$/, // need to be specific or build gets slow
      variants: ['group-hover', 'group-focus'],
    },
    {
      pattern: /^(underline|no-underline)$/,
      variants: ['group-hover', 'group-focus'],
    },
  ],
  plugins: [
    remToRem({
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
