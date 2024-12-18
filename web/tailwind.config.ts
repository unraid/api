import 'dotenv/config';
import type { Config } from 'tailwindcss';
import type { PluginAPI } from 'tailwindcss/types/config';

// @ts-expect-error - just trying to get this to build @fixme
export default <Partial<Config>>{
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    '../unraid-ui/src/**/*.{vue,ts}',
  ],
  darkMode: ['selector'],
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
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: 'clear-sans,ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
      },
      colors: {
        inherit: 'inherit',
        transparent: 'transparent',

        black: '#1c1b1b',
        'grey-darkest': '#222',
        'grey-darker': '#606f7b',
        'grey-dark': '#383735',
        'grey-mid': '#999999',
        grey: '#e0e0e0',
        'grey-light': '#dae1e7',
        'grey-lighter': '#f1f5f8',
        'grey-lightest': '#f2f2f2',
        white: '#ffffff',

        // unraid colors
        'yellow-accent': '#E9BF41',
        'orange-dark': '#f15a2c',
        orange: '#ff8c2f',
        // palettes generated from https://uicolors.app/create
        'unraid-red': {
          DEFAULT: '#E22828',
          '50': '#fef2f2',
          '100': '#ffe1e1',
          '200': '#ffc9c9',
          '300': '#fea3a3',
          '400': '#fc6d6d',
          '500': '#f43f3f',
          '600': '#e22828',
          '700': '#bd1818',
          '800': '#9c1818',
          '900': '#821a1a',
          '950': '#470808',
        },

        'unraid-green': {
          DEFAULT: '#63A659',
          '50': '#f5f9f4',
          '100': '#e7f3e5',
          '200': '#d0e6cc',
          '300': '#aad1a4',
          '400': '#7db474',
          '500': '#63a659',
          '600': '#457b3e',
          '700': '#396134',
          '800': '#314e2d',
          '900': '#284126',
          '950': '#122211',
        },
        'header-text-primary': 'var(--header-text-primary)',
        'header-text-secondary': 'var(--header-text-secondary)',
        'header-background-color': 'var(--header-background-color)',
        // ShadCN
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      // Unfortunately due to webGUI CSS setting base HTML font-size to .65% or something we must use pixel values for web components
      fontSize: {
        '10px': '10px',
        '12px': '12px',
        '14px': '14px',
        '16px': '16px',
        '18px': '18px',
        '20px': '20px',
        '24px': '24px',
        '30px': '30px',
      },
      spacing: {
        '4.5': '1.125rem',
        '-8px': '-8px',
        '2px': '2px',
        '4px': '4px',
        '6px': '6px',
        '8px': '8px',
        '10px': '10px',
        '12px': '12px',
        '14px': '14px',
        '16px': '16px',
        '20px': '20px',
        '24px': '24px',
        '28px': '28px',
        '32px': '32px',
        '36px': '36px',
        '40px': '40px',
        '64px': '64px',
        '80px': '80px',
        '90px': '90px',
        '150px': '150px',
        '160px': '160px',
        '200px': '200px',
        '260px': '260px',
        '300px': '300px',
        '310px': '310px',
        '350px': '350px',
        '448px': '448px',
        '512px': '512px',
        '640px': '640px',
        '800px': '800px',
      },
      minWidth: {
        '86px': '86px',
        '160px': '160px',
        '260px': '260px',
        '300px': '300px',
        '310px': '310px',
        '350px': '350px',
        '800px': '800px',
      },
      maxWidth: {
        '86px': '86px',
        '160px': '160px',
        '260px': '260px',
        '300px': '300px',
        '310px': '310px',
        '350px': '350px',
        '640px': '640px',
        '800px': '800px',
        '1024px': '1024px',
      },
      screens: {
        '2xs': '470px',
        xs: '530px',
        tall: { raw: '(min-height: 700px)' },
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'collapsible-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'collapsible-down': 'collapsible-down 0.2s ease-in-out',
        'collapsible-up': 'collapsible-up 0.2s ease-in-out',
      },
      /**
       * @todo modify prose classes to use pixels for webgui…sadge https://tailwindcss.com/docs/typography-plugin#customizing-the-default-theme
       */

      typography: (theme: PluginAPI['theme']) => ({
        DEFAULT: {
          css: {
            color: theme('colors.foreground'),
            a: {
              color: theme('colors.primary'),
              textDecoration: 'underline',
              '&:hover': {
                color: theme('colors.primary-foreground'),
              },
            },
            '--tw-prose-body': theme('colors.foreground'),
            '--tw-prose-headings': theme('colors.foreground'),
            '--tw-prose-lead': theme('colors.foreground'),
            '--tw-prose-links': theme('colors.primary'),
            '--tw-prose-bold': theme('colors.foreground'),
            '--tw-prose-counters': theme('colors.foreground'),
            '--tw-prose-bullets': theme('colors.foreground'),
            '--tw-prose-hr': theme('colors.foreground'),
            '--tw-prose-quotes': theme('colors.foreground'),
            '--tw-prose-quote-borders': theme('colors.foreground'),
            '--tw-prose-captions': theme('colors.foreground'),
            '--tw-prose-code': theme('colors.foreground'),
            '--tw-prose-pre-code': theme('colors.foreground'),
            '--tw-prose-pre-bg': theme('colors.background'),
            '--tw-prose-th-borders': theme('colors.foreground'),
            '--tw-prose-td-borders': theme('colors.foreground'),
            '--tw-prose-invert-body': theme('colors.background'),
            '--tw-prose-invert-headings': theme('colors.background'),
            '--tw-prose-invert-lead': theme('colors.background'),
            '--tw-prose-invert-links': theme('colors.primary'),
            '--tw-prose-invert-bold': theme('colors.background'),
            '--tw-prose-invert-counters': theme('colors.background'),
            '--tw-prose-invert-bullets': theme('colors.background'),
            '--tw-prose-invert-hr': theme('colors.background'),
            '--tw-prose-invert-quotes': theme('colors.background'),
            '--tw-prose-invert-quote-borders': theme('colors.background'),
            '--tw-prose-invert-captions': theme('colors.background'),
            '--tw-prose-invert-code': theme('colors.background'),
            '--tw-prose-invert-pre-code': theme('colors.background'),
            '--tw-prose-invert-pre-bg': theme('colors.foreground'),
            '--tw-prose-invert-th-borders': theme('colors.background'),
            '--tw-prose-invert-td-borders': theme('colors.background'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('./utils/tailwind-rem-to-rem').default({
      baseFontSize: 16,
      /**
       * The font size where the web components will be rendered in production.
       * Required due to the webgui using the 62.5% font-size "trick".
       * Set an env to 16 for local development and 10 for everything else.
       */
      newFontSize: process.env.VITE_TAILWIND_BASE_FONT_SIZE ?? 10,
    }),
  ],
  //presets: [require('../unraid-ui/tailwind.config.js')],
};
