import tailwindRemToRem from '@unraid/tailwind-rem-to-rem';
import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';
/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { unraidPreset } from './src/theme/preset';

export default {
  darkMode: ['class', 'selector'],
  presets: [unraidPreset],
  content: [
    './src/components/**/*.{js,vue,ts}',
    './src/components/**/*.ce.{js,vue,ts}',
    './src/composables/**/*.{js,vue,ts}',
    './stories/**/*.stories.{js,ts,jsx,mdx}',
    './index.html',
  ],
  plugins: [
    tailwindRemToRem({
      baseFontSize: 16,
      newFontSize: Number(process.env.VITE_TAILWIND_BASE_FONT_SIZE ?? 10),
    }),
    tailwindcssAnimate,
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--reka-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--reka-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
} satisfies Config;
