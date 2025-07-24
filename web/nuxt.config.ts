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

// REMOVED: No longer needed with standalone mount approach
// const createWebComponentTag = (name: string, path: string, appContext: string) => ({
//   async: false,
//   name,
//   path,
//   appContext
// });

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

// REMOVED: No longer needed with standalone mount approach
// const applySharedViteConfig = (config: UserConfig, includeJQueryIsolation = false) => {
//   if (!config.plugins) config.plugins = [];
//   if (!config.define) config.define = {};
//   if (!config.build) config.build = {};
//
//   // Add shared plugins
//   config.plugins.push(...getSharedPlugins(includeJQueryIsolation));
//
//   // Merge define values
//   Object.assign(config.define, sharedDefine);
//
//   // Apply build configuration
//   config.build.minify = 'terser';
//   config.build.terserOptions = sharedTerserOptions;
//
//   return config;
// };

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devServer: {
    port: 3000,
  },

  css: ['@/assets/main.css'],

  devtools: {
    enabled: process.env.NODE_ENV === 'development',
  },

  modules: ['@vueuse/nuxt', '@pinia/nuxt', '@nuxt/eslint', '@nuxt/ui'],

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


  compatibilityDate: '2024-12-05',

  ssr: false,
  
  // Configure for static generation
  nitro: {
    preset: 'static',
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
});
