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
  runtimeConfig: {
    public: { // will be exposed to the client-side
      callbackKey: '', // set in .env – https://nuxt.com/docs/guide/going-further/runtime-config#environment-variables
    }
  },
  customElements: {
    entries: [
      {
        name: 'ConnectComponents',
        tags: [
          {
            name: 'ConnectUserProfile',
            path: '@/components/UserProfile.ce',
          },
          {
            name: 'ConnectAuth',
            path: '@/components/Auth.ce',
          },
          {
            name: 'ConnectKeyActions',
            path: '@/components/KeyActions.ce',
          },
          {
            name: 'ConnectLaunchpad',
            path: '@/components/Launchpad.ce',
          },
          {
            name: 'ConnectPluginPromo',
            path: '@/components/PluginPromo.ce',
          },
          {
            name: 'ConnectWanIpCheck',
            path: '@/components/WanIpCheck.ce',
          },
          {
            name: 'ConnectCallbackHandler',
            path: '@/components/CallbackHandler.ce',
          },
        ],
      },
   ],
 },
});
