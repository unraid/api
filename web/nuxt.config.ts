import { readFileSync } from 'fs';
import { parse } from 'dotenv';
const envConfig = parse(readFileSync('.env'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

/**
 * Used to avoid redeclaring variables in the webgui codebase.
 * @see alt solution https://github.com/terser/terser/issues/1001, https://github.com/terser/terser/pull/1038
 */
function terserReservations (inputStr) {
  const combinations = [];

  // Add 1-character combinations
  for (let i = 0; i < inputStr.length; i++) {
    combinations.push(inputStr[i]);
  }

  // Add 2-character combinations
  for (let i = 0; i < inputStr.length; i++) {
    for (let j = 0; j < inputStr.length; j++) {
      combinations.push(inputStr[i] + inputStr[j]);
    }
  }

  return combinations;
}

const charsToReserve = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devServer: {
    port: 4321,
  },
  devtools: {
    enabled: true,
  },
  modules: [
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    'nuxt-custom-elements',
  ],
  components: [
    { path: '~/components/Brand', prefix: 'Brand' },
    { path: '~/components/UserProfile', prefix: 'Upc' },
    '~/components',
  ],
  vite: {
    build: {
      minify: 'terser',
      terserOptions: {
        mangle: {
          reserved: terserReservations(charsToReserve),
          toplevel: true,
        },
      },
    },
  },
  customElements: {
    entries: [
      {
        name: 'UnraidComponents',
        tags: [
          {
            name: 'UnraidI18nHost',
            path: '@/components/I18nHost.ce',
          },
          {
            name: 'UnraidAuth',
            path: '@/components/Auth.ce',
          },
          {
            name: 'UnraidDownloadApiLogs',
            path: '@/components/DownloadApiLogs.ce',
          },
          {
            name: 'UnraidKeyActions',
            path: '@/components/KeyActions.ce',
          },
          {
            name: 'UnraidModals',
            path: '@/components/Modals.ce',
          },
          {
            name: 'UnraidUserProfile',
            path: '@/components/UserProfile.ce',
          },
          {
            name: 'UnraidWanIpCheck',
            path: '@/components/WanIpCheck.ce',
          },
        ],
      },
    ],
  },
});
