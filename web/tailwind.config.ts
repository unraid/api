import 'dotenv/config';
import type { Config } from 'tailwindcss';
import type { PluginAPI } from 'tailwindcss/types/config';


// @ts-expect-error - just trying to get this to build @fixme
export default <Partial<Config>>{
  darkMode: ['class'],
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
        lime: '#63A659',
        'orange-dark': '#f15a2c',
        orange: '#ff8c2f',
        'unraid-red': '#E22828',

        alpha: 'var(--color-alpha)',
        beta: 'var(--color-beta)',
        gamma: 'var(--color-gamma)',
        'gamma-opaque': 'var(--color-gamma-opaque)',

        // shadcn specific
        border: 'hsl(0 0% 89.8%)',
        input: 'hsl(0 0% 89.8%)',
        ring: 'hsl(0 0% 3.9%)',
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(0 0% 3.9%)',
        primary: {
          DEFAULT: 'hsl(0 0% 9%)',
          foreground: 'hsl(0 0% 98%)',
        },
        secondary: {
          DEFAULT: 'hsl(0 0% 96.1%)',
          foreground: 'hsl(0 0% 9%)',
        },
        destructive: {
          DEFAULT: 'hsl(0 84.2% 60.2%)',
          foreground: 'hsl(0 0% 98%)',
        },
        muted: {
          DEFAULT: 'hsl(0 0% 96.1%)',
          foreground: 'hsl(0 0% 45.1%)',
        },
        accent: {
          DEFAULT: 'hsl(0 0% 96.1%)',
          foreground: 'hsl(0 0% 9%)',
        },
        popover: {
          DEFAULT: 'hsl(0 0% 100%)',
          foreground: 'hsl(0 0% 3.9%)',
        },
        card: {
          DEFAULT: 'hsl(0 0% 100%)',
          foreground: 'hsl(0 0% 3.9%)',
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
            color: theme('colors.beta'),
            a: {
              color: theme('colors.orange'),
              textDecoration: 'underline',
              '&:hover': {
                color: theme('colors.orange-dark'),
              },
            },
            '--tw-prose-body': theme('colors.beta'),
            '--tw-prose-headings': theme('colors.beta'),
            '--tw-prose-lead': theme('colors.beta'),
            '--tw-prose-links': theme('colors.orange'),
            '--tw-prose-bold': theme('colors.beta'),
            '--tw-prose-counters': theme('colors.beta'),
            '--tw-prose-bullets': theme('colors.beta'),
            '--tw-prose-hr': theme('colors.beta'),
            '--tw-prose-quotes': theme('colors.beta'),
            '--tw-prose-quote-borders': theme('colors.beta'),
            '--tw-prose-captions': theme('colors.beta'),
            '--tw-prose-code': theme('colors.beta'),
            '--tw-prose-pre-code': theme('colors.beta'),
            '--tw-prose-pre-bg': theme('colors.alpha'),
            '--tw-prose-th-borders': theme('colors.beta'),
            '--tw-prose-td-borders': theme('colors.beta'),
            '--tw-prose-invert-body': theme('colors.alpha'),
            '--tw-prose-invert-headings': theme('colors.alpha'),
            '--tw-prose-invert-lead': theme('colors.alpha'),
            '--tw-prose-invert-links': theme('colors.orange'),
            '--tw-prose-invert-bold': theme('colors.alpha'),
            '--tw-prose-invert-counters': theme('colors.alpha'),
            '--tw-prose-invert-bullets': theme('colors.alpha'),
            '--tw-prose-invert-hr': theme('colors.alpha'),
            '--tw-prose-invert-quotes': theme('colors.alpha'),
            '--tw-prose-invert-quote-borders': theme('colors.alpha'),
            '--tw-prose-invert-captions': theme('colors.alpha'),
            '--tw-prose-invert-code': theme('colors.alpha'),
            '--tw-prose-invert-code-bg': theme('colors.gamma-opaque'),
            '--tw-prose-invert-pre-code': theme('colors.alpha'),
            '--tw-prose-invert-pre-bg': theme('colors.beta'),
            '--tw-prose-invert-th-borders': theme('colors.alpha'),
            '--tw-prose-invert-td-borders': theme('colors.alpha'),
          },
        },
        black: {
          css: {
            '--tw-prose-body': theme('colors.black'),
            '--tw-prose-headings': theme('colors.black'),
            '--tw-prose-lead': theme('colors.black'),
            '--tw-prose-links': theme('colors.black'),
            '--tw-prose-bold': theme('colors.black'),
            '--tw-prose-counters': theme('colors.black'),
            '--tw-prose-bullets': theme('colors.black'),
            '--tw-prose-hr': theme('colors.black'),
            '--tw-prose-quotes': theme('colors.black'),
            '--tw-prose-quote-borders': theme('colors.black'),
            '--tw-prose-captions': theme('colors.black'),
            '--tw-prose-code': theme('colors.black'),
            '--tw-prose-pre-code': theme('colors.black'),
            '--tw-prose-pre-bg': theme('colors.black'),
            '--tw-prose-th-borders': theme('colors.black'),
            '--tw-prose-td-borders': theme('colors.black'),
            '--tw-prose-invert-body': theme('colors.grey-darkest'),
            '--tw-prose-invert-headings': theme('colors.grey-darkest'),
            '--tw-prose-invert-lead': theme('colors.grey-darkest'),
            '--tw-prose-invert-links': theme('colors.grey-darkest'),
            '--tw-prose-invert-bold': theme('colors.grey-darkest'),
            '--tw-prose-invert-counters': theme('colors.grey-darkest'),
            '--tw-prose-invert-bullets': theme('colors.grey-darkest'),
            '--tw-prose-invert-hr': theme('colors.grey-darkest'),
            '--tw-prose-invert-quotes': theme('colors.grey-darkest'),
            '--tw-prose-invert-quote-borders': theme('colors.grey-darkest'),
            '--tw-prose-invert-captions': theme('colors.grey-darkest'),
            '--tw-prose-invert-code': theme('colors.grey-darkest'),
            '--tw-prose-invert-pre-code': theme('colors.grey-darkest'),
            '--tw-prose-invert-pre-bg': 'rgb(0 0 0 / 50%)',
            '--tw-prose-invert-th-borders': theme('colors.grey-darkest'),
            '--tw-prose-invert-td-borders': theme('colors.grey-darkest'),
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
};
