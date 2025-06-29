import path from 'path';
import removeConsole from 'vite-plugin-remove-console';

/**
 * Used to avoid redeclaring variables in the webgui codebase.
 * @see alt solution https://github.com/terser/terser/issues/1001, https://github.com/terser/terser/pull/1038
 */
function terserReservations(inputStr: string) {
  const combinations = ['ace'];

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

const charsToReserve = '_$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const assetsDir = path.join(__dirname, '../api/dev/webGui/');

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: {
    publicAssets: [
      {
        baseURL: '/webGui/',
        dir: assetsDir,
      },
    ],
  },
  devServer: {
    port: 4321,
  },

  devtools: {
    enabled: process.env.NODE_ENV === 'development',
  },

  modules: [
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    'nuxt-custom-elements',
    '@nuxt/eslint',
  ],

  // Properly handle ES modules in testing and build environments
  build: {
    transpile: [/node_modules\/.*\.mjs$/],
  },

  ignore: ['/webGui/images'],

  components: [
    { path: '~/components/Brand', prefix: 'Brand' },
    { path: '~/components/ConnectSettings', prefix: 'ConnectSettings' },
    { path: '~/components/UserProfile', prefix: 'Upc' },
    { path: '~/components/UpdateOs', prefix: 'UpdateOs' },
    '~/components',
  ],

  vite: {
    plugins: [
      // Only remove non-critical console methods when VITE_ALLOW_CONSOLE_LOGS is false
      // Keeps console.warn and console.error for debugging purposes
      !process.env.VITE_ALLOW_CONSOLE_LOGS &&
        removeConsole({
          includes: ['log', 'info', 'debug'],
        }),
    ],
    define: {
      'globalThis.__DEV__': process.env.NODE_ENV === 'development',
      __VUE_PROD_DEVTOOLS__: false,
    },
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
            name: 'UnraidConnectSettings',
            path: '@/components/ConnectSettings/ConnectSettings.ce',
          },
          {
            name: 'UnraidDownloadApiLogs',
            path: '@/components/DownloadApiLogs.ce',
          },
          {
            name: 'UnraidHeaderOsVersion',
            path: '@/components/HeaderOsVersion.ce',
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
            name: 'UnraidUpdateOs',
            path: '@/components/UpdateOs.ce',
          },
          {
            name: 'UnraidDowngradeOs',
            path: '@/components/DowngradeOs.ce',
          },
          {
            name: 'UnraidRegistration',
            path: '@/components/Registration.ce',
          },
          {
            name: 'UnraidWanIpCheck',
            path: '@/components/WanIpCheck.ce',
          },
          {
            name: 'UnraidWelcomeModal',
            path: '@/components/Activation/WelcomeModal.ce',
          },
          {
            name: 'UnraidSsoButton',
            path: '@/components/SsoButton.ce',
          },
          {
            name: 'UnraidLogViewer',
            path: '@/components/Logs/LogViewer.ce',
          },
          {
            name: 'UnraidThemeSwitcher',
            path: '@/components/ThemeSwitcher.ce',
          },
          {
            name: 'UnraidApiKeyManager',
            path: '@/components/ApiKeyPage.ce',
          },
        ],
      },
    ],
  },

  compatibilityDate: '2024-12-05',

  ssr: false,
});
