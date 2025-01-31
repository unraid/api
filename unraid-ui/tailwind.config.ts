import tailwindRemToRem from './src/lib/tailwind-rem-to-rem';
import type { Config } from 'tailwindcss';
import { unraidPreset } from './src/theme/preset';

export default {
  presets: [unraidPreset],
  content: [
    './src/components/**/*.{js,vue,ts}',
    './src/composables/**/*.{js,vue,ts}',
    './stories/**/*.stories.{js,ts,jsx,tsx,mdx}',
    './index.html',
  ],
  safelist: [
    'dark',
    'DropdownWrapper_blip',
    'unraid_mark_1',
    'unraid_mark_2',
    'unraid_mark_3',
    'unraid_mark_4',
    'unraid_mark_6',
    'unraid_mark_7',
    'unraid_mark_8',
    'unraid_mark_9',
    {
      pattern: /^text-(header-text-secondary|orange-dark)$/,
      variants: ['group-hover', 'group-focus'],
    },
    {
      pattern: /^(underline|no-underline)$/,
      variants: ['group-hover', 'group-focus'],
    },
  ],
  plugins: [tailwindRemToRem({ baseFontSize: 16, newFontSize: process.env.REM_PLUGIN ? 10 : 16 })],
} satisfies Partial<Config>;
