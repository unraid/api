import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import removeConsole from 'vite-plugin-remove-console';

import type { PluginOption, UserConfig } from 'vite';

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

const dropConsole = process.env.VITE_ALLOW_CONSOLE_LOGS !== 'true';
console.log(dropConsole ? 'WARN: Console logs are disabled' : 'INFO: Console logs are enabled');

const assetsDir = path.join(__dirname, '../api/dev/webGui/');

/**
 * Create a tag configuration
 */
const createWebComponentTag = (name: string, path: string, appContext: string) => ({
  async: false,
  name,
  path,
  appContext
});

/**
 * Shared terser options for consistent minification
 */
const sharedTerserOptions = {
  mangle: {
    reserved: terserReservations(charsToReserve),
    toplevel: true,
  },
};

/**
 * Shared plugins configuration
 */
const getSharedPlugins = (includeJQueryIsolation = false) => {
  const plugins: PluginOption[] = [];

  // Add Tailwind CSS plugin
  plugins.push(tailwindcss());

  // Remove console logs in production
  if (dropConsole) {
    plugins.push(
      removeConsole({
        includes: ['log', 'info', 'debug'],
      })
    );
  }

  // Add jQuery isolation plugin for custom elements
  if (includeJQueryIsolation) {
    plugins.push({
      name: 'jquery-isolation',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generateBundle(options: any, bundle: any) {
        // Find the main JS file
        const jsFile = Object.keys(bundle).find((key) => key.endsWith('.js'));
        if (jsFile && bundle[jsFile] && 'code' in bundle[jsFile]) {
          const originalCode = bundle[jsFile].code;
          // Wrap the entire bundle to preserve and restore jQuery
          bundle[jsFile].code = `
(function() {
  // Preserve the original jQuery $ if it exists
  var originalJQuery = (typeof window !== 'undefined' && typeof window.$ !== 'undefined') ? window.$ : undefined;
  
  // Temporarily clear $ to avoid conflicts
  if (typeof window !== 'undefined' && typeof window.$ !== 'undefined') {
    window.$ = undefined;
  }
  
  // Execute the web component code
  ${originalCode}
  
  // Restore jQuery $ if it was originally defined
  if (originalJQuery !== undefined && typeof window !== 'undefined') {
    window.$ = originalJQuery;
  }
})();
`;
        }
      },
    });
  }

  return plugins.filter(Boolean);
};

/**
 * Shared define configuration
 */
const sharedDefine = {
  'globalThis.__DEV__': process.env.NODE_ENV === 'development',
  __VUE_PROD_DEVTOOLS__: false,
};

/**
 * Apply shared Vite configuration to a config object
 */
const applySharedViteConfig = (config: UserConfig, includeJQueryIsolation = false) => {
  if (!config.plugins) config.plugins = [];
  if (!config.define) config.define = {};
  if (!config.build) config.build = {};

  // Add shared plugins
  config.plugins.push(...getSharedPlugins(includeJQueryIsolation));

  // Merge define values
  Object.assign(config.define, sharedDefine);

  // Apply build configuration
  config.build.minify = 'terser';
  config.build.terserOptions = sharedTerserOptions;

  return config;
};

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: {
    publicAssets: [
      {
        baseURL: '/webGui/',
        dir: assetsDir,
      },
    ],
    devProxy: {
      '/graphql': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        secure: false,
        // Important: preserve the host header
        headers: {
          'X-Forwarded-Host': 'localhost:3000',
          'X-Forwarded-Proto': 'http',
          'X-Forwarded-For': '127.0.0.1',
        },
      },
    },
  },
  devServer: {
    port: 3000,
  },

  css: ['@/assets/main.css'],

  devtools: {
    enabled: process.env.NODE_ENV === 'development',
  },

  modules: ['@vueuse/nuxt', '@pinia/nuxt', 'nuxt-custom-elements', '@nuxt/eslint', '@nuxt/ui'],

  ui: {
    theme: {
      colors: ['primary'],
    },
  },

  // Disable auto-imports
  imports: {
    autoImport: false,
  },

  // Properly handle ES modules in testing and build environments
  build: {
    transpile: [/node_modules\/.*\.mjs$/],
  },

  ignore: ['/webGui/images'],

  // Disable component auto-imports
  components: false,

  vite: {
    plugins: getSharedPlugins(),
    define: sharedDefine,
    build: {
      minify: 'terser',
      terserOptions: sharedTerserOptions,
    },
  },

  customElements: {
    analyzer: process.env.NODE_ENV !== 'test',
    entries: [
      // @ts-expect-error The nuxt-custom-elements module types don't perfectly match our configuration object structure.
      // The custom elements configuration requires specific properties and methods that may not align with the
      // module's TypeScript definitions, particularly around the viteExtend function and tag configuration format.
      {
        name: 'UnraidComponents',
        viteExtend(config: UserConfig) {
          const sharedConfig = applySharedViteConfig(config, true);
          
          // Optimize CSS while keeping it inlined for functionality
          if (!sharedConfig.css) sharedConfig.css = {};
          sharedConfig.css.devSourcemap = process.env.NODE_ENV === 'development';
          
          return sharedConfig;
        },
        tags: [
          createWebComponentTag('UnraidAuth', '@/components/Auth.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidConnectSettings', '@/components/ConnectSettings/ConnectSettings.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidDownloadApiLogs', '@/components/DownloadApiLogs.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidHeaderOsVersion', '@/components/HeaderOsVersion.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidModals', '@/components/Modals.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidUserProfile', '@/components/UserProfile.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidUpdateOs', '@/components/UpdateOs.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidDowngradeOs', '@/components/DowngradeOs.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidRegistration', '@/components/Registration.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidWanIpCheck', '@/components/WanIpCheck.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidWelcomeModal', '@/components/Activation/WelcomeModal.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidSsoButton', '@/components/SsoButton.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidLogViewer', '@/components/Logs/LogViewer.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidThemeSwitcher', '@/components/ThemeSwitcher.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidApiKeyManager', '@/components/ApiKeyPage.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidDevModalTest', '@/components/DevModalTest.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidApiKeyAuthorize', '@/components/ApiKeyAuthorize.ce', '@/components/Wrapper/web-component-plugins'),
          createWebComponentTag('UnraidConfigDownload', '@/components/ConfigDownload/ConfigDownloadManager.ce', '@/components/Wrapper/web-component-plugins'),
        ],
      },
    ],
  },

  compatibilityDate: '2024-12-05',

  ssr: false,
});
