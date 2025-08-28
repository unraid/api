import { defineNuxtPlugin, useAppConfig } from '#app';
import ui from '@nuxt/ui/vue-plugin';

export default defineNuxtPlugin({
  name: 'nuxt-ui-vue-mode',
  enforce: 'pre', // Run before other plugins
  setup(nuxtApp) {
    // Get the app config
    const appConfig = useAppConfig();
    
    // Provide the app config globally BEFORE initializing the plugin
    nuxtApp.vueApp.config.globalProperties.$appConfig = appConfig;
    
    // Also make it available on window for the composable fallback
    if (typeof window !== 'undefined') {
      (window as typeof globalThis & { appConfig?: typeof appConfig }).appConfig = appConfig;
    }
    
    // Use Nuxt UI in Vue mode - the vue-plugin provides stubs for Nuxt-specific imports
    nuxtApp.vueApp.use(ui, {
      prefix: 'U',
      // Pass the config directly to the plugin
      appConfig
    });
    
    // Provide after plugin initialization for components
    nuxtApp.vueApp.provide('appConfig', appConfig);
  }
});
