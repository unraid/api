import { readFileSync } from 'fs';
import { parse } from 'dotenv';
const envConfig = parse(readFileSync('.env'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

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
          reserved: ['_', '$', 'i', 'my', 't', 'v', 'w', 'x', 'y', 'z'],
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
