// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devServer: {
    port: 4321,
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
  runtimeConfig: {
    public: { // will be exposed to the client-side
      callbackKey: 'Uyv2o8e*FiQe8VeLekTqyX6Z*8XonB', // set in .env – https://nuxt.com/docs/guide/going-further/runtime-config#environment-variables
    }
  },
  customElements: {
    entries: [
      {
        name: 'ConnectComponents',
        tags: [
          {
            name: 'ConnectAuth',
            path: '@/components/Auth.ce',
          },
          {
            name: 'ConnectDownloadApiLogs',
            path: '@/components/DownloadApiLogs.ce',
          },
          {
            name: 'ConnectKeyActions',
            path: '@/components/KeyActions.ce',
          },
          {
            name: 'ConnectModals',
            path: '@/components/Modals.ce',
          },
          {
            name: 'ConnectUserProfile',
            path: '@/components/UserProfile.ce',
          },
          {
            name: 'ConnectWanIpCheck',
            path: '@/components/WanIpCheck.ce',
          },
        ],
      },
   ],
 },
});
